
import {Bot,InlineKeyboard} from "grammy"
import PocketBase from "pocketbase"
import dotenv from "dotenv"
import Fuse from "fuse.js"
import crypto from "crypto"

// Load environment variables
dotenv.config()

// Main function
async function main() {
  // Validate environment variables
  const requiredEnvVars = ['TG_TOKEN', 'PB_URL', 'PB_ADMIN', 'PB_PASSWORD', 'MASTER_PASSWORD', 'ALLOWED_USERS']
  const missingVars = requiredEnvVars.filter(v => !process.env[v])

  if (missingVars.length > 0) {
    const msg = 'Missing required environment variables: ' + missingVars.join(', ')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('⚠️  CONFIGURATION REQUIRED')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('')
    console.error(msg)
    console.error('')
    console.error('Please configure during installation or in app settings.')
    console.error('')
    console.error('Umbrel → Apps → Telegram Vault → Settings → Configuration')
    console.error('')
    console.error('Or via SSH:')
    console.error('  ssh umbrel@umbrel.local')
    console.error('  cd ~/umbrel/app-data/vault-telegram-vault')
    console.error('  nano docker-compose.yml')
    console.error('')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // Keep container running so user can see logs
    console.log('')
    console.log('Waiting for configuration... (container will stay running)')
    console.log('Check logs: Umbrel → Apps → Telegram Vault → Logs')
    
    // Keep process alive with infinite loop
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 60000))
      console.log('[' + new Date().toISOString() + '] Waiting for environment variables...')
    }
  }

  // Весь код ниже выполняется только если переменные присутствуют
  console.log('Запуск Telegram Vault бота...')
  console.log('URL PocketBase:', process.env.PB_URL)
  console.log('Разрешенные пользователи:', process.env.ALLOWED_USERS)

  const bot=new Bot(process.env.TG_TOKEN)

  const pb=new PocketBase(process.env.PB_URL)

try {
  await pb.collection("_superusers").authWithPassword(
    process.env.PB_ADMIN,
    process.env.PB_PASSWORD
  )
  console.log('Успешная аутентификация в PocketBase')
} catch (error) {
  console.error('Ошибка аутентификации в PocketBase:', error.message)
  console.error('Убедитесь, что PocketBase запущен и учетные данные верны')
  process.exit(1)
}

// Инициализация коллекций
try {
 await pb.collections.getOne("secrets")
 console.log('Коллекция "secrets" уже существует')
} catch {
 console.log('Создание коллекции "secrets"...')
 await pb.collections.create({
  name: "secrets",
  type: "base",
  schema: [
   { name: "url", type: "text", required: true },
   { name: "login", type: "text", required: true },
   { name: "password_enc", type: "text", required: true },
   { name: "iv", type: "text", required: true },
   { name: "comment", type: "text", required: false },
   { name: "created_by", type: "text", required: true }
  ]
 })
 console.log('Коллекция "secrets" создана')
}

const allowed=process.env.ALLOWED_USERS.split(",")

// Store for pending confirmations
const pendingConfirmations = new Map()

