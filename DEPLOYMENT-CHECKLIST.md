# Чеклист развертывания Telegram Vault в Umbrel

## ✅ Исправления применены

- [x] Добавлен сервис `app_proxy` в docker-compose.yml
- [x] Заменен `build` на `image: pitcentr/telegram-vault:latest`
- [x] Добавлены `user: "1000:1000"` и `init: true`
- [x] Добавлен `port: 8080` в umbrel-app.yml
- [x] Удалена неправильная зависимость `pocketbase` из umbrel-app.yml
- [x] Добавлен `depends_on: pocketbase` в docker-compose.yml
- [x] Обновлена версия до 1.0.2
- [x] ID приложения соответствует префиксу app store (`vault-telegram-vault`)

## 📋 Перед публикацией

### 1. Docker образ
- [ ] Собрать образ: `docker build -t pitcentr/telegram-vault:latest ./vault-telegram-vault/docker`
- [ ] Протестировать локально
- [ ] Войти в Docker Hub: `docker login`
- [ ] Опубликовать: `docker push pitcentr/telegram-vault:latest`
- [ ] Проверить доступность: https://hub.docker.com/r/pitcentr/telegram-vault

### 2. GitHub репозиторий
- [ ] Закоммитить все изменения
- [ ] Запушить в main/master ветку
- [ ] Проверить, что все файлы доступны по raw URL
- [ ] Убедиться, что иконка и скриншоты загружаются

### 3. Тестирование
- [ ] Установить PocketBase в Umbrel (если еще не установлен)
- [ ] Добавить App Store в Umbrel
- [ ] Установить Telegram Vault
- [ ] Настроить переменные окружения
- [ ] Проверить логи приложения
- [ ] Протестировать функционал бота

## 🚀 Команды для публикации

```bash
# 1. Соберите образ
cd vault-telegram-vault/docker
docker build -t pitcentr/telegram-vault:latest .

# 2. Опубликуйте
docker login
docker push pitcentr/telegram-vault:latest

# 3. Опционально: версионированный тег
docker tag pitcentr/telegram-vault:latest pitcentr/telegram-vault:1.0.2
docker push pitcentr/telegram-vault:1.0.2

# 4. Закоммитьте изменения
cd ../..
git add .
git commit -m "Fix Umbrel installation issues - add app_proxy and use pre-built image"
git push
```

## 🔍 Проверка после установки

### Логи должны показывать:
```
Starting Telegram Vault bot...
PocketBase URL: http://pocketbase_server:8090
Allowed users: [ваши ID]
Successfully authenticated with PocketBase
Collection "secrets" already exists
Collection "audit_logs" already exists
Bot started successfully!
Waiting for messages...
```

### Если есть ошибки:

**"Failed to authenticate with PocketBase"**
- Проверьте, что PocketBase запущен
- Проверьте APP_PB_ADMIN и APP_PB_PASSWORD

**"Missing required environment variables"**
- Проверьте все переменные в Umbrel UI
- Убедитесь, что нет пустых значений

**"Cannot connect to Telegram"**
- Проверьте APP_TG_TOKEN
- Убедитесь, что токен валидный

## 📝 Переменные окружения

Обязательные переменные для настройки в Umbrel:

| Переменная | Описание | Пример |
|------------|----------|--------|
| APP_TG_TOKEN | Токен бота от @BotFather | 123456:ABC-DEF... |
| APP_PB_ADMIN | Email администратора PocketBase | admin@vault.local |
| APP_PB_PASSWORD | Пароль администратора | SecurePass123 |
| APP_MASTER_PASSWORD | Мастер-пароль для шифрования | MyMasterKey456 |
| APP_ALLOWED_USERS | ID пользователей Telegram | 123456789,987654321 |

## 🎯 Финальная проверка

- [ ] Образ доступен на Docker Hub
- [ ] Приложение устанавливается без остановки на 1%
- [ ] Логи показывают успешный запуск
- [ ] Бот отвечает в Telegram
- [ ] Можно сохранить пароль
- [ ] Можно найти пароль
- [ ] Можно удалить пароль
- [ ] Сообщения автоматически удаляются через 2 минуты

## 📚 Дополнительные ресурсы

- [Официальная документация Umbrel](https://github.com/getumbrel/umbrel)
- [Пример Community App Store](https://github.com/getumbrel/umbrel-community-app-store)
- [Docker Hub](https://hub.docker.com)
- [DOCKER-BUILD.md](./vault-telegram-vault/DOCKER-BUILD.md) - детальная инструкция по сборке
- [UMBREL-FIXES-APPLIED.md](./UMBREL-FIXES-APPLIED.md) - полный список исправлений
