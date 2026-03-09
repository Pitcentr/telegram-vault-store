# Telegram Vault

Encrypted password manager using Telegram bot with AES-256 encryption and PocketBase storage.

## Quick Setup

### 1. Get Bot Token
1. Open Telegram, search @BotFather
2. Send `/newbot` and follow instructions
3. Copy your bot token

### 2. Get Your Telegram ID
1. Search @userinfobot in Telegram
2. Send `/start`
3. Copy your user ID

### 3. Configure App

SSH into your Umbrel:
```bash
ssh umbrel@umbrel.local
```

Edit configuration:
```bash
cd ~/umbrel/app-data/vault-telegram-vault
nano docker-compose.yml
```

Update these values:
```yaml
environment:
  TG_TOKEN: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"  # From @BotFather
  PB_ADMIN: "admin@vault.local"                      # Any email
  PB_PASSWORD: "SecurePassword123"                   # Min 8 chars
  MASTER_PASSWORD: "VeryLongSecureMasterPassword"    # Min 32 chars recommended
  ALLOWED_USERS: "123456789"                         # Your Telegram ID
```

Save (Ctrl+O, Enter, Ctrl+X) and restart:
```bash
cd ~/umbrel
docker-compose restart
```

## Usage

Send to your bot:
- `github.com mylogin mypassword` - Save password
- `github` - Search and get password
- Click "Delete" - Remove password

All messages auto-delete after 2 minutes for security.

## Security Notes

- Master password encrypts all data with AES-256-GCM
- If you lose master password, data cannot be recovered
- Only specified Telegram user IDs can access the bot
- Use strong, unique master password (32+ characters)
