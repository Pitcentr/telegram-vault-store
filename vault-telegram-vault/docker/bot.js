import { Bot, InlineKeyboard } from "grammy";
import PocketBase from "pocketbase";
import dotenv from "dotenv";
import Fuse from "fuse.js";
import crypto from "crypto";

// ====================== КОНФИГУРАЦИЯ ======================
dotenv.config();

const REQUIRED_ENV = ['TG_TOKEN', 'PB_URL', 'PB_ADMIN', 'PB_PASSWORD', 'MASTER_PASSWORD', 'ALLOWED_USERS'];
const AUTO_DELETE_TIMEOUT = 60000;
const PASSWORD_SHOW_TIMEOUT = 90000;
const TOKEN_REFRESH_INTERVAL = 90 * 60 * 1000; // 90 минут

// ====================== УТИЛИТЫ ======================
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
  if (data) console.dir(data, { depth: null });
}

function normalizeUrl(url) {
  try {
    const trimmed = url.trim();
    
    // If it looks like a URL (has protocol or www), normalize it
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || /^www\./i.test(trimmed)) {
      const urlWithProtocol = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      const urlObj = new URL(urlWithProtocol);
      const hostname = urlObj.hostname.replace(/^www\./i, '');
      return `${urlObj.protocol}//${hostname}${urlObj.pathname}`.replace(/\/$/, '');
    }
    
    // Otherwise return as is (IP, service name, localhost, etc.)
    return trimmed;
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
    throw new Error("Ошибка расшифровки");
  }
}

function autoDelete(chatId, messageId, delay = AUTO_DELETE_TIMEOUT) {
  setTimeout(() => {
    bot.api.deleteMessage(chatId, messageId).catch(() => {});
  }, delay);
}

// ====================== ГЛАВНАЯ ФУНКЦИЯ ======================
const bot = new Bot(process.env.TG_TOKEN || "");
const pb = new PocketBase(process.env.PB_URL || "");