function normalizeUrl(url) {
 try {
  const urlObj = new URL(url)
  // Return only protocol + hostname + pathname (no query params, no hash)
  return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`.replace(/\/$/, '')
 } catch {
  // If not a valid URL, return as is
  return url.trim()
 }
}

function key(master){
 return crypto.createHash("sha256").update(master).digest()
}

function encrypt(text){

 const iv=crypto.randomBytes(16)
 const cipher=crypto.createCipheriv("aes-256-gcm",key(process.env.MASTER_PASSWORD),iv)

 let enc=cipher.update(text,"utf8","hex")
 enc+=cipher.final("hex")

 const tag=cipher.getAuthTag().toString("hex")

 return {enc,iv:iv.toString("hex"),tag}
}

function decrypt(enc,iv,tag){

 const decipher=crypto.createDecipheriv(
  "aes-256-gcm",
  key(process.env.MASTER_PASSWORD),
  Buffer.from(iv,"hex")
 )

 decipher.setAuthTag(Buffer.from(tag,"hex"))

 let dec=decipher.update(enc,"hex","utf8")
 dec+=decipher.final("utf8")

 return dec
}

bot.on("message:text",async ctx=>{

 const user=ctx.from.id
 const username = ctx.from.username || ctx.from.first_name || 'Неизвестный'

 if(!allowed.includes(String(user))) {
  console.log('Попытка несанкционированного доступа от:', username, user)
  return
 }

 const txt=ctx.message.text.trim()
 console.log('Сообщение получено от:', username)

 // Разбиваем по новым строкам и пробелам
 const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(l => l)

 // Случай 1: Многострочный ввод (URL, логин, пароль, опциональный комментарий)
 if(lines.length >= 3){
  const rawUrl = lines[0]
  const login = lines[1]
  const password = lines[2]
  const comment = lines[3] || ''

  const url = normalizeUrl(rawUrl)

  // Проверяем, существует ли запись с таким URL (независимо от логина)
  const existing = await pb.collection("secrets").getFullList({
   filter: `url = "${url.replace(/"/g, '\\"')}"`
  })

  if(existing.length > 0) {
   // Находим запись с таким же логином или берем первую
   let record = existing.find(r => r.login === login) || existing[0]
   const [iv, tag] = record.iv.split(":")
   const existingPass = decrypt(record.password_enc, iv, tag)

   // Сохраняем ожидающее подтверждение
   pendingConfirmations.set(user, {
    url, login, password, comment,
    existingId: record.id,
    timestamp: Date.now()
   })

   const kb = new InlineKeyboard()
    .text("✅ Да, перезаписать", "overwrite_yes")
    .text("❌ Нет, отменить", "overwrite_no")

   const m = await ctx.reply(
    `⚠️ Для этого URL уже есть сохраненные данные:\n\n` +
    `🌐 URL: ${record.url}\n` +
    `👤 Логин: ${record.login}\n` +
    `🔑 Пароль: ${existingPass}\n` +
    `💬 Комментарий: ${record.comment || '-'}\n\n` +
    `❓ Перезаписать новыми данными?`,
    { reply_markup: kb }
   )

   setTimeout(() => {
    ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id).catch(() => {})
    ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(() => {})
    pendingConfirmations.delete(user)
   }, 60000)

   return
  }

  // Сохраняем новую запись
  const e = encrypt(password)

  await pb.collection("secrets").create({
   url,
   login,
   password_enc: e.enc,
   iv: e.iv + ":" + e.tag,
   comment,
   created_by: String(user)
  })

  console.log('Пароль сохранен для:', url, 'пользователем:', username)

  const m = await ctx.reply("✅ Сохранено")

  setTimeout(() => {
   ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id).catch(() => {})
   ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(() => {})
  }, 60000)

  return
 }

 // Случай 2: Одна строка - поиск по URL/домену
 if(lines.length === 1) {
  const searchUrl = normalizeUrl(lines[0])
  
  const list = await pb.collection("secrets").getFullList()

  // Сначала пробуем точное совпадение по URL
  let found = list.filter(item => item.url === searchUrl)

  // Если нет точного совпадения, ищем по домену
  if(found.length === 0) {
   try {
    const searchUrlObj = new URL(searchUrl)
    const searchDomain = searchUrlObj.hostname
    
    // Ищем все записи с таким же доменом
    found = list.filter(item => {
     try {
      const itemUrlObj = new URL(item.url)
      return itemUrlObj.hostname === searchDomain
     } catch {
      return false
     }
    })
   } catch {
    // Если не удалось распарсить URL, используем нечеткий поиск
    const fuse = new Fuse(list, { keys: ["url"], threshold: 0.3 })
    const fuseResults = fuse.search(searchUrl)
    found = fuseResults.map(r => r.item)
   }
  }

  if(found.length === 0) {
   console.log('Пароль не найден для запроса:', searchUrl, 'пользователем:', username)
   const m = await ctx.reply("❌ Не найдено")
   
   setTimeout(() => {
    ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id).catch(() => {})
    ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(() => {})
   }, 60000)
   
   return
  }

  // Выводим все найденные записи
  for(const r of found) {
   const [iv, tag] = r.iv.split(":")
   const pass = decrypt(r.password_enc, iv, tag)

   console.log('Пароль получен для:', r.url, 'пользователем:', username)

   const kb = new InlineKeyboard().text("🗑 Удалить", "del_" + r.id)

   const reply = await ctx.reply(
    `🔐 Найдено:\n\n` +
    `🌐 URL: ${r.url}\n` +
    `👤 Логин: ${r.login}\n` +
    `🔑 Пароль: ${pass}\n` +
    `💬 Комментарий: ${r.comment || '-'}`,
    { reply_markup: kb }
   )

   setTimeout(() => {
    ctx.api.deleteMessage(ctx.chat.id, reply.message_id).catch(() => {})
   }, 60000)
  }

  // Удаляем исходное сообщение поиска
  setTimeout(() => {
   ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id).catch(() => {})
  }, 60000)

  return
 }

 // Случай 3: Неправильный формат - показываем шаблон
 console.log('Неправильный формат сообщения от:', username)
 
 const m = await ctx.reply(
  `❌ Неправильный формат!\n\n` +
  `📋 Используйте шаблон:\n\n` +
  `📝 Сохранить пароль:\n` +
  `https://example.com\n` +
  `логин\n` +
  `пароль\n` +
  `комментарий (опционально)\n\n` +
  `🔍 Найти пароль:\n` +
  `https://example.com`
 )

 setTimeout(() => {
  ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id).catch(() => {})
  ctx.api.deleteMessage(ctx.chat.id, m.message_id).catch(() => {})
 }, 60000)

})

