
import {Bot,InlineKeyboard} from "grammy"
import PocketBase from "pocketbase"
import dotenv from "dotenv"
import Fuse from "fuse.js"
import crypto from "crypto"
import { startWebUI, addLog, updateStatus, incrementMessages } from './web-ui.js'

dotenv.config()

// Start Web UI
const WEB_PORT = process.env.WEB_PORT || 8080
startWebUI(WEB_PORT)

// Validate environment variables
const requiredEnvVars = ['TG_TOKEN', 'PB_URL', 'PB_ADMIN', 'PB_PASSWORD', 'MASTER_PASSWORD', 'ALLOWED_USERS']
const missingVars = requiredEnvVars.filter(v => !process.env[v])

if (missingVars.length > 0) {
  const msg = 'Missing required environment variables: ' + missingVars.join(', ')
  console.error(msg)
  addLog('error', msg, { missing: missingVars })
  process.exit(1)
}

console.log('Starting Telegram Vault bot...')
console.log('PocketBase URL:', process.env.PB_URL)
console.log('Allowed users:', process.env.ALLOWED_USERS)

addLog('info', 'Starting Telegram Vault bot...')
addLog('info', 'PocketBase URL: ' + process.env.PB_URL)
addLog('info', 'Allowed users: ' + process.env.ALLOWED_USERS)
updateStatus('starting')

const bot=new Bot(process.env.TG_TOKEN)

const pb=new PocketBase(process.env.PB_URL)

try {
  await pb.admins.authWithPassword(
    process.env.PB_ADMIN,
    process.env.PB_PASSWORD
  )
  console.log('Successfully authenticated with PocketBase')
  addLog('success', 'Successfully authenticated with PocketBase')
} catch (error) {
  console.error('Failed to authenticate with PocketBase:', error.message)
  addLog('error', 'Failed to authenticate with PocketBase: ' + error.message)
  console.error('Make sure PocketBase is running and credentials are correct')
  process.exit(1)
}

// Initialize collections
try {
 await pb.collections.getOne("secrets")
 console.log('Collection "secrets" already exists')
 addLog('info', 'Collection "secrets" already exists')
} catch {
 console.log('Creating collection "secrets"...')
 addLog('info', 'Creating collection "secrets"...')
 await pb.collections.create({
  name: "secrets",
  type: "base",
  schema: [
   { name: "url", type: "text", required: true },
   { name: "login", type: "text", required: true },
   { name: "password_enc", type: "text", required: true },
   { name: "iv", type: "text", required: true },
   { name: "created_by", type: "text", required: true }
  ]
 })
 console.log('Collection "secrets" created')
 addLog('success', 'Collection "secrets" created')
}

try {
 await pb.collections.getOne("audit_logs")
 console.log('Collection "audit_logs" already exists')
 addLog('info', 'Collection "audit_logs" already exists')
} catch {
 console.log('Creating collection "audit_logs"...')
 addLog('info', 'Creating collection "audit_logs"...')
 await pb.collections.create({
  name: "audit_logs",
  type: "base",
  schema: [
   { name: "user_id", type: "text", required: true },
   { name: "action", type: "text", required: true },
   { name: "query", type: "text", required: true },
   { name: "timestamp", type: "text", required: true }
  ]
 })
 console.log('Collection "audit_logs" created')
 addLog('success', 'Collection "audit_logs" created')
}

const allowed=process.env.ALLOWED_USERS.split(",")

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
 const username = ctx.from.username || ctx.from.first_name || 'Unknown'

 if(!allowed.includes(String(user))) {
  addLog('warning', 'Unauthorized access attempt', { userId: user, username })
  return
 }

 incrementMessages()
 const txt=ctx.message.text.trim()

 addLog('info', 'Message received', { user: username, length: txt.length })

 const parts=txt.split(" ")

 if(parts.length>=3){

  const e=encrypt(parts[2])

  await pb.collection("secrets").create({
   url:parts[0],
   login:parts[1],
   password_enc:e.enc,
   iv:e.iv+":"+e.tag,
   created_by:String(user)
  })

  await pb.collection("audit_logs").create({
   user_id:String(user),
   action:"save",
   query:parts[0],
   timestamp:new Date().toISOString()
  })

  addLog('success', 'Password saved', { user: username, url: parts[0] })

  const m=await ctx.reply("saved")

  setTimeout(()=>{
   ctx.api.deleteMessage(ctx.chat.id,ctx.message.message_id).catch(()=>{})
   ctx.api.deleteMessage(ctx.chat.id,m.message_id).catch(()=>{})
  },120000)

  return
 }

 const list=await pb.collection("secrets").getFullList()

 const fuse=new Fuse(list,{keys:["url"]})

 const found=fuse.search(txt)

 if(!found.length){
  addLog('info', 'Password not found', { user: username, query: txt })
  await ctx.reply("not found")
  return
 }

 const r=found[0].item

 const [iv,tag]=r.iv.split(":")

 const pass=decrypt(r.password_enc,iv,tag)

 await pb.collection("audit_logs").create({
  user_id:String(user),
  action:"search",
  query:txt,
  timestamp:new Date().toISOString()
 })

 addLog('success', 'Password retrieved', { user: username, url: r.url })

 const kb=new InlineKeyboard().text("Delete","del_"+r.id)

 const reply=await ctx.reply(`URL: ${r.url}
Login: ${r.login}
Password: ${pass}`,{reply_markup:kb})

 setTimeout(()=>{
  ctx.api.deleteMessage(ctx.chat.id,ctx.message.message_id).catch(()=>{})
  ctx.api.deleteMessage(ctx.chat.id,reply.message_id).catch(()=>{})
 },120000)

})

bot.callbackQuery(/del_(.+)/,async ctx=>{

 const user=ctx.from.id
 const username = ctx.from.username || ctx.from.first_name || 'Unknown'

 if(!allowed.includes(String(user))){
  addLog('warning', 'Unauthorized delete attempt', { userId: user, username })
  await ctx.answerCallbackQuery("Access denied")
  return
 }

 incrementMessages()
 const secretId=ctx.match[1]

 await pb.collection("secrets").delete(secretId)

 await pb.collection("audit_logs").create({
  user_id:String(user),
  action:"delete",
  query:secretId,
  timestamp:new Date().toISOString()
 })

 addLog('success', 'Password deleted', { user: username, secretId })

 await ctx.answerCallbackQuery("Deleted")
 await ctx.deleteMessage().catch(()=>{})

})

bot.start()

console.log('Bot started successfully!')
console.log('Waiting for messages...')
addLog('success', 'Bot started successfully!')
addLog('info', 'Waiting for messages...')
updateStatus('running')

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping bot...')
  addLog('warning', 'Received SIGINT, stopping bot...')
  updateStatus('stopping')
  bot.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping bot...')
  addLog('warning', 'Received SIGTERM, stopping bot...')
  updateStatus('stopping')
  bot.stop()
  process.exit(0)
})

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  addLog('error', 'Uncaught exception: ' + error.message, { stack: error.stack })
  updateStatus('error')
  process.exit(1)
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
  addLog('error', 'Unhandled rejection: ' + error.message)
  updateStatus('error')
  process.exit(1)
})
