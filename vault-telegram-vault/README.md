# Telegram Vault

Secure password manager using Telegram as interface with AES-256 encryption.

## Setup Instructions

After installation, you need to configure environment variables:

1. Get Telegram Bot Token from @BotFather
2. Get your Telegram User ID from @userinfobot
3. Set a strong master password for encryption
4. Configure PocketBase credentials

See INSTALL.md for detailed instructions.

## Environment Variables

- `APP_TG_TOKEN` - Your Telegram bot token
- `APP_PB_ADMIN` - PocketBase admin email
- `APP_PB_PASSWORD` - PocketBase admin password
- `APP_MASTER_PASSWORD` - Master password for encryption
- `APP_ALLOWED_USERS` - Comma-separated list of allowed Telegram user IDs

## Usage

Save password: `example.com username password123`
Search: `example`
