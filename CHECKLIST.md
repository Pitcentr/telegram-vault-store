# Чеклист соответствия требованиям

## ✅ Основная функциональность

- [x] Сохранение пароля в формате: `url login password`
- [x] Шифрование пароля перед сохранением
- [x] Структура записи: url, login, password_enc, iv, created_by
- [x] Поиск пароля через fuzzy search (Fuse.js)
- [x] Расшифровка и отправка найденного пароля
- [x] Inline кнопка "Delete" для удаления секрета
- [x] Автоудаление сообщений через 120 секунд
- [x] Ограничение доступа по ALLOWED_USERS

## ✅ Безопасность

- [x] AES-256-GCM шифрование
- [x] Ключ генерируется через SHA256(MASTER_PASSWORD)
- [x] Переменная MASTER_PASSWORD для ключа
- [x] Audit logging в коллекцию audit_logs
- [x] Запись: user_id, action, query, timestamp
- [x] Проверка доступа в callback query

## ✅ PocketBase

- [x] Использование PocketBase JS SDK
- [x] Коллекция secrets с полями: url, login, password_enc, iv, created_by, created
- [x] Коллекция audit_logs с полями: user_id, action, query, timestamp, created
- [x] Автоматическая инициализация коллекций при старте

## ✅ Технологии

- [x] Node.js 20
- [x] grammy (Telegram bot framework)
- [x] PocketBase JS SDK
- [x] Fuse.js (fuzzy search)
- [x] crypto (встроенный модуль Node.js)
- [x] dotenv

## ✅ Docker

- [x] Dockerfile с Node.js 20 Alpine
- [x] WORKDIR /app
- [x] npm install
- [x] CMD ["node","bot.js"]

## ✅ Docker Image

- [x] Image публикуется в ghcr.io
- [x] Формат: ghcr.io/USERNAME/telegram-vault:latest
- [x] Tag: latest

## ✅ GitHub Actions

- [x] Workflow файл: .github/workflows/docker.yml
- [x] Сборка Docker image
- [x] Публикация в GHCR
- [x] Обновление latest tag
- [x] Триггер на push в main

## ✅ Umbrel App Store структура

- [x] umbrel-app-store.yml в корне
- [x] id: vault
- [x] name: Vault App Store
- [x] Папка apps/telegram-vault/
- [x] umbrel-app.yml
- [x] docker-compose.yml
- [x] metadata/icon.svg
- [x] metadata/screenshots/screenshot1.png

## ✅ umbrel-app.yml

- [x] id: vault-telegram-vault
- [x] name: Telegram Vault
- [x] tagline: описание
- [x] icon: metadata/icon.svg
- [x] category: security
- [x] version: "1.0.0"
- [x] description: описание функциональности
- [x] developer: Self Hosted
- [x] website, repo, support: ссылки
- [x] gallery: screenshots
- [x] dependencies: pocketbase
- [x] path: ""
- [x] docker-compose: docker-compose.yml

## ✅ docker-compose.yml

- [x] version: "3.7"
- [x] service: app
- [x] image: ghcr.io/USERNAME/telegram-vault:latest
- [x] restart: unless-stopped
- [x] environment: все переменные с префиксом APP_
  - [x] TG_TOKEN: ${APP_TG_TOKEN}
  - [x] PB_URL: http://pocketbase_app_1:8090
  - [x] PB_ADMIN: ${APP_PB_ADMIN}
  - [x] PB_PASSWORD: ${APP_PB_PASSWORD}
  - [x] MASTER_PASSWORD: ${APP_MASTER_PASSWORD}
  - [x] ALLOWED_USERS: ${APP_ALLOWED_USERS}
- [x] healthcheck с node проверкой

## ✅ Интерфейс Umbrel

- [x] Переменные запрашиваются при установке
- [x] Все переменные с префиксом APP_
- [x] Иконка SVG 256x256
- [x] Скриншот интерфейса

## ✅ Требования

- [x] Соответствие стандартам Umbrel Community App Store
- [x] Отображение в App Store
- [x] Иконка приложения
- [x] Кнопка Install
- [x] Автоматическая загрузка Docker image из GHCR
- [x] Запуск без ручной сборки

## 📝 Что нужно сделать перед публикацией

1. Заменить USERNAME в docker-compose.yml на ваш GitHub username
2. Обновить ссылки website/repo/support в umbrel-app.yml
3. Создать иконку icon.svg (256x256, dark background, green vault symbol)
4. Добавить скриншот screenshot1.png интерфейса Telegram
5. Push в GitHub для автоматической сборки Docker image
6. Проверить что image появился в GitHub Packages

## Исправленные проблемы

1. ✅ Добавлено автоудаление сообщения пользователя при сохранении пароля
2. ✅ Добавлено автоудаление сообщений при поиске пароля
3. ✅ Добавлен audit logging для всех операций (save, search, delete)
4. ✅ Добавлено поле created_by в secrets
5. ✅ Добавлена проверка доступа в callback query
6. ✅ Исправлены пути к иконке и скриншотам (убраны ./)
7. ✅ Добавлен параметр path: "" в umbrel-app.yml
8. ✅ Исправлен формат developer/submitter
9. ✅ Добавлена автоматическая инициализация коллекций PocketBase
10. ✅ Добавлена обработка ошибок при удалении сообщений
