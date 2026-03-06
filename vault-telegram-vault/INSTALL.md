# Telegram Vault Installation Guide

## Required Environment Variables

Before installing, you need to prepare the following:

### 1. TG_TOKEN (Telegram Bot Token)
- Go to [@BotFather](https://t.me/BotFather) on Telegram
- Send `/newbot` command
- Follow instructions to create your bot
- Copy the token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. PB_ADMIN (PocketBase Admin Email)
- Use any email address (e.g., `admin@vault.local`)
- This will be created automatically

### 3. PB_PASSWORD (PocketBase Admin Password)
- Create a strong password for PocketBase admin
- Minimum 8 characters recommended

### 4. MASTER_PASSWORD (Encryption Master Password)
- Create a very strong password for encrypting your secrets
- This password encrypts all your stored passwords
- **IMPORTANT**: If you lose this password, all data will be unrecoverable!

### 5. ALLOWED_USERS (Telegram User IDs)
- Get your Telegram user ID from [@userinfobot](https://t.me/userinfobot)
- For multiple users, separate with commas: `123456789,987654321`

## Installation Steps

1. Install PocketBase from Umbrel App Store first (it's a dependency)
2. Install Telegram Vault
3. When prompted, enter all the environment variables above
4. Wait for installation to complete
5. Send a message to your bot on Telegram to test

## Usage

### Save a password:
```
example.com username password123
```

### Search for a password:
```
example
```

The bot will show you the credentials and auto-delete the message after 2 minutes.
