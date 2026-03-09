# Исправление: Telegram бот без веб-интерфейса

## Проблема
Установка доходит до 100%, но кнопка остается "Install" вместо "Open".

## Причина
Telegram Vault - это бот без веб-интерфейса, но мы настроили `app_proxy` и `port`, которые нужны только для приложений с веб-интерфейсом. Umbrel ждет HTTP ответа на порту 8080, но бот его не предоставляет.

## Что исправлено

### 1. Удален app_proxy
```yaml
# УДАЛЕНО:
services:
  app_proxy:
    environment:
      APP_HOST: vault-telegram-vault_app_1
      APP_PORT: 8080
```

### 2. Удален port из umbrel-app.yml
```yaml
# УДАЛЕНО:
port: 8080
```

### 3. Удален depends_on
```yaml
# УДАЛЕНО:
depends_on:
  - pocketbase
```
(PocketBase установлен как отдельное приложение, не как сервис в этом compose)

### 4. Обновлена версия
```yaml
version: "1.0.3"
```

### 5. Добавлено пояснение в описание
```yaml
description: >-
  ...
  This is a Telegram bot - no web interface. After installation, interact with your bot in Telegram.
```

## Что делать сейчас

### Шаг 1: Закоммитьте изменения

```bash
git add .
git commit -m "Fix: Remove app_proxy - bot has no web interface"
git push
```

### Шаг 2: Дождитесь сборки

- GitHub → Actions → дождитесь завершения (3-5 минут)
- Проверьте Docker Hub: должен появиться тег `1.0.3`

### Шаг 3: Удалите приложение в Umbrel

1. Umbrel → Apps → Telegram Vault
2. Uninstall
3. Подтвердите удаление

### Шаг 4: Переустановите

1. App Store → Telegram Vault
2. Install
3. Заполните переменные:
   - `APP_TG_TOKEN` - токен от @BotFather
   - `APP_PB_ADMIN` - admin@vault.local
   - `APP_PB_PASSWORD` - ваш пароль
   - `APP_MASTER_PASSWORD` - мастер-пароль (32+ символа)
   - `APP_ALLOWED_USERS` - ваш Telegram ID
   - `APP_POCKETBASE_URL` - http://pocketbase_server:8090 (если PocketBase установлен)

### Шаг 5: Проверьте логи

После установки:
1. Umbrel → Apps → Telegram Vault → Logs
2. Должно быть:
   ```
   Starting Telegram Vault bot...
   Successfully authenticated with PocketBase
   Bot started successfully!
   ```

### Шаг 6: Проверьте бота

1. Откройте Telegram
2. Найдите вашего бота
3. Отправьте: `/start`
4. Отправьте: `test.com user pass123`
5. Бот должен ответить: "saved"

## Почему не нужен app_proxy?

### Приложения С веб-интерфейсом:
- Nextcloud, WordPress, Grafana и т.д.
- Нужен `app_proxy` для доступа через браузер
- Нужен `port` для маршрутизации
- Кнопка "Open" открывает веб-интерфейс

### Приложения БЕЗ веб-интерфейса:
- Telegram боты, CLI утилиты, фоновые сервисы
- НЕ нужен `app_proxy`
- НЕ нужен `port`
- Нет кнопки "Open" (это нормально!)

## Примеры приложений без веб-интерфейса

Посмотрите на другие Umbrel приложения без UI:
- Bitcoin Core (только RPC)
- Lightning Network Daemon (только API)
- Tor (фоновый сервис)

У них тоже нет кнопки "Open" - это нормально!

## Как использовать после установки?

1. **Проверьте статус:**
   - Umbrel → Apps → Telegram Vault
   - Статус должен быть "Running" (зеленый)

2. **Посмотрите логи:**
   - Logs → должно быть "Bot started successfully!"

3. **Используйте в Telegram:**
   - Откройте бота в Telegram
   - Все команды работают через мессенджер

## Если всё равно не работает

### Проверьте переменные окружения:

```bash
# В Umbrel посмотрите логи
# Если видите "Missing required environment variables"
# Значит не все переменные заполнены
```

Обязательные переменные:
- `APP_TG_TOKEN` - не должен быть пустым
- `APP_PB_ADMIN` - email администратора
- `APP_PB_PASSWORD` - пароль
- `APP_MASTER_PASSWORD` - минимум 32 символа
- `APP_ALLOWED_USERS` - ваш Telegram ID (число)

### Проверьте PocketBase:

```bash
# Убедитесь, что PocketBase установлен и запущен
# Umbrel → Apps → PocketBase → должен быть Running
```

### Проверьте токен бота:

```bash
# Проверьте токен через Telegram API
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe

# Должен вернуть информацию о боте
```

## FAQ

**Q: Почему нет кнопки "Open"?**
A: Это Telegram бот, у него нет веб-интерфейса. Используйте бота в Telegram.

**Q: Как узнать, что бот работает?**
A: Проверьте логи в Umbrel. Должно быть "Bot started successfully!"

**Q: Нужен ли app_proxy для ботов?**
A: Нет! app_proxy только для приложений с веб-интерфейсом.

**Q: Можно ли добавить веб-интерфейс?**
A: Да, но это потребует изменений в коде бота. Сейчас всё управление через Telegram.

---

**После исправления приложение должно запуститься корректно!** 🚀
