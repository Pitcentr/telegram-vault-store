# 🚀 Быстрый старт

## Перед публикацией (5 минут)

### 1. Конвертировать скриншот
```bash
# Откройте: https://cloudconvert.com/svg-to-png
# Загрузите: apps/telegram-vault/metadata/screenshots/screenshot1.svg
# Скачайте как: screenshot1.png (в ту же папку)
```

### 2. Обновить ссылки
Откройте `apps/telegram-vault/umbrel-app.yml` и замените:
```yaml
website: https://github.com/pitcentr/telegram-vault-store
repo: https://github.com/pitcentr/telegram-vault-store
support: https://github.com/pitcentr/telegram-vault-store/issues
```

### 3. Опубликовать на GitHub
```bash
# Создайте публичный репозиторий на GitHub: telegram-vault-store

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/pitcentr/telegram-vault-store.git
git push -u origin main
```

### 4. Дождаться сборки
- Перейдите в Actions вашего репозитория
- Дождитесь зелёной галочки ✅
- Перейдите в Packages → telegram-vault
- Settings → Change visibility → Public

## Установка в Umbrel (2 минуты)

### 1. Добавить App Store
```
Umbrel → App Store → ⚙️ → Community App Stores
→ Add: https://github.com/pitcentr/telegram-vault-store
```

### 2. Установить приложение
```
App Store → Telegram Vault → Install
```

### 3. Заполнить переменные

**TG_TOKEN**
```
1. Откройте @BotFather в Telegram
2. Отправьте: /newbot
3. Следуйте инструкциям
4. Скопируйте токен
```

**PB_ADMIN**
```
admin@example.com
```

**PB_PASSWORD**
```
Любой пароль (минимум 8 символов)
Например: MySecurePass123
```

**MASTER_PASSWORD**
```
Очень длинный и сложный пароль (минимум 32 символа)
Например: MyVeryLongAndSecureMasterPassword2024!@#$
```

**ALLOWED_USERS**
```
1. Откройте @userinfobot в Telegram
2. Отправьте любое сообщение
3. Скопируйте ваш ID (например: 123456789)
4. Если несколько пользователей: 123456789,987654321
```

## Использование (30 секунд)

### Сохранить пароль
```
github.com myuser mypass123
```

### Найти пароль
```
github
```

### Удалить пароль
Нажмите кнопку "Delete"

## ✅ Готово!

Ваш Telegram Vault работает и готов к использованию.

## 🆘 Проблемы?

### Бот не отвечает
```bash
# Проверьте логи:
Umbrel → Apps → Telegram Vault → Logs

# Проверьте что:
# 1. TG_TOKEN правильный
# 2. Ваш ID в ALLOWED_USERS
# 3. PocketBase запущен
```

### Image не загружается
```bash
# Убедитесь что:
# 1. GitHub Actions успешно выполнился (зелёная галочка)
# 2. Docker image публичный (не private)
# 3. Имя lowercase: pitcentr, не Pitcentr
```

### Ошибка в umbrel-app.yml
```bash
# Проверьте:
# 1. Отступы (пробелы, не табы)
# 2. path: "" присутствует
# 3. Пути без ./
```

## 📚 Подробная документация

- [README.md](README.md) - Полная документация
- [SETUP.md](SETUP.md) - Детальная инструкция
- [PRE-PUBLISH-CHECKLIST.md](PRE-PUBLISH-CHECKLIST.md) - Чеклист проверки