// Обработка подтверждения перезаписи
bot.callbackQuery("overwrite_yes", async ctx => {
 const user = ctx.from.id
 const username = ctx.from.username || ctx.from.first_name || 'Неизвестный'

 if(!allowed.includes(String(user))) {
  await ctx.answerCallbackQuery("❌ Доступ запрещен")
  return
 }

 const pending = pendingConfirmations.get(user)
 if(!pending) {
  await ctx.answerCallbackQuery("⏱ Время истекло")
  await ctx.deleteMessage().catch(() => {})
  return
 }

 // Удаляем старую запись
 await pb.collection("secrets").delete(pending.existingId)

 // Создаем новую запись
 const e = encrypt(pending.password)
 await pb.collection("secrets").create({
  url: pending.url,
  login: pending.login,
  password_enc: e.enc,
  iv: e.iv + ":" + e.tag,
  comment: pending.comment,
  created_by: String(user)
 })

 console.log('Пароль перезаписан для:', pending.url, 'пользователем:', username)

 pendingConfirmations.delete(user)

 await ctx.answerCallbackQuery("✅ Перезаписано")
 
 // Удаляем сообщение с подтверждением
 await ctx.deleteMessage().catch(() => {})
})

bot.callbackQuery("overwrite_no", async ctx => {
 const user = ctx.from.id
 
 if(!allowed.includes(String(user))) {
  await ctx.answerCallbackQuery("❌ Доступ запрещен")
  return
 }
 
 pendingConfirmations.delete(user)
 
 await ctx.answerCallbackQuery("❌ Отменено")
 
 // Удаляем оба сообщения (запрос пользователя и сообщение бота)
 await ctx.deleteMessage().catch(() => {})
})

bot.callbackQuery(/del_(.+)/,async ctx=>{

 const user=ctx.from.id
 const username = ctx.from.username || ctx.from.first_name || 'Неизвестный'

 if(!allowed.includes(String(user))){
  console.log('Попытка несанкционированного удаления от:', username, user)
  await ctx.answerCallbackQuery("❌ Доступ запрещен")
  return
 }

 const secretId=ctx.match[1]

 await pb.collection("secrets").delete(secretId)

 console.log('Пароль удален пользователем:', username, 'ID записи:', secretId)

 await ctx.answerCallbackQuery("🗑 Удалено")
 await ctx.deleteMessage().catch(()=>{})

})

bot.start()

console.log('Бот успешно запущен!')
console.log('Ожидание сообщений...')

// Получение информации о боте при запуске
bot.api.getMe().then(botInfo => {
 console.log('Имя бота:', botInfo.username)
 console.log('Для закрепления шаблона отправьте команду /start в чате')
}).catch(err => {
 console.error('Не удалось получить информацию о боте:', err)
})

// Обработка команды /start для закрепления шаблона
bot.command('start', async ctx => {
 const user = ctx.from.id
 
 if(!allowed.includes(String(user))) {
  return
 }

 const templateMsg = await ctx.reply(
  `📋 Шаблон использования Telegram Vault:\n\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
  `📝 Сохранить пароль:\n` +
  `https://example.com/login?ref=123\n` +
  `логин\n` +
  `пароль\n` +
  `комментарий (опционально)\n\n` +
  `🔍 Найти пароль:\n` +
  `https://example.com\n\n` +
  `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
  `💡 URL автоматически стандартизируется\n` +
  `⏱ Сообщения удаляются через 1 минуту\n` +
  `🔐 Пароли зашифрованы AES-256-GCM`
 )

 try {
  await ctx.api.pinChatMessage(ctx.chat.id, templateMsg.message_id, { disable_notification: true })
  console.log('Шаблон успешно закреплен')
 } catch (err) {
  console.error('Не удалось закрепить сообщение:', err.message)
  await ctx.reply('⚠️ Не удалось закрепить сообщение. Убедитесь, что бот имеет права администратора.')
 }
})

// Обработка корректного завершения
process.on('SIGINT', () => {
  console.log('Получен SIGINT, остановка бота...')
  bot.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Получен SIGTERM, остановка бота...')
  bot.stop()
  process.exit(0)
})

// Обработка неперехваченных ошибок
process.on('uncaughtException', (error) => {
  console.error('Неперехваченное исключение:', error)
  process.exit(1)
})

process.on('unhandledRejection', (error) => {
  console.error('Необработанное отклонение промиса:', error)
  process.exit(1)
})

} // Конец главной функции

// Запуск приложения
main().catch(error => {
  console.error('Критическая ошибка:', error)
  process.exit(1)
})
