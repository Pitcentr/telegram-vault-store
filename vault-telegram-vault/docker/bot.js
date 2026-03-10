import { Bot, InlineKeyboard } from "grammy";
import PocketBase from "pocketbase";
import dotenv from "dotenv";
import Fuse from "fuse.js";
import crypto from "crypto";

// ====================== КОНФИГУРАЦИЯ ======================
dotenv.config();

const REQUIRED_ENV = ['TG_TOKEN', 'PB_URL', 'PB_ADMIN', 'PB_PASSWORD', 'MASTER_PASSWORD', 'ALLOWED_USERS'];
const AUTO_DELETE_TIMEOUT = 60000; // 60 секунд

// ====================== УТИЛИТЫ ======================
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
  if (data) console.dir(data, { depth: null });
}

function normalizeUrl(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    // Убираем www. и query/hash
    let hostname = urlObj.hostname.replace(/^www\./i, '');
    return `${urlObj.protocol}//${hostname}${urlObj.pathname}`.replace(/\/$/, '');
  } catch {
    return url.trim();
  }
}

function getKey() {
  return crypto.createHash("sha256").update(process.env.MASTER_PASSWORD).digest();
}

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex");

  return { encrypted, iv: iv.toString("hex"), tag };
}

function decrypt(encrypted, ivHex, tagHex) {
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    throw new Error("Ошибка расшифровки (возможно, повреждённые данные)");
  }
}

function autoDelete(chatId, messageId, delay = AUTO_DELETE_TIMEOUT) {
  setTimeout(() => {
    bot.api.deleteMessage(chatId, messageId).catch(() => {});
  }, delay);
}

