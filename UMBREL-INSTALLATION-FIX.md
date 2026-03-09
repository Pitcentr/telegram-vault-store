# Umbrel Installation Fix

## Problem
The app was stuck at 1% during installation in Umbrel.

## Root Cause
Umbrel cannot build Docker images during installation. The `docker-compose.yml` was using `build:` directive instead of a pre-built image.

## Applied Fixes

### 1. Added Required `app_proxy` Service
```yaml
app_proxy:
  environment:
    APP_HOST: vault-telegram-vault_app_1
    APP_PORT: 8080
```

### 2. Replaced Build with Pre-built Image
```yaml
# Before:
build:
  context: ./docker
  dockerfile: Dockerfile

# After:
image: pitcentr/telegram-vault:latest
```

### 3. Added Required Parameters
```yaml
user: "1000:1000"  # Standard Umbrel user
init: true         # Proper signal handling
depends_on:
  - pocketbase     # Service dependency
```

### 4. Updated App Configuration
- Added `port: 8080` to `umbrel-app.yml`
- Removed incorrect `dependencies: [pocketbase]` from `umbrel-app.yml`
- Updated version to 1.0.2

## Required Actions Before Installation

### Step 1: Build and Publish Docker Image

```bash
# Navigate to docker directory
cd vault-telegram-vault/docker

# Build the image
docker build -t pitcentr/telegram-vault:latest .

# Login to Docker Hub (requires account at hub.docker.com)
docker login

# Push the image
docker push pitcentr/telegram-vault:latest
```

**This step is MANDATORY! Without it, the app won't install.**

### Step 2: Commit Changes

```bash
git add .
git commit -m "Fix: Add app_proxy and use pre-built Docker image for Umbrel compatibility"
git push
```

### Step 3: Install in Umbrel

1. Open Umbrel dashboard
2. Go to App Store
3. Add your Community App Store (if not already added)
4. Find Telegram Vault
5. Install
6. Configure environment variables:
   - `APP_TG_TOKEN` - Bot token from @BotFather
   - `APP_PB_ADMIN` - PocketBase admin email
   - `APP_PB_PASSWORD` - PocketBase admin password
   - `APP_MASTER_PASSWORD` - Master password for encryption
   - `APP_ALLOWED_USERS` - Comma-separated Telegram user IDs

## Verification

After installation, check logs in Umbrel. You should see:

```
Starting Telegram Vault bot...
PocketBase URL: http://pocketbase_server:8090
Successfully authenticated with PocketBase
Collection "secrets" already exists
Collection "audit_logs" already exists
Bot started successfully!
Waiting for messages...
```

## Compliance with Umbrel Standards

✅ Correct `umbrel-app.yml` format
✅ Required `app_proxy` service present
✅ Uses pre-built Docker image
✅ Includes `user` and `init` parameters
✅ Correct app ID format (matches app store prefix)
✅ Port specified
✅ Metadata (icon, screenshots) accessible

## Troubleshooting

### "Cannot pull image" error
→ You haven't published the Docker image to Docker Hub (see Step 1)

### "Failed to authenticate with PocketBase" error
→ Ensure PocketBase is installed and running in Umbrel

### "Missing required environment variables" error
→ Fill in all environment variables in app settings

## Additional Resources

- [DOCKER-BUILD.md](./vault-telegram-vault/DOCKER-BUILD.md) - Detailed build instructions
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Complete deployment checklist
- [UMBREL-FIXES-APPLIED.md](./UMBREL-FIXES-APPLIED.md) - Detailed list of all fixes
- [Official Umbrel Community App Store](https://github.com/getumbrel/umbrel-community-app-store)

## Quick Start

```bash
# Build and publish image
cd vault-telegram-vault/docker
docker build -t pitcentr/telegram-vault:latest .
docker login
docker push pitcentr/telegram-vault:latest

# Commit changes
cd ../..
git add .
git commit -m "Fix Umbrel installation issues"
git push

# Install via Umbrel UI
```

The app should now install successfully! 🚀
