
import {Bot,InlineKeyboard} from "grammy"
import PocketBase from "pocketbase"
import dotenv from "dotenv"
import Fuse from "fuse.js"
import crypto from "crypto"

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

  // All code below only runs if variables are present
  console.log('Starting Telegram Vault bot...')
  console.log('PocketBase URL:', process.env.PB_URL)
  console.log('Allowed users:', process.env.ALLOWED_USERS)

  const bot=new Bot(process.env.TG_TOKEN)

  const pb=new PocketBase(process.env.PB_URL)

try {
  await pb.admins.authWithPassword(
    process.env.PB_ADMIN,
    process.env.PB_PASSWORD
  )
  console.log('Successfully authenticated with PocketBase')
} catch (error) {
  console.error('Failed to authenticate with PocketBase:', error.message)
  console.error('Make sure PocketBase is running and credentials are correct')
  process.exit(1)
}

// Initialize collections
try {
 await pb.collections.getOne("secrets")
 console.log('Collection "secrets" already exists')
} catch {
 console.log('Creating collection "secrets"...')
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
}

try {
 await pb.collections.getOne("audit_logs")
 console.log('Collection "audit_logs" already exists')
} catch {
 console.log('Creating collection "audit_logs"...')
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
  console.log('Unauthorized access attempt from:', username, user)
  return
 }

 const txt=ctx.message.text.trim()
 console.log('Message received from:', username)

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

  console.log('Password saved for:', parts[0], 'by:', username)

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
  console.log('Password not found for query:', txt, 'by:', username)
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

 console.log('Password retrieved for:', r.url, 'by:', username)

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
  console.log('Unauthorized delete attempt from:', username, user)
  await ctx.answerCallbackQuery("Access denied")
  return
 }

 const secretId=ctx.match[1]

 await pb.collection("secrets").delete(secretId)

 await pb.collection("audit_logs").create({
  user_id:String(user),
  action:"delete",
  query:secretId,
  timestamp:new Date().toISOString()
 })

 console.log('Password deleted by:', username, 'secretId:', secretId)

 await ctx.answerCallbackQuery("Deleted")
 await ctx.deleteMessage().catch(()=>{})

})

bot.start()

console.log('Bot started successfully!')
console.log('Waiting for messages...')

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping bot...')
  bot.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping bot...')
  bot.stop()
  process.exit(0)
})

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
  process.exit(1)
})

} // End of main function

// Start the app
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
