# Исправления для Umbrel App

## Найденные проблемы:

### 1. ❌ Отсутствует обязательный сервис `app_proxy`
**Проблема:** Umbrel требует сервис `app_proxy` для маршрутизации трафика к приложению.

**Решение:** Добавлен сервис:
```yaml
app_proxy:
  environment:
    APP_HOST: vault-telegram-vault_app_1
    APP_PORT: 8080
```

### 2. ❌ Используется `build` вместо готового образа
**Проблема:** Umbrel не может собирать Docker образы во время установки. Это причина остановки на 1%.

**Решение:** 
- Заменено `build: ./docker` на `image: pitcentr/telegram-vault:latest`
- Создана инструкция DOCKER-BUILD.md для публикации образа

### 3. ❌ Отсутствуют обязательные параметры
**Проблема:** Не указаны `user`, `init` и `port` в конфигурации.

**Решение:**
- Добавлено `user: "1000:1000"` (стандарт Umbrel)
- Добавлено `init: true` (для корректной обработки сигналов)
- Добавлено `port: 8080` в umbrel-app.yml

### 4. ❌ Неправильная зависимость от PocketBase
**Проблема:** Указана зависимость в umbrel-app.yml, но не настроена связь в docker-compose.yml.

**Решение:**
- Удалена зависимость из umbrel-app.yml (PocketBase должен быть отдельным приложением)
- Добавлено `depends_on: - pocketbase` в docker-compose.yml

### 5. ⚠️ Версия обновлена
Изменена версия с 1.0.1 на 1.0.2 с описанием исправлений.

## Что нужно сделать ПЕРЕД установкой:

### Шаг 1: Соберите и опубликуйте Docker образ

```bash
# Перейдите в папку с Dockerfile
cd vault-telegram-vault/docker

# Соберите образ
docker build -t pitcentr/telegram-vault:latest .

# Войдите в Docker Hub
docker login

# Опубликуйте образ
docker push pitcentr/telegram-vault:latest
```

### Шаг 2: Убедитесь, что PocketBase установлен
Приложение требует PocketBase. Установите его из Umbrel App Store перед установкой Telegram Vault.

### Шаг 3: Настройте переменные окружения
В Umbrel UI при установке укажите:
- `APP_TG_TOKEN` - токен от @BotFather
- `APP_PB_ADMIN` - email администратора PocketBase
- `APP_PB_PASSWORD` - пароль администратора PocketBase
- `APP_MASTER_PASSWORD` - мастер-пароль для шифрования
- `APP_ALLOWED_USERS` - ID пользователей Telegram через запятую

## Структура файлов (соответствует стандарту Umbrel):

```
vault-telegram-vault/
├── umbrel-app.yml          ✅ Конфигурация приложения
├── docker-compose.yml      ✅ Docker сервисы с app_proxy
├── scripts/
│   └── configure          ✅ Скрипт настройки (опционально)
├── metadata/
│   ├── icon.svg           ✅ Иконка приложения
│   └── screenshots/       ✅ Скриншоты
└── docker/                ✅ Исходники для сборки образа
    ├── Dockerfile
    ├── package.json
    └── bot.js
```

## Проверка соответствия стандарту Umbrel:

✅ Правильный формат `umbrel-app.yml`
✅ Сервис `app_proxy` присутствует
✅ Используется готовый Docker образ
✅ Указаны `user` и `init`
✅ Правильный формат ID приложения
✅ Указан порт приложения
✅ Метаданные (иконка, скриншоты)

## Тестирование после исправлений:

1. Опубликуйте Docker образ (см. DOCKER-BUILD.md)
2. Установите PocketBase из Umbrel App Store
3. Добавьте ваш App Store в Umbrel
4. Установите Telegram Vault
5. Настройте переменные окружения
6. Проверьте работу бота в Telegram

## Почему приложение останавливалось на 1%:

Umbrel пытался собрать Docker образ из исходников (`build: ./docker`), но:
- У Umbrel нет доступа к сборке образов во время установки
- Процесс зависал, ожидая завершения сборки
- Отсутствие `app_proxy` также блокировало запуск

Теперь приложение будет скачивать готовый образ с Docker Hub, что решает проблему.
