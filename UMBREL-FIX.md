# 🔧 Исправление проблемы с Umbrel App Store

## ❌ Проблема

При добавлении репозитория в Umbrel показывается только название "Vault App Store", но нет приложений для установки.

## 🔍 Причина

Umbrel требует, чтобы **название папки приложения совпадало с ID** в `umbrel-app.yml`.

### Было (неправильно):
```
apps/telegram-vault/          ← Название папки
  umbrel-app.yml:
    id: vault-telegram-vault  ← ID не совпадает!
```

### Стало (правильно):
```
apps/vault-telegram-vault/    ← Название папки
  umbrel-app.yml:
    id: vault-telegram-vault  ← ID совпадает! ✅
```

## ✅ Что исправлено

1. ✅ Папка переименована: `apps/telegram-vault` → `apps/vault-telegram-vault`
2. ✅ GitHub Actions обновлён: путь к Docker контексту
3. ✅ Документация обновлена

## 📁 Новая структура

```
telegram-vault-store/
├── umbrel-app-store.yml
│   id: vault
│   name: Vault App Store
│
└── apps/
    └── vault-telegram-vault/          ← Совпадает с ID!
        ├── umbrel-app.yml
        │   id: vault-telegram-vault   ← Совпадает с папкой!
        ├── docker-compose.yml
        ├── docker/
        │   ├── Dockerfile
        │   ├── bot.js
        │   └── package.json
        └── metadata/
            ├── icon.svg
            └── screenshots/
                └── screenshot1.png
```

## 🚀 Что делать дальше

### 1. Commit и push изменения
```bash
git add .
git commit -m "Fix: Rename app folder to match ID (vault-telegram-vault)"
git push origin main
```

### 2. Дождаться GitHub Actions
- Перейдите в Actions вашего репозитория
- Дождитесь успешной сборки (зелёная галочка ✅)

### 3. Обновить App Store в Umbrel
```
Umbrel → App Store → Settings → Community App Stores
→ Найдите "Vault App Store"
→ Нажмите кнопку обновления (🔄)
```

Или удалите и добавьте заново:
```
1. Удалите "Vault App Store"
2. Добавьте снова: https://github.com/pitcentr/telegram-vault-store
```

### 4. Проверить
Теперь в App Store должно появиться приложение "Telegram Vault" с кнопкой Install.

## 📋 Правила именования Umbrel

### Обязательное правило:
```
Название папки = ID приложения
```

### Примеры правильных структур:

**Пример 1:**
```
apps/my-app/
  umbrel-app.yml:
    id: my-app  ✅
```

**Пример 2:**
```
apps/bitcoin-node/
  umbrel-app.yml:
    id: bitcoin-node  ✅
```

**Пример 3 (наш случай):**
```
apps/vault-telegram-vault/
  umbrel-app.yml:
    id: vault-telegram-vault  ✅
```

### Примеры неправильных структур:

**Неправильно 1:**
```
apps/telegram-vault/
  umbrel-app.yml:
    id: vault-telegram-vault  ❌ Не совпадает!
```

**Неправильно 2:**
```
apps/my-app/
  umbrel-app.yml:
    id: myapp  ❌ Не совпадает!
```

## 🔍 Как проверить правильность

### Проверка 1: Структура папок
```bash
ls apps/
# Должно показать: vault-telegram-vault
```

### Проверка 2: ID в umbrel-app.yml
```bash
cat apps/vault-telegram-vault/umbrel-app.yml | grep "^id:"
# Должно показать: id: vault-telegram-vault
```

### Проверка 3: Совпадение
```bash
# Название папки
FOLDER_NAME=$(ls apps/)
echo "Folder: $FOLDER_NAME"

# ID из файла
APP_ID=$(grep "^id:" apps/*/umbrel-app.yml | cut -d: -f2 | tr -d ' ')
echo "ID: $APP_ID"

# Проверка
if [ "$FOLDER_NAME" = "$APP_ID" ]; then
  echo "✅ Совпадает!"
else
  echo "❌ Не совпадает!"
fi
```

## 📚 Дополнительная информация

### Официальная документация Umbrel:
- https://github.com/getumbrel/umbrel-apps
- https://github.com/getumbrel/umbrel-apps-gallery

### Пример правильного App Store:
- https://github.com/getumbrel/umbrel-apps/tree/master/apps

## ✅ Итог

После этого исправления Umbrel сможет правильно распознать приложение и показать кнопку Install.

**Важно:** После push на GitHub обязательно обновите App Store в Umbrel!
