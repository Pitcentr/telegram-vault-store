# Быстрое исправление переменных окружения

## Проблема
Переменные заданы в `.env`, но бот их не видит.

## Причина
Docker-compose не загружает `.env` файл автоматически в Umbrel.

## Решение

Добавлена строка `env_file: - .env` в docker-compose.yml

## Что делать СЕЙЧАС

### Вариант А: Обновить через GitHub (рекомендуется)

```bash
# 1. Закоммитьте исправление
git add .
git commit -m "Fix: Add env_file to docker-compose (v1.0.8)"
git push

# 2. Дождитесь сборки (3-5 минут)
# GitHub → Actions

# 3. Переустановите в Umbrel
# Uninstall → Install

# 4. Настройте переменные через SSH (см. ниже)
```

### Вариант Б: Исправить локально (быстрее)

Если не хотите ждать сборку, исправьте напрямую на Umbrel:

```bash
# 1. Подключитесь к Umbrel
ssh umbrel@umbrel.local

# 2. Перейдите в директорию
cd ~/umbrel/app-data/vault-telegram-vault

# 3. Отредактируйте docker-compose.yml
nano docker-compose.yml

# 4. Найдите секцию services: app:
# Добавьте ПЕРЕД environment:

env_file:
  - .env

# Должно получиться:
services:
  app:
    image: pitcentr/telegram-vault:latest
    user: "1000:1000"
    init: true
    restart: unless-stopped
    stop_grace_period: 1m
    env_file:              # ← ДОБАВЬТЕ ЭТО
      - .env               # ← И ЭТО
    environment:
      TG_TOKEN: ${APP_TG_TOKEN}
      ...

# 5. Сохраните (Ctrl+O, Enter, Ctrl+X)

# 6. Перезапустите
cd ~/umbrel
./scripts/app restart vault-telegram-vault

# 7. Проверьте логи
./scripts/app logs vault-telegram-vault
```

## Настройка переменных (если еще не сделали)

```bash
ssh umbrel@umbrel.local

cd ~/umbrel/app-data/vault-telegram-vault

# Создайте .env файл
nano .env

# Вставьте (замените на свои значения):
APP_TG_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
APP_PB_ADMIN=admin@vault.local
APP_PB_PASSWORD=SecurePass123
APP_MASTER_PASSWORD=MyVeryLongAndSecureMasterPassword123456
APP_ALLOWED_USERS=123456789
APP_POCKETBASE_URL=http://pocketbase_server:8090

# Сохраните (Ctrl+O, Enter, Ctrl+X)

# Перезапустите
cd ~/umbrel
./scripts/app restart vault-telegram-vault
```

## Проверка

После исправления логи должны показывать:

```
✅ Starting Telegram Vault bot...
✅ PocketBase URL: http://pocketbase_server:8090
✅ Allowed users: 123456789
✅ Successfully authenticated with PocketBase
✅ Bot started successfully!
```

## Если всё равно не работает

### Проверьте формат .env файла:

```bash
# Посмотрите содержимое
cat ~/umbrel/app-data/vault-telegram-vault/.env

# Должно быть БЕЗ пробелов вокруг =
# Правильно:
APP_TG_TOKEN=123456789:ABC

# Неправильно:
APP_TG_TOKEN = 123456789:ABC
APP_TG_TOKEN= 123456789:ABC
APP_TG_TOKEN =123456789:ABC
```

### Проверьте права на файл:

```bash
ls -la ~/umbrel/app-data/vault-telegram-vault/.env

# Должно быть:
-rw-r--r-- 1 umbrel umbrel ... .env

# Если нет, исправьте:
chmod 644 ~/umbrel/app-data/vault-telegram-vault/.env
```

### Проверьте, что файл не пустой:

```bash
wc -l ~/umbrel/app-data/vault-telegram-vault/.env

# Должно быть минимум 5 строк
```

## Альтернативное решение

Если env_file не работает, можно прописать переменные напрямую:

```bash
ssh umbrel@umbrel.local
cd ~/umbrel/app-data/vault-telegram-vault
nano docker-compose.yml

# Измените environment на:
environment:
  TG_TOKEN: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
  PB_URL: "http://pocketbase_server:8090"
  PB_ADMIN: "admin@vault.local"
  PB_PASSWORD: "YourPassword123"
  MASTER_PASSWORD: "YourLongMasterPassword123456"
  ALLOWED_USERS: "123456789"

# Сохраните и перезапустите
cd ~/umbrel
./scripts/app restart vault-telegram-vault
```

---

**После любого из этих способов бот должен запуститься!** 🚀
