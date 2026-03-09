# UI Настройка готова! 🎉

## Что изменилось

Теперь Umbrel показывает форму для настройки переменных прямо в интерфейсе!

### Добавлена секция `settings` в umbrel-app.yml:

```yaml
settings:
  telegram_token:
    type: string
    label: Telegram Bot Token
    description: Get from @BotFather in Telegram
    required: true
  
  pocketbase_admin:
    type: string
    label: PocketBase Admin Email
    default: "admin@vault.local"
    required: true
  
  pocketbase_password:
    type: password
    label: PocketBase Admin Password
    required: true
  
  master_password:
    type: password
    label: Master Password for Encryption
    description: "WARNING: If lost, all data will be unrecoverable!"
    required: true
  
  allowed_users:
    type: string
    label: Allowed Telegram User IDs
    description: Get your ID from @userinfobot
    required: true
  
  pocketbase_url:
    type: string
    label: PocketBase URL
    default: "http://pocketbase_server:8090"
    required: false
```

## Как это работает

### При установке:

```
Umbrel → App Store → Telegram Vault → Install

┌─────────────────────────────────────────────────┐
│ Install Telegram Vault                          │
├─────────────────────────────────────────────────┤
│                                                  │
│ Telegram Bot Token *                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ 123456789:ABCdefGHIjklMNOpqrsTUVwxyz       │ │
│ └─────────────────────────────────────────────┘ │
│ Get from @BotFather in Telegram                 │
│                                                  │
│ PocketBase Admin Email *                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ admin@vault.local                           │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ PocketBase Admin Password *                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ ••••••••••••                                │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Master Password for Encryption *                │
│ ┌─────────────────────────────────────────────┐ │
│ │ ••••••••••••••••••••••••••••••••••••••••••  │ │
│ └─────────────────────────────────────────────┘ │
│ ⚠️ WARNING: If lost, all data unrecoverable!   │
│                                                  │
│ Allowed Telegram User IDs *                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ 123456789                                   │ │
│ └─────────────────────────────────────────────┘ │
│ Get your ID from @userinfobot                   │
│                                                  │
│ PocketBase URL                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ http://pocketbase_server:8090               │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│              [Cancel]  [Install]                │
└─────────────────────────────────────────────────┘
```

### После установки (изменение настроек):

```
Umbrel → Apps → Telegram Vault → Settings → Configuration

Можно изменить любые параметры и перезапустить приложение
```

## Что делать сейчас

### 1. Закоммитьте изменения

```bash
git add .
git commit -m "Add UI settings for easy configuration (v1.1.0)"
git push
```

### 2. Дождитесь сборки

```
GitHub → Actions (3-5 минут)
Docker Hub → проверьте тег 1.1.0
```

### 3. Переустановите в Umbrel

```
Umbrel → Apps → Telegram Vault → Uninstall
App Store → Telegram Vault → Install
```

### 4. Заполните форму

При установке Umbrel покажет форму с полями:

1. **Telegram Bot Token** - от @BotFather
2. **PocketBase Admin Email** - admin@vault.local (можно оставить)
3. **PocketBase Admin Password** - ваш пароль (8+ символов)
4. **Master Password** - длинный пароль (32+ символов)
5. **Allowed Telegram User IDs** - ваш ID от @userinfobot
6. **PocketBase URL** - можно оставить по умолчанию

### 5. Нажмите Install

Приложение установится с вашими настройками!

## Преимущества

### ✅ Для пользователей:
- Простая настройка через UI
- Не нужен SSH
- Видны описания полей
- Валидация обязательных полей
- Можно изменить настройки позже

### ✅ Для разработчиков:
- Стандартный подход Umbrel
- Автоматическая генерация UI
- Типизация полей (string, password)
- Значения по умолчанию

## Типы полей

### string
Обычное текстовое поле
```yaml
telegram_token:
  type: string
  label: Telegram Bot Token
```

### password
Скрытое поле для паролей
```yaml
master_password:
  type: password
  label: Master Password
```

### Атрибуты:
- `label` - название поля
- `description` - подсказка под полем
- `placeholder` - пример значения
- `default` - значение по умолчанию
- `required` - обязательное поле (true/false)

## Маппинг переменных

Umbrel автоматически создает переменные с префиксом `APP_`:

```yaml
settings:
  telegram_token: ...

# Становится переменной:
APP_TELEGRAM_TOKEN

# Используется в docker-compose.yml:
environment:
  TG_TOKEN: ${APP_TELEGRAM_TOKEN}
```

## Изменение настроек после установки

```
1. Umbrel → Apps → Telegram Vault
2. Settings (⚙️) → Configuration
3. Измените нужные поля
4. Save
5. Restart app
```

## Получение значений

### Telegram Bot Token:
```
1. Telegram → @BotFather
2. /newbot
3. Следуйте инструкциям
4. Скопируйте токен
```

### Telegram User ID:
```
1. Telegram → @userinfobot
2. Отправьте любое сообщение
3. Скопируйте ID
```

### Пароли:
```
PocketBase Password: минимум 8 символов
Master Password: минимум 32 символа (рекомендуется)
```

## Проверка после установки

### Логи должны показывать:
```
✅ Starting Telegram Vault bot...
✅ Successfully authenticated with PocketBase
✅ Bot started successfully!
```

### Проверка бота:
```
1. Telegram → ваш бот
2. Отправьте: test.com user pass123
3. Должен ответить: "saved"
```

## Troubleshooting

### Форма не появляется
→ Убедитесь, что версия 1.1.0 установлена
→ Попробуйте обновить список приложений в App Store

### Поля не сохраняются
→ Проверьте, что все обязательные поля заполнены
→ Перезапустите приложение после изменений

### Бот не запускается
→ Проверьте логи
→ Убедитесь, что токен правильный
→ Проверьте, что ID пользователя правильный

## Документация

- [ПОЛУЧЕНИЕ-ТОКЕНА-БОТА.md](ПОЛУЧЕНИЕ-ТОКЕНА-БОТА.md) - Как получить токен
- [КАК-НАСТРОИТЬ-ПЕРЕМЕННЫЕ.md](КАК-НАСТРОИТЬ-ПЕРЕМЕННЫЕ.md) - Описание переменных
- [ШПАРГАЛКА-ПЕРЕМЕННЫЕ.md](ШПАРГАЛКА-ПЕРЕМЕННЫЕ.md) - Быстрая справка

---

**Теперь настройка максимально простая!** 🚀

Просто заполните форму при установке и всё готово!
