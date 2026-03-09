# Исправление ошибки app_proxy

## Проблема

```
Error waiting for port: "The address 'vault-telegram-vault_app_1' cannot be found"
```

## Причина

Umbrel использует динамические IP-адреса для контейнеров, а не статические имена. Нужно использовать переменную окружения `$APP_VAULT_TELEGRAM_VAULT_APP_IP` вместо имени контейнера.

## Что исправлено

### Было (неправильно):
```yaml
app_proxy:
  environment:
    APP_HOST: vault-telegram-vault_app_1
    APP_PORT: 8080
```

### Стало (правильно):
```yaml
app_proxy:
  environment:
    APP_HOST: $APP_VAULT_TELEGRAM_VAULT_APP_IP
    APP_PORT: 8080
```

## Формат переменной

Umbrel автоматически создает переменные для IP-адресов контейнеров:

```
$APP_{APP_ID}_{SERVICE_NAME}_IP
```

Где:
- `APP_ID` = `VAULT_TELEGRAM_VAULT` (ID приложения в верхнем регистре с подчеркиваниями)
- `SERVICE_NAME` = `APP` (имя сервиса в верхнем регистре)

Результат: `$APP_VAULT_TELEGRAM_VAULT_APP_IP`

## Что делать сейчас

### Шаг 1: Закоммитьте исправление

```bash
git add .
git commit -m "Fix: Use correct app_proxy IP variable (v1.0.5)"
git push
```

### Шаг 2: Дождитесь сборки

- GitHub → Actions (3-5 минут)
- Docker Hub → проверьте тег `1.0.5`

### Шаг 3: Переустановите в Umbrel

**Удалите старую версию:**
```
Umbrel → Apps → Telegram Vault → Uninstall
```

**Установите новую версию:**
```
App Store → Telegram Vault → Install
→ Заполните переменные (те же, что и раньше)
```

### Шаг 4: Проверьте работу

**Логи должны показывать:**
```
✅ Starting Telegram Vault bot...
✅ Web UI started on port 8080
✅ Successfully authenticated with PocketBase
✅ Bot started successfully!
```

**Откройте дашборд:**
```
Umbrel → Apps → Telegram Vault → Open
```

Должен открыться веб-интерфейс с мониторингом!

## Проверка app_proxy

После установки проверьте, что app_proxy работает:

```bash
# В логах НЕ должно быть:
❌ Error waiting for port
❌ cannot be found

# Должно быть:
✅ Proxy started
✅ Forwarding to app
```

## Другие примеры правильных переменных

### Для разных app ID:

```yaml
# App ID: my-app
# Service: web
APP_HOST: $APP_MY_APP_WEB_IP

# App ID: bitcoin-node
# Service: server
APP_HOST: $APP_BITCOIN_NODE_SERVER_IP

# App ID: vault-telegram-vault
# Service: app
APP_HOST: $APP_VAULT_TELEGRAM_VAULT_APP_IP
```

### Правило формирования:

1. Возьмите app ID: `vault-telegram-vault`
2. Замените дефисы на подчеркивания: `vault_telegram_vault`
3. Переведите в верхний регистр: `VAULT_TELEGRAM_VAULT`
4. Добавьте префикс `APP_`: `APP_VAULT_TELEGRAM_VAULT`
5. Добавьте имя сервиса в верхнем регистре: `APP_VAULT_TELEGRAM_VAULT_APP`
6. Добавьте суффикс `_IP`: `APP_VAULT_TELEGRAM_VAULT_APP_IP`
7. Добавьте `$`: `$APP_VAULT_TELEGRAM_VAULT_APP_IP`

## Почему это важно

### Статические имена (не работают в Umbrel):
- `vault-telegram-vault_app_1`
- `app`
- `localhost`

### Динамические IP (работают в Umbrel):
- `$APP_VAULT_TELEGRAM_VAULT_APP_IP`
- Umbrel автоматически подставляет реальный IP
- Работает в изолированной сети Docker

## Troubleshooting

### Ошибка всё равно появляется

**Проверьте:**
1. Версия приложения = 1.0.5
2. Docker образ обновлен на Docker Hub
3. Приложение переустановлено (не просто перезапущено)

### Дашборд не открывается

**Проверьте:**
1. Статус приложения = Running (зеленый)
2. Логи показывают "Web UI started"
3. Порт 8080 указан в umbrel-app.yml

### Бот не отвечает

**Проверьте:**
1. Переменные окружения заполнены
2. Токен правильный
3. ALLOWED_USERS содержит ваш ID

## Быстрая проверка

```bash
# 1. Закоммитьте
git add . && git commit -m "Fix app_proxy v1.0.5" && git push

# 2. Дождитесь сборки (GitHub Actions)

# 3. Переустановите в Umbrel

# 4. Проверьте логи - не должно быть ошибок

# 5. Откройте дашборд - должен работать

# 6. Проверьте бота в Telegram
```

## Документация

- [WEB-DASHBOARD-ADDED.md](WEB-DASHBOARD-ADDED.md) - О веб-дашборде
- [КАК-НАСТРОИТЬ-ПЕРЕМЕННЫЕ.md](КАК-НАСТРОИТЬ-ПЕРЕМЕННЫЕ.md) - Настройка переменных
- [ПОЛУЧЕНИЕ-ТОКЕНА-БОТА.md](ПОЛУЧЕНИЕ-ТОКЕНА-БОТА.md) - Получение токена

---

**После этого исправления всё должно работать!** 🚀