async function main() {
  // Проверка переменных окружения
  const missing = REQUIRED_ENV.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('⚠️ ОТСУТСТВУЮТ ОБЯЗАТЕЛЬНЫЕ ПЕРЕМЕННЫЕ:');
    console.error(missing.join(', '));
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    while (true) await new Promise(r => setTimeout(r, 60000));
  }

  const allowedUsers = process.env.ALLOWED_USERS.split(',').map(id => id.trim());
  log('INFO', `Запуск Telegram Vault. Разрешено пользователей: ${allowedUsers.length}`);

  // Функция аутентификации в PocketBase
  async function authenticatePocketBase() {
    try {
      await pb.collection("_superusers").authWithPassword(process.env.PB_ADMIN, process.env.PB_PASSWORD);
      log('INFO', 'Успешная аутентификация в PocketBase');
      return true;
    } catch (err) {
      log('ERROR', 'Не удалось авторизоваться в PocketBase', err.message);
      return false;
    }
  }

  // Первичная аутентификация
  if (!await authenticatePocketBase()) {
    process.exit(1);
  }

  // Автоматическое обновление токена каждые 90 минут
  setInterval(async () => {
    log('INFO', 'Обновление токена PocketBase...');
    await authenticatePocketBase();
  }, TOKEN_REFRESH_INTERVAL);

  // Глобальный обработчик ошибок
  bot.catch((err) => {
    log('ERROR', `Ошибка при обработке обновления`, err.error);
    err.ctx.reply("❌ Произошла ошибка. Попробуйте ещё раз.").catch(() => {});
  });

  // Меню команд
  await bot.api.setMyCommands([
    { command: "start", description: "Главное меню" },
    { command: "find", description: "Поиск паролей" },
    { command: "help", description: "Справка" }
  ]);

  // Хранилище подтверждений перезаписи
  const pendingConfirmations = new Map();

  // Автоочистка старых подтверждений
  setInterval(() => {
    const now = Date.now();
    for (const [userId, data] of pendingConfirmations.entries()) {
      if (now - data.timestamp > 120000) pendingConfirmations.delete(userId);
    }
  }, 30000);

  // ==================== ФУНКЦИИ РАБОТЫ С БД ====================
  async function getAllSecrets(userId) {
    try {
      const result = await pb.collection("secrets").getList(1, 500, { requestKey: null });
      return result.items.filter(item => item.created_by === userId);
    } catch (err) {
      log('ERROR', 'Ошибка получения секретов', err.message);
      return [];
    }
  }

  async function findSecrets(userId, searchQuery) {
    const all = await getAllSecrets(userId);
    if (all.length === 0) return [];

    const normalized = normalizeUrl(searchQuery);
    const lowerQuery = searchQuery.toLowerCase();

    // 1. Точное совпадение URL
    let records = all.filter(item => item.url === normalized);
    if (records.length > 0) return records;

    // 2. Подстрока в URL
    records = all.filter(item => {
      const itemUrl = item.url.toLowerCase();
      return itemUrl.includes(lowerQuery) || lowerQuery.includes(itemUrl);
    });
    if (records.length > 0) return records;

    // 3. Fuzzy-поиск
    const fuse = new Fuse(all, {
      keys: ["url", "login", "comment"],
      threshold: 0.35,
      ignoreLocation: true
    });
    return fuse.search(searchQuery).map(r => r.item);
  }

  async function saveSecret(userId, url, login, password, comment) {
    const { encrypted, iv, tag } = encrypt(password);
    try {
      return await pb.collection("secrets").create({
        url: normalizeUrl(url),
        login,
        password_enc: encrypted,
        iv,
        auth_tag: tag,
        comment: comment || "",
        created_by: userId
      }, { requestKey: null });
    } catch (err) {
      log('ERROR', 'Ошибка сохранения', err.message);
      throw err;
    }
  }

  function decryptPassword(record) {
    let authTag = record.auth_tag;
    let iv = record.iv;
    
    // Поддержка старого формата iv:tag
    if (!authTag && iv?.includes(':')) {
      [iv, authTag] = iv.split(':');
    }
    
    return decrypt(record.password_enc, iv, authTag || '');
  }

  async function showPassword(ctx, record) {
    try {
      const pass = decryptPassword(record);
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
    } catch (err) {
      await ctx.reply("❌ Ошибка расшифровки пароля");
    }
  }

  // ==================== ОБРАБОТКА ТЕКСТА ====================
  bot.on("message:text", async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!allowedUsers.includes(userId)) return;

    const text = ctx.message.text.trim();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let url, login, password, comment;

    // Парсинг формата
    if (lines.length >= 3) {
      // Многострочный: url, login, password, [comment]
      url = lines[0];
      login = lines[1];
      password = lines[2];
      comment = lines.slice(3).join('\n');
    } else if (lines.length === 1) {
      const parts = text.split(/\s+/);
      if (parts.length >= 3) {
        // Одна строка: url login pass [comment]
        url = parts[0];
        login = parts[1];
        password = parts[2];
        comment = parts.slice(3).join(' ');
      } else {
        // Поиск
        return handleSearch(ctx, userId, text);
      }
    } else {
      return handleSearch(ctx, userId, text);
    }

    // Валидация пароля
    if (password.length < 3) {
      const m = await ctx.reply("❌ Пароль слишком короткий (минимум 3 символа)");
      autoDelete(ctx.chat.id, ctx.message.message_id);
      autoDelete(ctx.chat.id, m.message_id);
      return;
    }

    const normalizedUrl = normalizeUrl(url);
    const userSecrets = await getAllSecrets(userId);
    const existing = userSecrets.find(r => r.url === normalizedUrl);

    if (existing) {
      // Запись существует - запрос на перезапись
      try {
        const oldPass = decryptPassword(existing);
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
      } catch (err) {
        const m = await ctx.reply("❌ Ошибка чтения существующей записи");
        autoDelete(ctx.chat.id, ctx.message.message_id);
        autoDelete(ctx.chat.id, m.message_id);
      }
      return;
    }

    // Сохраняем новую запись
    try {
      await saveSecret(userId, normalizedUrl, login, password, comment);
      const m = await ctx.reply("✅ Пароль успешно сохранён!");
      autoDelete(ctx.chat.id, ctx.message.message_id);
      autoDelete(ctx.chat.id, m.message_id);
      log('INFO', `Сохранён пароль для ${normalizedUrl}`);
    } catch (err) {
      const m = await ctx.reply("❌ Ошибка сохранения");
      autoDelete(ctx.chat.id, ctx.message.message_id);
      autoDelete(ctx.chat.id, m.message_id);
    }
  });

  // ==================== ПОИСК ====================
  async function handleSearch(ctx, userId, query) {
    const records = await findSecrets(userId, query);
    
    if (records.length === 0) {
      const m = await ctx.reply("❌ Ничего не найдено");
      autoDelete(ctx.chat.id, ctx.message.message_id);
      autoDelete(ctx.chat.id, m.message_id);
      return;
    }

    if (records.length === 1) {
      await showPassword(ctx, records[0]);
      autoDelete(ctx.chat.id, ctx.message.message_id);
    } else {
      const kb = new InlineKeyboard();
      records.forEach(r => {
        kb.text(`🌐 ${r.url} — ${r.login}`, `view_${r.id}`).row();
      });

      const msg = await ctx.reply(
        `🔍 Найдено ${records.length} записей.\n\nВыберите:`,
        { reply_markup: kb }
      );
      autoDelete(ctx.chat.id, ctx.message.message_id);
      autoDelete(ctx.chat.id, msg.message_id, 120000);
    }
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

  bot.callbackQuery(/view_(.+)/, async (ctx) => {
    const secretId = ctx.match[1];
    try {
      const record = await pb.collection("secrets").getOne(secretId);
      await showPassword(ctx, record);
      await ctx.answerCallbackQuery("🔑 Пароль показан");
      await ctx.deleteMessage().catch(() => {});
    } catch (err) {
      await ctx.answerCallbackQuery("❌ Не удалось загрузить");
    }
  });

  bot.callbackQuery(/del_(.+)/, async (ctx) => {
    const secretId = ctx.match[1];
    try {
      await pb.collection("secrets").delete(secretId);
      await ctx.answerCallbackQuery("� Удалено");
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
      `<b>Сохранить пароль:</b>\n` +
      `<code>https://example.com\n` +
      `логин\n` +
      `пароль\n` +
      `комментарий</code>\n\n` +
      `<b>Или одной строкой:</b>\n` +
      `<code>https://example.com login password</code>\n\n` +
      `� Для поиска просто отправьте URL или часть названия\n\n` +
      `<b>Команды:</b> /list /help`,
      { parse_mode: "HTML" }
    );
    try { 
      await ctx.api.pinChatMessage(ctx.chat.id, msg.message_id, { disable_notification: true }); 
    } catch {}
  });

  bot.command("find", async (ctx) => {
    const userId = ctx.from.id.toString();
    if (!allowedUsers.includes(userId)) return;

    const query = ctx.message.text.replace('/find', '').trim();
    
    if (!query) {
      const m = await ctx.reply(
        `🔍 <b>Поиск паролей</b>\n\n` +
        `Используйте: <code>/find запрос</code>\n\n` +
        `Поиск работает по URL и комментариям`,
        { parse_mode: "HTML" }
      );
      autoDelete(ctx.chat.id, m.message_id);
      return;
    }

    try {
      const allRecords = await getAllSecrets(userId);
      
      if (allRecords.length === 0) {
        const m = await ctx.reply("📭 У вас пока нет сохранённых паролей");
        autoDelete(ctx.chat.id, m.message_id);
        return;
      }

      const lowerQuery = query.toLowerCase();
      const found = allRecords.filter(r => {
        const urlMatch = r.url.toLowerCase().includes(lowerQuery);
        const commentMatch = r.comment && r.comment.toLowerCase().includes(lowerQuery);
        return urlMatch || commentMatch;
      });

      if (found.length === 0) {
        const m = await ctx.reply(`❌ Ничего не найдено по запросу: "${query}"`);
        autoDelete(ctx.chat.id, m.message_id);
        return;
      }

      if (found.length === 1) {
        await showPassword(ctx, found[0]);
      } else {
        const kb = new InlineKeyboard();
        found.forEach(r => {
          kb.text(`🌐 ${r.url} — ${r.login}`, `view_${r.id}`).row();
        });

        const msg = await ctx.reply(
          `🔍 Найдено ${found.length} записей по запросу: "${query}"\n\nВыберите:`,
          { reply_markup: kb }
        );
        autoDelete(ctx.chat.id, msg.message_id, 120000);
      }
    } catch (err) {
      await ctx.reply("❌ Ошибка поиска");
    }
  });

  bot.command("help", async (ctx) => {
    if (!allowedUsers.includes(ctx.from.id.toString())) return;
    
    await ctx.reply(
      `📋 <b>Как пользоваться:</b>\n\n` +
      `💾 <b>Сохранить:</b>\n` +
      `— 4 строки: url, login, password, comment\n` +
      `— Или одной строкой через пробел\n\n` +
      `🔍 <b>Найти:</b>\n` +
      `Отправьте URL или часть названия\n` +
      `Или используйте: <code>/find запрос</code>\n\n` +
      `/find — поиск по URL и комментариям\n` +
      `/start — главное меню\n\n` +
      `✅ Сообщения самоудаляются через 60-90 сек`,
      { parse_mode: "HTML" }
    );
  });

  // ==================== ЗАПУСК ====================
  await bot.start();
  log('SUCCESS', 'Бот успешно запущен!');
}

// ====================== ЗАПУСК ======================
main().catch(err => {
  log('CRITICAL', 'Критическая ошибка', err);
  process.exit(1);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