// ====================== ГЛАВНАЯ ФУНКЦИЯ ======================
async function main() {
  // Проверка переменных окружения
  const missing = REQUIRED_ENV.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('⚠️  ОТСУТСТВУЮТ ОБЯЗАТЕЛЬНЫЕ ПЕРЕМЕННЫЕ:');
    console.error(missing.join(', '));
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Настройте в Umbrel → Apps → Telegram Vault → Settings');
    
    while (true) {
      await new Promise(r => setTimeout(r, 60000));
      console.log('[' + new Date().toISOString() + '] Ожидание конфигурации...');
    }
  }

  const allowedUsers = process.env.ALLOWED_USERS.split(',').map(id => id.trim());

  log('INFO', `Запуск Telegram Vault. Разрешено пользователей: ${allowedUsers.length}`);

  const bot = new Bot(process.env.TG_TOKEN);
  const pb = new PocketBase(process.env.PB_URL);

  // Аутентификация в PocketBase
  try {
    await pb.collection("_superusers").authWithPassword(process.env.PB_ADMIN, process.env.PB_PASSWORD);
    log('INFO', 'Успешная аутентификация в PocketBase');
  } catch (err) {
    log('ERROR', 'Не удалось авторизоваться в PocketBase', err.message);
    process.exit(1);
  }

  // ==================== ИНИЦИАЛИЗАЦИЯ + МИГРАЦИЯ БД ====================
  await initDatabase(pb);

  // Хранилище ожидающих подтверждений (перезапись)
  const pendingConfirmations = new Map();

  // Автоочистка устаревших подтверждений
  setInterval(() => {
    const now = Date.now();
    for (const [userId, data] of pendingConfirmations.entries()) {
      if (now - data.timestamp > 120000) pendingConfirmations.delete(userId);
    }
  }, 30000);

  // ==================== ХЕЛПЕРЫ (с фильтром по пользователю) ====================
  async function getUserSecrets(userId) {
    return pb.collection("secrets").getFullList({
      filter: `created_by = "${userId}"`,
      sort: "-created"
    });
  }

  async function findSecrets(userId, searchQuery) {
    const normalized = normalizeUrl(searchQuery);
    const userSecrets = await getUserSecrets(userId);

    // 1. Точное совпадение по URL
    let records = userSecrets.filter(item => item.url === normalized);

    // 2. Поиск по домену
    if (records.length === 0) {
      try {
        const domain = new URL(normalized.startsWith('http') ? normalized : `https://${normalized}`).hostname;
        records = userSecrets.filter(item => {
          try {
            return new URL(item.url).hostname === domain;
          } catch {
            return false;
          }
        });
      } catch {}
    }

    // 3. Fuzzy-поиск
    if (records.length === 0) {
      const fuse = new Fuse(userSecrets, { keys: ["url"], threshold: 0.4 });
      records = fuse.search(normalized).map(r => r.item);
    }

    return records;
  }

  async function saveSecret(userId, url, login, password, comment) {
    const { encrypted, iv, tag } = encrypt(password);
    return pb.collection("secrets").create({
      url: normalizeUrl(url),
      login,
      password_enc: encrypted,
      iv,
      auth_tag: tag,
      comment: comment || "",
      created_by: userId
    });
  }

  // ==================== ОБРАБОТКА СООБЩЕНИЙ ====================
  bot.on("message:text", async (ctx) => {
    const userId = ctx.from.id.toString();
    const username = ctx.from.username || ctx.from.first_name || "Unknown";

    if (!allowedUsers.includes(userId)) {
      log('WARN', `Несанкционированный доступ: ${username} (${userId})`);
      return;
    }

    const text = ctx.message.text.trim();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    try {
      // === СОХРАНЕНИЕ (3+ строки) ===
      if (lines.length >= 3) {
        const [rawUrl, login, password, ...commentParts] = lines;
        const comment = commentParts.join('\n');

        if (password.length < 3) {
          const m = await ctx.reply("❌ Пароль слишком короткий");
          autoDelete(ctx.chat.id, ctx.message.message_id);
          autoDelete(ctx.chat.id, m.message_id);
          return;
        }

        const url = normalizeUrl(rawUrl);

        // Проверяем ТОЛЬКО записи текущего пользователя + точное совпадение URL + логин
        const userSecrets = await getUserSecrets(userId);
        const existing = userSecrets.find(r => r.url === url && r.login === login);

        if (existing) {
          const oldPass = decrypt(existing.password_enc, existing.iv, existing.auth_tag || existing.iv.split(':')[1]);

          pendingConfirmations.set(userId, {
            url, login, password, comment,
            existingId: existing.id,
            timestamp: Date.now()
          });

          const kb = new InlineKeyboard()
            .text("✅ Перезаписать", "overwrite_yes")
            .text("❌ Отмена", "overwrite_no");

          const msg = await ctx.reply(
            `⚠️ Уже есть запись для этого сайта и логина:\n\n` +
            `🌐 ${existing.url}\n` +
            `👤 ${existing.login}\n` +
            `🔑 ${oldPass}\n\n` +
            `Перезаписать новыми данными?`,
            { reply_markup: kb }
          );

          autoDelete(ctx.chat.id, ctx.message.message_id);
          autoDelete(ctx.chat.id, msg.message_id);
          return;
        }

        await saveSecret(userId, url, login, password, comment);
        const msg = await ctx.reply("✅ Пароль успешно сохранён");
        autoDelete(ctx.chat.id, ctx.message.message_id);
        autoDelete(ctx.chat.id, msg.message_id);

        log('INFO', `Сохранён пароль для ${url} пользователем ${username}`);
        return;
      }

      // === ПОИСК (1 строка) ===
      if (lines.length === 1) {
        const records = await findSecrets(userId, lines[0]);

        if (records.length === 0) {
          const m = await ctx.reply("❌ Ничего не найдено");
          autoDelete(ctx.chat.id, ctx.message.message_id);
          autoDelete(ctx.chat.id, m.message_id);
          return;
        }

        for (const record of records) {
          const pass = decrypt(record.password_enc, record.iv, record.auth_tag || record.iv.split(':')[1]);

          const kb = new InlineKeyboard().text("🗑 Удалить", `del_${record.id}`);

          const msg = await ctx.reply(
            `🔐 Найдено:\n\n` +
            `🌐 ${record.url}\n` +
            `👤 ${record.login}\n` +
            `🔑 <code>${pass}</code>\n` +
            `💬 ${record.comment || '—'}`,
            { reply_markup: kb, parse_mode: "HTML" }
          );

          autoDelete(ctx.chat.id, msg.message_id, 90000); // пароли показываем чуть дольше
        }

        autoDelete(ctx.chat.id, ctx.message.message_id);
        log('INFO', `Показаны пароли (${records.length} шт.) для ${username}`);
        return;
      }

      // Неправильный формат
      const helpMsg = await ctx.reply(
        `❌ Неправильный формат!\n\n` +
        `📝 <b>Сохранить пароль:</b>\n` +
        `https://example.com\n` +
        `логин\n` +
        `пароль\n` +
        `комментарий (необязательно)\n\n` +
        `🔍 <b>Найти пароль:</b>\nпросто отправьте ссылку\n\n` +
        `<b>Команды:</b> /list /help`,
        { parse_mode: "HTML" }
      );

      autoDelete(ctx.chat.id, ctx.message.message_id);
      autoDelete(ctx.chat.id, helpMsg.message_id);

    } catch (err) {
      log('ERROR', `Ошибка обработки сообщения от ${username}`, err);
      const m = await ctx.reply("❌ Произошла ошибка при обработке запроса");
      autoDelete(ctx.chat.id, ctx.message.message_id);
      autoDelete(ctx.chat.id, m.message_id);
    }
  });

  // ==================== CALLBACK QUERIES ====================
  bot.callbackQuery("overwrite_yes", async (ctx) => {
    const userId = ctx.from.id.toString();
    const pending = pendingConfirmations.get(userId);

    if (!pending) {
      await ctx.answerCallbackQuery("⏰ Время вышло");
      return;
    }

    try {
      await pb.collection("secrets").delete(pending.existingId);
      await saveSecret(userId, pending.url, pending.login, pending.password, pending.comment);

      await ctx.answerCallbackQuery("✅ Успешно перезаписано");
      await ctx.deleteMessage().catch(() => {});
      pendingConfirmations.delete(userId);

      log('INFO', `Перезаписана запись для ${pending.url}`);
    } catch (err) {
      log('ERROR', 'Ошибка перезаписи', err);
      await ctx.answerCallbackQuery("❌ Ошибка");
    }
  });

  bot.callbackQuery("overwrite_no", async (ctx) => {
    pendingConfirmations.delete(ctx.from.id.toString());
    await ctx.answerCallbackQuery("❌ Отменено");
    await ctx.deleteMessage().catch(() => {});
  });

  bot.callbackQuery(/del_(.+)/, async (ctx) => {
    const userId = ctx.from.id.toString();
    const secretId = ctx.match[1];

    if (!allowedUsers.includes(userId)) {
      await ctx.answerCallbackQuery("⛔ Нет доступа");
      return;
    }

    try {
      await pb.collection("secrets").delete(secretId);
      await ctx.answerCallbackQuery("🗑 Удалено");
      await ctx.deleteMessage().catch(() => {});
      log('INFO', `Удалена запись ${secretId} пользователем ${userId}`);
    } catch (err) {
      await ctx.answerCallbackQuery("❌ Не удалось удалить");
    }
  });

  // ==================== КОМАНДЫ ====================
  bot.command("start", async (ctx) => {
    if (!allowedUsers.includes(ctx.from.id.toString())) return;

    const msg = await ctx.reply(
      `🔐 <b>Telegram Vault</b>\n\n` +
      `Как пользоваться:\n\n` +
      `📝 Сохранить:\n` +
      `https://example.com\nлогин\nпароль\n[комментарий]\n\n` +
      `🔍 Найти:\nотправьте ссылку\n\n` +
      `📋 Все пароли: /list\n\n` +
      `Все сообщения удаляются автоматически.`,
      { parse_mode: "HTML" }
    );

    try {
      await ctx.api.pinChatMessage(ctx.chat.id, msg.message_id, { disable_notification: true });
    } catch {}
  });

  bot.command("list", async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!allowedUsers.includes(userId)) return;

    const records = await getUserSecrets(userId);

    if (records.length === 0) {
      return ctx.reply("📭 У вас пока нет сохранённых паролей");
    }

    let text = `📋 <b>Ваши пароли (${records.length} шт.):</b>\n\n`;
    records.forEach((r, i) => {
      text += `${i + 1}. <code>${r.url}</code> — ${r.login}\n`;
    });

    await ctx.reply(text, { parse_mode: "HTML" });
  });

  bot.command("help", async (ctx) => {
    if (!allowedUsers.includes(ctx.from.id.toString())) return;
    await ctx.reply(
      `📋 <b>Доступные команды:</b>\n\n` +
      `/start — закрепить шаблон\n` +
      `/list — список всех сайтов\n` +
      `/help — эта справка\n\n` +
      `Просто отправляйте сообщения в формате выше.`,
      { parse_mode: "HTML" }
    );
  });

  // ==================== ЗАПУСК ====================
  await bot.start();
  log('SUCCESS', 'Бот успешно запущен и готов к работе!');
}

