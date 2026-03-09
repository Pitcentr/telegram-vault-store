# Быстрое исправление проблемы установки

## Проблема
Приложение останавливается на 1% установки в Umbrel.

## Причина
Umbrel не может собирать Docker образы во время установки. Ваш `docker-compose.yml` использовал `build:` вместо готового образа.

## Решение (3 шага)

### 1. Соберите и опубликуйте Docker образ

```bash
cd vault-telegram-vault/docker
docker build -t pitcentr/telegram-vault:latest .
docker login
docker push pitcentr/telegram-vault:latest
```

Если у вас нет аккаунта Docker Hub:
1. Зарегистрируйтесь на https://hub.docker.com
2. Создайте репозиторий `telegram-vault`
3. Выполните команды выше

### 2. Проверьте изменения

Файлы уже исправлены:
- ✅ `docker-compose.yml` - добавлен `app_proxy`, заменен `build` на `image`
- ✅ `umbrel-app.yml` - добавлен `port`, обновлена версия

### 3. Установите в Umbrel

1. Закоммитьте и запушьте изменения в GitHub
2. В Umbrel добавьте ваш App Store (если еще не добавлен)
3. Установите приложение
4. Настройте переменные окружения:
   - `APP_TG_TOKEN` - токен бота
   - `APP_PB_ADMIN` - admin email
   - `APP_PB_PASSWORD` - admin password
   - `APP_MASTER_PASSWORD` - мастер-пароль
   - `APP_ALLOWED_USERS` - ID пользователей через запятую

## Что было исправлено

| Проблема | Решение |
|----------|---------|
| `build: ./docker` | `image: pitcentr/telegram-vault:latest` |
| Нет `app_proxy` | Добавлен обязательный сервис |
| Нет `user` и `init` | Добавлено `user: "1000:1000"` и `init: true` |
| Нет `port` | Добавлено `port: 8080` |
| Версия 1.0.1 | Обновлено до 1.0.2 |

## Проверка

После установки проверьте логи:
```bash
docker logs vault-telegram-vault_app_1
```

Должно быть:
```
Starting Telegram Vault bot...
Successfully authenticated with PocketBase
Bot started successfully!
```

## Если всё равно не работает

1. Убедитесь, что образ опубликован: https://hub.docker.com/r/pitcentr/telegram-vault
2. Проверьте, что PocketBase установлен и запущен
3. Проверьте переменные окружения в Umbrel UI
4. Посмотрите логи: Settings → App Logs → Telegram Vault
