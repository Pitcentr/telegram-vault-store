# Чеклист перед публикацией в Umbrel

## ✅ Критические проверки

### 1. Структура репозитория
```
✅ umbrel-app-store.yml (в корне)
✅ apps/telegram-vault/umbrel-app.yml
✅ apps/telegram-vault/docker-compose.yml
✅ apps/telegram-vault/metadata/icon.svg
⚠️  apps/telegram-vault/metadata/screenshots/screenshot1.png (нужно создать из SVG)
✅ apps/telegram-vault/docker/Dockerfile
✅ apps/telegram-vault/docker/bot.js
✅ apps/telegram-vault/docker/package.json
✅ .github/workflows/docker.yml
```

### 2. Файл umbrel-app-store.yml
```yaml
✅ id: vault
✅ name: Vault App Store
```

### 3. Файл umbrel-app.yml
```yaml
✅ id: vault-telegram-vault
✅ name: Telegram Vault
✅ icon: metadata/icon.svg (без ./)
✅ category: security
✅ version: "1.0.0"
✅ dependencies: [pocketbase]
✅ path: ""
✅ docker-compose: docker-compose.yml
✅ gallery: [metadata/screenshots/screenshot1.png]
```

### 4. Файл docker-compose.yml
```yaml
✅ version: "3.7"
✅ image: ghcr.io/pitcentr/telegram-vault:latest (lowercase!)
✅ restart: unless-stopped
✅ Все переменные с префиксом APP_:
   ✅ APP_TG_TOKEN
   ✅ APP_PB_ADMIN
   ✅ APP_PB_PASSWORD
   ✅ APP_MASTER_PASSWORD
   ✅ APP_ALLOWED_USERS
✅ PB_URL: http://pocketbase_app_1:8090
✅ healthcheck настроен
```

### 5. GitHub Actions
```yaml
✅ Workflow: .github/workflows/docker.yml
✅ Триггер: push to main
✅ Registry: ghcr.io
✅ Image: ghcr.io/${{ github.repository_owner }}/telegram-vault:latest
✅ Context: ./apps/telegram-vault/docker
✅ Permissions: contents: read, packages: write
```

### 6. Docker Image
```dockerfile
✅ FROM node:20-alpine
✅ WORKDIR /app
✅ npm install
✅ CMD ["node","bot.js"]
```

### 7. Bot функциональность
```javascript
✅ AES-256-GCM шифрование
✅ SHA-256 для ключа из MASTER_PASSWORD
✅ Сохранение: url login password
✅ Fuzzy search через Fuse.js
✅ Автоудаление сообщений через 120 сек
✅ Inline кнопка Delete
✅ Проверка ALLOWED_USERS
✅ Audit logging (save, search, delete)
✅ Автоинициализация коллекций PocketBase
```

## 🔧 Действия перед публикацией

### Шаг 1: Конвертировать SVG в PNG
```bash
# Вариант 1: Использовать онлайн конвертер
# Откройте https://cloudconvert.com/svg-to-png
# Загрузите apps/telegram-vault/metadata/screenshots/screenshot1.svg
# Скачайте как screenshot1.png

# Вариант 2: Использовать ImageMagick (если установлен)
cd apps/telegram-vault/metadata/screenshots
magick convert screenshot1.svg screenshot1.png

# Вариант 3: Использовать Chrome DevTools
# Откройте screenshot-template.html в браузере
# F12 -> Ctrl+Shift+P -> "Capture node screenshot"
# Сохраните как screenshot1.png
```

### Шаг 2: Проверить Docker image name
```bash
# В docker-compose.yml должно быть LOWERCASE:
image: ghcr.io/pitcentr/telegram-vault:latest

# НЕ Pitcentr, а pitcentr!
```

### Шаг 3: Обновить ссылки в umbrel-app.yml
```yaml
# Замените на реальные ссылки:
website: https://github.com/pitcentr/telegram-vault-store
repo: https://github.com/pitcentr/telegram-vault-store
support: https://github.com/pitcentr/telegram-vault-store/issues
```

### Шаг 4: Создать GitHub репозиторий
```bash
# 1. Создайте публичный репозиторий на GitHub
# 2. Название: telegram-vault-store (или любое другое)
# 3. Push код:

git init
git add .
git commit -m "Initial commit: Telegram Vault for Umbrel"
git branch -M main
git remote add origin https://github.com/pitcentr/telegram-vault-store.git
git push -u origin main
```

### Шаг 5: Проверить GitHub Actions
```bash
# После push:
# 1. Перейдите в Actions вашего репозитория
# 2. Убедитесь что workflow "Build and Publish Docker Image" запустился
# 3. Дождитесь успешного завершения (зелёная галочка)
# 4. Перейдите в Packages
# 5. Убедитесь что появился telegram-vault:latest
```

### Шаг 6: Сделать image публичным
```bash
# 1. Перейдите в GitHub -> Packages -> telegram-vault
# 2. Package settings -> Change visibility
# 3. Выберите "Public"
# 4. Подтвердите
```

## 📦 Установка в Umbrel

### Добавить App Store
1. Откройте Umbrel UI
2. App Store -> Settings (⚙️)
3. Community App Stores
4. Add repository:
   ```
   https://github.com/pitcentr/telegram-vault-store
   ```
5. Нажмите Add

### Установить приложение
1. Найдите "Telegram Vault" в App Store
2. Нажмите Install
3. Заполните переменные:
   - TG_TOKEN: получите у @BotFather
   - PB_ADMIN: admin@example.com
   - PB_PASSWORD: минимум 8 символов
   - MASTER_PASSWORD: минимум 32 символа, сложный пароль
   - ALLOWED_USERS: ваш Telegram ID (узнайте у @userinfobot)

## 🧪 Тестирование

### После установки
1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте: `/start`
4. Сохраните пароль: `test.com user pass123`
5. Проверьте: бот ответил "✅ Saved"
6. Найдите пароль: `test`
7. Проверьте: бот показал карточку с паролем
8. Нажмите Delete
9. Проверьте: пароль удалён
10. Подождите 2 минуты: сообщения должны автоматически удалиться

## ⚠️ Частые ошибки

### Ошибка: "Failed to pull image"
- Проверьте что Docker image собран и опубликован
- Проверьте что image публичный (не private)
- Проверьте что имя lowercase: pitcentr, не Pitcentr

### Ошибка: "Invalid app.yml"
- Проверьте отступы в YAML (используйте пробелы, не табы)
- Проверьте что path: "" присутствует
- Проверьте что пути без ./ (metadata/icon.svg, не ./metadata/icon.svg)

### Ошибка: "Dependency not found"
- Убедитесь что PocketBase установлен в Umbrel
- Установите PocketBase из App Store перед установкой Telegram Vault

### Бот не отвечает
- Проверьте логи: Settings -> Apps -> Telegram Vault -> Logs
- Проверьте что TG_TOKEN правильный
- Проверьте что ваш ID в ALLOWED_USERS
- Проверьте что PocketBase запущен

## ✅ Финальная проверка

Перед публикацией убедитесь:
- [ ] screenshot1.png создан (не SVG!)
- [ ] Docker image собран и публичный
- [ ] Все ссылки обновлены
- [ ] Image name в lowercase
- [ ] Репозиторий публичный
- [ ] GitHub Actions успешно выполнился
- [ ] Тестовая установка в Umbrel прошла успешно
