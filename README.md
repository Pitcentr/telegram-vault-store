
# Telegram Vault – Umbrel App (Production)

Production-ready Umbrel community app для безопасного хранения паролей через Telegram бота.

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
# Загрузите: apps/telegram-vault/metadata/screenshots/screenshot1.svg
# Скачайте как: screenshot1.png
# Или используйте screenshot-template.html (см. SETUP.md)
```

### 2. Обновить ссылки

В `apps/telegram-vault/umbrel-app.yml` замените:
```yaml
website: https://github.com/pitcentr/telegram-vault-store
repo: https://github.com/pitcentr/telegram-vault-store
support: https://github.com/pitcentr/telegram-vault-store/issues
```

### 3. Опубликовать на GitHub

```bash
git init
git add .
git commit -m "Initial commit: Telegram Vault for Umbrel"
git branch -M main
git remote add origin https://github.com/pitcentr/telegram-vault-store.git
git push -u origin main
```

### 4. Сделать Docker image публичным

После успешной сборки в GitHub Actions:
1. GitHub → Packages → telegram-vault
2. Package settings → Change visibility → Public

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
├── apps/telegram-vault/
│   ├── umbrel-app.yml            # Манифест приложения
│   ├── docker-compose.yml        # Docker конфигурация
│   ├── docker/
│   │   ├── Dockerfile            # Docker образ
│   │   ├── bot.js                # Telegram бот
│   │   └── package.json          # Зависимости
│   └── metadata/
│       ├── icon.svg              # Иконка приложения
│       └── screenshots/
│           └── screenshot1.png   # Скриншот интерфейса
└── .github/workflows/
    └── docker.yml                # CI/CD pipeline
```

## 🛠️ Разработка

### Локальный запуск

```bash
cd apps/telegram-vault/docker
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

### Сборка Docker image

```bash
cd apps/telegram-vault/docker
docker build -t telegram-vault .
docker run --env-file .env telegram-vault
```

## 📚 Документация

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
