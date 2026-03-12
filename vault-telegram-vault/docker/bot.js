import { Bot, InlineKeyboard, Keyboard } from "grammy";
import PocketBase from "pocketbase";
import dotenv from "dotenv";
import Fuse from "fuse.js";
import crypto from "crypto";

// ====================== КОНФИГУРАЦИЯ ======================
dotenv.config();

const REQUIRED_ENV = ['TG_TOKEN', 'PB_URL', 'PB_ADMIN', 'PB_PASSWORD', 'MASTER_PASSWORD', 'ALLOWED_USERS'];
const AUTO_DELETE_TIMEOUT = 60000;     // 60 секунд для обычных сообщений
const PASSWORD_SHOW_TIMEOUT = 90000;   // 90 секунд для паролей

// ====================== УТИЛИТЫ ======================
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
  if (data) console.dir(data, { depth: null });
}

function normalizeUrl(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
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
    throw new Error("Ошибка расшифровки (возможно, повреждённые данные или неверный мастер-пароль)");
  }
}

function autoDelete(chatId, messageId, delay = AUTO_DELETE_TIMEOUT) {
  setTimeout(() => {
    bot.api.deleteMessage(chatId, messageId).catch(() => {});
  }, delay);
}

// ====================== ГЛАВНАЯ ФУНКЦИЯ ======================
async function main() {
  const missing = REQUIRED_ENV.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('⚠️ ОТСУТСТВУЮТ ОБЯЗАТЕЛЬНЫЕ ПЕРЕМЕННЫЕ:');
    console.error(missing.join(', '));
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Настройте в Umbrel → Apps → Telegram Vault → Settings');
    while (true) await new Promise(r => setTimeout(r, 60000));
  }

  const allowedUsers = process.env.ALLOWED_USERS.split(',').map(id => id.trim());
  log('INFO', `Запуск Telegram Vault. Разрешено пользователей: ${allowedUsers.length}`);

  const bot = new Bot(process.env.TG_TOKEN);
  const pb = new PocketBase(process.env.PB_URL);

  // Аутентификация
  try {
    await pb.collection("_superusers").authWithPassword(process.env.PB_ADMIN, process.env.PB_PASSWORD);
    log('INFO', 'Успешная аутентификация в PocketBase');
  } catch (err) {
    log('ERROR', 'Не удалось авторизоваться в PocketBase', err.message);
    process.exit(1);
  }

  await initDatabase(pb);

  // Меню команд Telegram (появляется в интерфейсе)
  await bot.api.setMyCommands([
    { command: "start", description: "Главное меню и пример шаблона" },
    { command: "list",  description: "Показать все сохранённые пароли" },
    { command: "help",  description: "Справка по использованию" }
  ]);

  // Хранилище ожидающих подтверждений перезаписи
  const pendingConfirmations = new Map();

  // Автоочистка старых подтверждений
  setInterval(() => {
    const now = Date.now();
    for (const [userId, data] of pendingConfirmations.entries()) {
      if (now - data.timestamp > 120000) pendingConfirmations.delete(userId);
    }
  }, 30000);

  // ==================== ХЕЛПЕРЫ ====================
  async function getUserSecrets(userId) {
    return pb.collection("secrets").getFullList({
      filter: `created_by = "${userId}"`,
      sort: "-created"
    });
  }

  // Улучшенный поиск: точный → подстрока → fuzzy
  async function findSecrets(userId, searchQuery) {
    const normalized = normalizeUrl(searchQuery);
    const all = await getUserSecrets(userId);

    // 1. Точное совпадение URL
    let records = all.filter(item => item.url === normalized);
    if (records.length > 0) return records;

    // 2. Подстрока (частичный URL или домен)
    const lowerQuery = searchQuery.toLowerCase();
    records = all.filter(item => {
      const itemUrl = item.url.toLowerCase();
      return itemUrl.includes(lowerQuery) ||
             lowerQuery.includes(itemUrl) ||
             itemUrl.includes(normalized.toLowerCase());
    });
    if (records.length > 0) return records;

    // 3. Fuzzy-поиск (по URL, логину и комментарию)
    const fuse = new Fuse(all, {
      keys: ["url", "login", "comment"],
      threshold: 0.35,
      ignoreLocation: true
    });
    return fuse.search(searchQuery).map(r => r.item);
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

  // ==================== ОБРАБОТКА ТЕКСТА ====================
  bot.on("message:text", async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!allowedUsers.includes(userId)) return;

    const text = ctx.message.text.trim();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let url, login, password, comment;

    // === ПАРСИНГ ДВУХ ФОРМАТОВ ===
    if (lines.length >= 3) {
      // Многострочный формат
      url = lines[0];
      login = lines[1];
      password = lines[2];
      comment = lines.slice(3).join('\n');
    } else if (lines.length === 1) {
      const parts = text.split(/\s+/);
      if (parts.length >= 3) {
        // Одна строка: url login pass [desc]
        url = parts[0];
        login = parts[1];
        password = parts[2];
        comment = parts.slice(3).join(' ');
      } else {
        // Поиск (одна строка без пробелов или короткая)
        return handleSearch(ctx, userId, text);
      }
    } else {
      return handleSearch(ctx, userId, text);
    }

    // Проверка длины пароля
    if (password.length < 3) {
      const m = await ctx.reply("❌ Пароль слишком короткий (минимум 3 символа)");
      autoDelete(ctx.chat.id, ctx.message.message_id);
      autoDelete(ctx.chat.id, m.message_id);
      return;
    }

    const normalizedUrl = normalizeUrl(url);

    // Проверяем существование по URL (уникальность!)
    const userSecrets = await getUserSecrets(userId);
    const existing = userSecrets.find(r => r.url === normalizedUrl);

    if (existing) {
      // Уже есть запись с таким URL → подтверждение перезаписи
      const oldPass = decrypt(existing.password_enc, existing.iv, existing.auth_tag || existing.iv.split(':')[1] || '');
      pendingConfirmations.set(userId, {
        url: normalizedUrl,
        login,
        password,
        comment,
        existingId: existing.id,
        timestamp: Date.now()
      });

      const kb = new InlineKeyboard()
        .text("✅ Перезаписать", "overwrite_yes")
        .text("❌ Отмена", "overwrite_no");

      const msg = await ctx.reply(
        `⚠️ Запись с таким URL уже существует:\n\n` +
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

    // Сохраняем новую запись
    await saveSecret(userId, normalizedUrl, login, password, comment);
    const m = await ctx.reply("✅ Пароль успешно сохранён!\nЗапись уникальна по URL.");
    autoDelete(ctx.chat.id, ctx.message.message_id);
    autoDelete(ctx.chat.id, m.message_id);
    log('INFO', `Сохранён пароль для ${normalizedUrl}`);
  });

  // Отдельная функция для поиска
  async function handleSearch(ctx, userId, query) {
    const records = await findSecrets(userId, query);
    if (records.length === 0) {
      const m = await ctx.reply("❌ Ничего не найдено. Попробуйте другую ссылку или часть названия.");
      autoDelete(ctx.chat.id, ctx.message.message_id);
      autoDelete(ctx.chat.id, m.message_id);
      return;
    }

    if (records.length === 1) {
      // Один результат — сразу показываем
      await showPassword(ctx, records[0]);
    } else {
      // Несколько результатов — выводим список с кнопками выбора
      const kb = new InlineKeyboard();
      records.forEach(r => {
        kb.text(`🌐 ${r.url} — ${r.login}`, `view_${r.id}`).row();
      });

      const msg = await ctx.reply(
        `🔍 Найдено ${records.length} похожих записей.\n\n` +
        `Выберите нужную:`,
        { reply_markup: kb }
      );
      autoDelete(ctx.chat.id, ctx.message.message_id);
      autoDelete(ctx.chat.id, msg.message_id, 120000); // список живёт дольше
    }
  }

  async function showPassword(ctx, record) {
    const pass = decrypt(record.password_enc, record.iv, record.auth_tag || record.iv.split(':')[1] || '');
    const kb = new InlineKeyboard().text("🗑 Удалить", `del_${record.id}`);

    const msg = await ctx.reply(
      `🔐 Найдено:\n\n` +
      `🌐 ${record.url}\n` +
      `👤 ${record.login}\n` +
      `🔑 <code>${pass}</code>\n` +
      `💬 ${record.comment || '—'}`,
      { reply_markup: kb, parse_mode: "HTML" }
    );
    autoDelete(ctx.chat.id, msg.message_id, PASSWORD_SHOW_TIMEOUT);
  }

  // ==================== CALLBACK QUERIES ====================
  bot.callbackQuery("overwrite_yes", async (ctx) => {
    const userId = ctx.from.id.toString();
    const pending = pendingConfirmations.get(userId);
    if (!pending) return ctx.answerCallbackQuery("⏰ Время вышло");

    try {
      await pb.collection("secrets").delete(pending.existingId);
      await saveSecret(userId, pending.url, pending.login, pending.password, pending.comment);
      await ctx.answerCallbackQuery("✅ Перезаписано");
      await ctx.deleteMessage().catch(() => {});
      pendingConfirmations.delete(userId);
    } catch (err) {
      await ctx.answerCallbackQuery("❌ Ошибка");
    }
  });

  bot.callbackQuery("overwrite_no", async (ctx) => {
    pendingConfirmations.delete(ctx.from.id.toString());
    await ctx.answerCallbackQuery("❌ Отменено");
    await ctx.deleteMessage().catch(() => {});
  });

  // Просмотр пароля по кнопке
  bot.callbackQuery(/view_(.+)/, async (ctx) => {
    const secretId = ctx.match[1];
    try {
      const record = await pb.collection("secrets").getOne(secretId);
      await showPassword(ctx, record);
      await ctx.answerCallbackQuery("🔑 Пароль показан");
      await ctx.deleteMessage().catch(() => {});
    } catch (err) {
      await ctx.answerCallbackQuery("❌ Не удалось загрузить запись");
    }
  });

  // Удаление
  bot.callbackQuery(/del_(.+)/, async (ctx) => {
    const secretId = ctx.match[1];
    try {
      await pb.collection("secrets").delete(secretId);
      await ctx.answerCallbackQuery("🗑 Удалено");
      await ctx.deleteMessage().catch(() => {});
    } catch (err) {
      await ctx.answerCallbackQuery("❌ Не удалось удалить");
    }
  });

  // ==================== КОМАНДЫ ====================
  bot.command("start", async (ctx) => {
    if (!allowedUsers.includes(ctx.from.id.toString())) return;

    const msg = await ctx.reply(
      `🔐 <b>Telegram Vault</b>\n\n` +
      `✅ Записи уникальны по URL (один сайт = одна запись)\n\n` +
      `<b>Пример сохранения:</b>\n` +
      `<code>https://example.com\n` +
      `логин\n` +
      `пароль\n` +
      `комментарий</code>\n\n` +
      `<b>Или одной строкой:</b>\n` +
      `<code>https://example.com login password комментарий здесь</code>\n\n` +
      `🔍 Просто отправьте ссылку или часть названия — найду и покажу варианты.\n\n` +
      `<b>Команды:</b> /list /help`,
      { parse_mode: "HTML" }
    );
    try { await ctx.api.pinChatMessage(ctx.chat.id, msg.message_id, { disable_notification: true }); } catch {}
  });

  bot.command("list", async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!allowedUsers.includes(userId)) return;

    const records = await getUserSecrets(userId);
    if (records.length === 0) {
      return ctx.reply("📭 У вас пока нет сохранённых паролей");
    }

    const kb = new InlineKeyboard();
    records.forEach(r => {
      kb.text(`🌐 ${r.url} — ${r.login}`, `view_${r.id}`).row();
    });

    await ctx.reply(`📋 <b>Ваши пароли (${records.length} шт.):</b>\n\nВыберите для просмотра:`, {
      parse_mode: "HTML",
      reply_markup: kb
    });
  });

  bot.command("help", async (ctx) => {
    if (!allowedUsers.includes(ctx.from.id.toString())) return;
    await ctx.reply(
      `📋 <b>Как пользоваться Telegram Vault:</b>\n\n` +
      `📝 <b>Сохранить пароль</b>\n` +
      `— Многострочно (4 строки)\n` +
      `— Или одной строкой: url login pass [описание]\n\n` +
      `🔍 <b>Найти пароль</b>\nПросто отправьте ссылку или часть названия\n` +
      `(бот сам покажет варианты, если совпадений несколько)\n\n` +
      `/list — список всех записей\n` +
      `/start — это сообщение\n\n` +
      `✅ Все сообщения самоудаляются через 60–90 секунд.`,
      { parse_mode: "HTML" }
    );
  });

  // ==================== ЗАПУСК ====================
  await bot.start();
  log('SUCCESS', 'Бот успешно запущен! Всё общение на русском, поиск улучшен, меню добавлено.');
}

// ==================== ИНИЦИАЛИЗАЦИЯ БД ====================
async function initDatabase(pb) {
  try {
    await pb.collections.getOne("secrets");
  } catch {
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

  // Миграция старых записей
  const allRecords = await pb.collection("secrets").getFullList();
  for (const record of allRecords) {
    if (record.iv?.includes(':') && !record.auth_tag) {
      const [iv, tag] = record.iv.split(':');
      await pb.collection("secrets").update(record.id, { iv, auth_tag: tag });
    }
  }
}

// ====================== ЗАПУСК ======================
main().catch(err => {
  log('CRITICAL', 'Критическая ошибка', err);
  process.exit(1);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