// ==================== ИНИЦИАЛИЗАЦИЯ + МИГРАЦИЯ БД ====================
async function initDatabase(pb) {
  try {
    await pb.collections.getOne("secrets");
    log('INFO', 'Коллекция secrets существует');
  } catch {
    log('INFO', 'Создаём коллекцию secrets...');
    await pb.collections.create({
      name: "secrets",
      type: "base",
      schema: [
        { name: "url", type: "text", required: true },
        { name: "login", type: "text", required: true },
        { name: "password_enc", type: "text", required: true },
        { name: "iv", type: "text", required: true },
        { name: "auth_tag", type: "text", required: true },
        { name: "comment", type: "text", required: false },
        { name: "created_by", type: "text", required: true }
      ]
    });
  }

  // Миграция старых записей (было iv:tag в одном поле)
  const allRecords = await pb.collection("secrets").getFullList();
  for (const record of allRecords) {
    if (record.iv?.includes(':') && !record.auth_tag) {
      const [iv, tag] = record.iv.split(':');
      await pb.collection("secrets").update(record.id, { iv, auth_tag: tag });
      log('INFO', `Миграция старой записи ${record.id}`);
    }
  }
}

// ====================== ЗАПУСК ======================
main().catch(err => {
  log('CRITICAL', 'Критическая ошибка запуска', err);
  process.exit(1);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));