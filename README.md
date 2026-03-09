
# Telegram Vault – Umbrel App

Umbrel community app для безопасного хранения паролей через Telegram бота.

## ⚠️ Важно: Исправление проблемы установки

Если приложение останавливается на 1% установки, см. [UMBREL-INSTALLATION-FIX.md](UMBREL-INSTALLATION-FIX.md) или [SUMMARY-RU.md](SUMMARY-RU.md) (на русском).

## 🔐 Возможности

- **AES-256-GCM шифрование** - все пароли шифруются перед сохранением
- **Telegram bot интерфейс** - удобное управление через мессенджер
- **PocketBase хранилище** - надёжная база данных
- **Fuzzy search** - умный поиск по частичному совпадению
- **Автоудаление сообщений** - через 120 секунд для безопасности
- **Audit logging** - журнал всех операций
- **Ограничение доступа** - только для разрешённых пользователей

## 📋 Перед публикацией

### 1. Конвертировать скриншот SVG → PNG

```bash
# Откройте https://cloudconvert.com/svg-to-png
# Загрузите: vault-telegram-vault/metadata/screenshots/screenshot1.svg
# Скачайте как: screenshot1.png
# Или используйте screenshot-template.html (см. SETUP.md)
```

### 2. Собрать и опубликовать Docker образ (ОБЯЗАТЕЛЬНО!)

```bash
cd vault-telegram-vault/docker
docker build -t pitcentr/telegram-vault:latest .
docker login
docker push pitcentr/telegram-vault:latest
```

См. [DOCKER-BUILD.md](vault-telegram-vault/DOCKER-BUILD.md) для подробностей.

### 3. Обновить ссылки

В `vault-telegram-vault/umbrel-app.yml` замените:
```yaml
website: https://github.com/pitcentr/telegram-vault-store
repo: https://github.com/pitcentr/telegram-vault-store
support: https://github.com/pitcentr/telegram-vault-store/issues
```

### 4. Опубликовать на GitHub

```bash
git init
git add .
git commit -m "Initial commit: Telegram Vault for Umbrel"
git branch -M main
git remote add origin https://github.com/pitcentr/telegram-vault-store.git
git push -u origin main
```

### 5. Сделать Docker image публичным

Если используете GitHub Container Registry:
1. GitHub → Packages → telegram-vault
2. Package settings → Change visibility → Public

Если используете Docker Hub - образ уже публичный после `docker push`.

## 🚀 Установка в Umbrel

### Добавить Community App Store

1. Откройте Umbrel
2. App Store → Settings (⚙️)
3. Community App Stores
4. Добавьте URL:
   ```
   https://github.com/pitcentr/telegram-vault-store
   ```

### Установить приложение

1. Найдите "Telegram Vault" в App Store
2. Нажмите Install
3. Заполните переменные:
   - **TG_TOKEN**: токен от @BotFather
   - **PB_ADMIN**: email администратора (например: admin@example.com)
   - **PB_PASSWORD**: пароль администратора (минимум 8 символов)
   - **MASTER_PASSWORD**: мастер-пароль для шифрования (минимум 32 символа)
   - **ALLOWED_USERS**: Telegram ID через запятую (узнайте у @userinfobot)

## 💡 Использование

### Сохранить пароль
```
github.com myusername mypassword123
```

### Найти пароль
```
github
```

Бот ответит:
```
URL: github.com
Login: myusername
Password: mypassword123
[Delete]
```

### Удалить пароль
Нажмите кнопку "Delete" под сообщением.

## 🔒 Безопасность

- Все пароли шифруются AES-256-GCM
- Ключ генерируется из MASTER_PASSWORD через SHA-256
- Доступ только для пользователей из ALLOWED_USERS
- Автоматическое удаление сообщений через 2 минуты
- Полный audit log всех операций

## 📁 Структура проекта

```
telegram-vault-store/
├── umbrel-app-store.yml          # Конфигурация App Store
├── vault-telegram-vault/
│   ├── umbrel-app.yml            # Манифест приложения
│   ├── docker-compose.yml        # Docker конфигурация
│   ├── docker/
│   │   ├── Dockerfile            # Docker образ
│   │   ├── bot.js                # Telegram бот
│   │   └── package.json          # Зависимости
│   ├── metadata/
│   │   ├── icon.svg              # Иконка приложения
│   │   └── screenshots/
│   │       └── screenshot1.png   # Скриншот интерфейса
│   └── scripts/
│       └── configure             # Скрипт настройки
└── UMBREL-INSTALLATION-FIX.md    # Инструкция по исправлению
```

## 🛠️ Разработка

### Локальный запуск

```bash
cd vault-telegram-vault/docker
npm install

# Создайте .env файл:
TG_TOKEN=your_token
PB_URL=http://localhost:8090
PB_ADMIN=admin@example.com
PB_PASSWORD=password
MASTER_PASSWORD=your_very_long_master_password_32_chars
ALLOWED_USERS=123456789

node bot.js
```

### Сборка и публикация Docker image

```bash
cd vault-telegram-vault/docker
docker build -t pitcentr/telegram-vault:latest .
docker login
docker push pitcentr/telegram-vault:latest
```

См. [DOCKER-BUILD.md](vault-telegram-vault/DOCKER-BUILD.md) для подробностей.

## 📚 Документация

### Установка и исправление проблем
- [UMBREL-INSTALLATION-FIX.md](UMBREL-INSTALLATION-FIX.md) - Исправление проблемы установки (English)
- [SUMMARY-RU.md](SUMMARY-RU.md) - Краткое резюме исправлений (Русский)
- [DEPLOYMENT-CHECKLIST.md](DEPLOYMENT-CHECKLIST.md) - Чеклист развертывания
- [DOCKER-BUILD.md](vault-telegram-vault/DOCKER-BUILD.md) - Инструкция по сборке Docker образа

### Дополнительно
- [SETUP.md](SETUP.md) - Подробная инструкция по установке
- [CHECKLIST.md](CHECKLIST.md) - Чеклист соответствия требованиям
- [PRE-PUBLISH-CHECKLIST.md](PRE-PUBLISH-CHECKLIST.md) - Проверка перед публикацией

## 🐛 Troubleshooting

### Бот не отвечает
- Проверьте TG_TOKEN
- Убедитесь что ваш ID в ALLOWED_USERS
- Проверьте логи: Umbrel → Apps → Telegram Vault → Logs

### Ошибка подключения к PocketBase
- Убедитесь что PocketBase установлен и запущен
- Проверьте PB_ADMIN и PB_PASSWORD

### Docker image не загружается
- Проверьте что image публичный в GitHub Packages
- Убедитесь что имя lowercase: pitcentr, не Pitcentr

## 📄 Лицензия

MIT License

## 🤝 Поддержка

Если у вас возникли проблемы:
1. Проверьте [PRE-PUBLISH-CHECKLIST.md](PRE-PUBLISH-CHECKLIST.md)
2. Посмотрите логи приложения в Umbrel
3. Создайте issue на GitHub
