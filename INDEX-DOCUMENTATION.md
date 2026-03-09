# Documentation Index

## 🚨 Start Here

If your app is stuck at 1% during Umbrel installation:

- **[КРАТКАЯ-ИНСТРУКЦИЯ.md](КРАТКАЯ-ИНСТРУКЦИЯ.md)** - Быстрое решение (3 команды) 🇷🇺
- **[QUICK-FIX-GUIDE.md](QUICK-FIX-GUIDE.md)** - Quick fix guide (3 steps) 🇬🇧

## 📖 Complete Guides

### Russian (Русский)
- **[SUMMARY-RU.md](SUMMARY-RU.md)** - Полное резюме всех исправлений
- **[DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md)** - Чеклист развертывания
- **[UMBREL-FIXES-APPLIED.md](UMBREL-FIXES-APPLIED.md)** - Детальное описание проблем и решений

### English
- **[UMBREL-INSTALLATION-FIX.md](UMBREL-INSTALLATION-FIX.md)** - Complete installation fix guide
- **[CHANGES-SUMMARY.md](CHANGES-SUMMARY.md)** - Summary of all changes with diffs

## 🐳 Docker Instructions

- **[vault-telegram-vault/DOCKER-BUILD.md](vault-telegram-vault/DOCKER-BUILD.md)** - How to build and publish Docker image

## 📋 What Was Fixed

### Critical Issues
1. ❌ Missing `app_proxy` service → ✅ Added
2. ❌ Using `build:` instead of image → ✅ Changed to `image: pitcentr/telegram-vault:latest`
3. ❌ Missing `user` and `init` → ✅ Added
4. ❌ Missing `port` in umbrel-app.yml → ✅ Added

### Files Modified
- `vault-telegram-vault/docker-compose.yml` - Added app_proxy, changed to pre-built image
- `vault-telegram-vault/umbrel-app.yml` - Added port, updated version
- `README.md` - Updated paths and added fix documentation

## 🚀 Quick Start

```bash
# 1. Build and publish Docker image
cd vault-telegram-vault/docker
docker build -t pitcentr/telegram-vault:latest .
docker login
docker push pitcentr/telegram-vault:latest

# 2. Commit changes
cd ../..
git add .
git commit -m "Fix: Umbrel installation issues"
git push

# 3. Install in Umbrel UI
```

## 📚 Additional Documentation

### Existing Files
- **[README.md](README.md)** - Main project documentation
- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[CHECKLIST.md](CHECKLIST.md)** - Compliance checklist
- **[PRE-PUBLISH-CHECKLIST.md](PRE-PUBLISH-CHECKLIST.md)** - Pre-publication checklist

### Configuration Files
- **[umbrel-app-store.yml](umbrel-app-store.yml)** - App store configuration
- **[vault-telegram-vault/umbrel-app.yml](vault-telegram-vault/umbrel-app.yml)** - App manifest
- **[vault-telegram-vault/docker-compose.yml](vault-telegram-vault/docker-compose.yml)** - Docker services
- **[vault-telegram-vault/.env.example](vault-telegram-vault/.env.example)** - Environment variables template

## 🔍 Troubleshooting

### Common Errors

**App stuck at 1% installation**
→ See [КРАТКАЯ-ИНСТРУКЦИЯ.md](КРАТКАЯ-ИНСТРУКЦИЯ.md) or [QUICK-FIX-GUIDE.md](QUICK-FIX-GUIDE.md)

**"Cannot pull image" error**
→ You need to publish Docker image first (see [DOCKER-BUILD.md](vault-telegram-vault/DOCKER-BUILD.md))

**"Failed to authenticate with PocketBase"**
→ Install PocketBase from Umbrel App Store first

**"Missing environment variables"**
→ Fill in all required variables in Umbrel app settings

## ✅ Verification

After installation, check logs in Umbrel. You should see:

```
Starting Telegram Vault bot...
Successfully authenticated with PocketBase
Bot started successfully!
Waiting for messages...
```

## 🎯 Compliance Status

✅ Matches Umbrel Community App Store template
✅ All required services present
✅ Uses pre-built Docker image
✅ Includes user and init parameters
✅ Port specified
✅ App ID matches store prefix
✅ Metadata accessible

## 📞 Support

If you still have issues:
1. Check the relevant documentation above
2. Review logs in Umbrel: Settings → App Logs → Telegram Vault
3. Create an issue on GitHub

---

**Last Updated:** March 9, 2026
**Version:** 1.0.2
