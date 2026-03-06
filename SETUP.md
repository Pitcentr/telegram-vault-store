# Telegram Vault - Инструкция по установке

## Перед публикацией

### 1. Замените USERNAME в docker-compose.yml

В файле `apps/vault-telegram-vault/docker-compose.yml` замените:
```yaml
image: ghcr.io/USERNAME/telegram-vault:latest
```

на ваш GitHub username:
```yaml
image: ghcr.io/ваш-username/telegram-vault:latest
```

### 2. Создайте скриншот

Иконка уже готова в `apps/vault-telegram-vault/metadata/icon.svg`.

Для создания скриншота используйте один из методов:

**Метод 1: Автоматически (Chrome DevTools)**
1. Откройте `apps/vault-telegram-vault/metadata/screenshot-template.html` в Chrome/Edge
2. Нажмите F12 для открытия DevTools
3. Нажмите Ctrl+Shift+P (Cmd+Shift+P на Mac)
4. Введите "Capture node screenshot"
5. Кликните на телефон в центре экрана
6. Сохраните как `apps/vault-telegram-vault/metadata/screenshots/screenshot1.png`

**Метод 2: Python скрипт (если установлен Python)**
```bash
cd apps/vault-telegram-vault/metadata
pip install playwright
playwright install chromium
python generate_screenshot.py
```

**Метод 3: Реальный скриншот**
Сделайте скриншот реального диалога с ботом и сохраните в `screenshots/screenshot1.png`.

### 3. Обновите ссылки в umbrel-app.yml

В файле `apps/vault-telegram-vault/umbrel-app.yml` замените:
```yaml
website: https://github.com
repo: https://github.com
support: https://github.com
```

на реальные ссылки вашего репозитория.

### 3. Опубликуйте репозиторий на GitHub

1. Создайте публичный репозиторий на GitHub
2. Push код в репозиторий
3. GitHub Actions автоматически соберёт Docker image

### 4. Проверьте Docker image

После push в main ветку:
- Перейдите в Actions вашего репозитория
- Убедитесь что workflow успешно выполнился
- Проверьте что image появился в Packages

## Установка в Umbrel

### Добавить App Store

1. Откройте Umbrel
2. Перейдите в App Store
3. Нажмите на иконку настроек
4. Выберите "Community App Stores"
5. Добавьте URL вашего репозитория:
   ```
   https://github.com/ваш-username/telegram-vault-store
   ```

### Установить приложение

1. Найдите "Telegram Vault" в App Store
2. Нажмите Install
3. Заполните переменные окружения:
   - **TG_TOKEN**: токен Telegram бота (получите у @BotFather)
   - **PB_ADMIN**: email администратора PocketBase
   - **PB_PASSWORD**: пароль администратора PocketBase
   - **MASTER_PASSWORD**: мастер-пароль для шифрования (минимум 32 символа)
   - **ALLOWED_USERS**: список Telegram ID через запятую (например: 123456789,987654321)

### Получить Telegram ID

Отправьте любое сообщение боту @userinfobot - он покажет ваш ID.

## Использование

### Сохранить пароль

Отправьте боту сообщение в формате:
```
github.com myusername mypassword123
```

Бот сохранит пароль и удалит сообщения через 120 секунд.

### Найти пароль

Отправьте боту часть URL:
```
github
```

Бот найдёт совпадение и отправит:
```
URL: github.com
Login: myusername
Password: mypassword123
[Delete]
```

Сообщение автоматически удалится через 120 секунд.

### Удалить пароль

Нажмите кнопку "Delete" под сообщением с паролем.

## Безопасность

- Все пароли шифруются AES-256-GCM перед сохранением
- Ключ шифрования генерируется из MASTER_PASSWORD через SHA-256
- Доступ только для пользователей из ALLOWED_USERS
- Автоматическое удаление сообщений через 2 минуты
- Audit logging всех операций

## Структура данных

### Коллекция secrets
- url: адрес сайта
- login: имя пользователя
- password_enc: зашифрованный пароль
- iv: вектор инициализации + auth tag
- created_by: Telegram ID создателя
- created: timestamp

### Коллекция audit_logs
- user_id: Telegram ID пользователя
- action: тип операции (save/search/delete)
- query: поисковый запрос или ID
- timestamp: время операции
- created: timestamp

## Troubleshooting

### Бот не отвечает
- Проверьте что TG_TOKEN правильный
- Убедитесь что ваш Telegram ID в ALLOWED_USERS
- Проверьте логи: `docker logs telegram-vault_app_1`

### Ошибка подключения к PocketBase
- Убедитесь что PocketBase установлен и запущен
- Проверьте PB_ADMIN и PB_PASSWORD
- URL должен быть: `http://pocketbase_app_1:8090`

### Ошибка шифрования
- MASTER_PASSWORD должен быть минимум 32 символа
- Используйте сложный пароль с буквами, цифрами и символами
