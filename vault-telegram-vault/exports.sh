#!/usr/bin/env bash

# Telegram Bot Token (required)
# Get from @BotFather in Telegram
# Example: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
export APP_TG_TOKEN="${APP_TG_TOKEN:-}"

# PocketBase Admin Email (required)
# Default: admin@vault.local
export APP_PB_ADMIN="${APP_PB_ADMIN:-admin@vault.local}"

# PocketBase Admin Password (required)
# Minimum 8 characters
export APP_PB_PASSWORD="${APP_PB_PASSWORD:-}"

# Master Password for encryption (required)
# Minimum 32 characters recommended
# WARNING: If lost, all data will be unrecoverable!
export APP_MASTER_PASSWORD="${APP_MASTER_PASSWORD:-}"

# Allowed Telegram User IDs (required)
# Comma-separated list of user IDs
# Get your ID from @userinfobot in Telegram
# Example: 123456789,987654321
export APP_ALLOWED_USERS="${APP_ALLOWED_USERS:-}"

# PocketBase URL (optional)
# Default: http://pocketbase_server:8090
export APP_POCKETBASE_URL="${APP_POCKETBASE_URL:-http://pocketbase_server:8090}"
