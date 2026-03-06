# ✅ Чеклист исправления

## Что было исправлено

- [x] Папка переименована: `apps/telegram-vault` → `apps/vault-telegram-vault`
- [x] GitHub Actions обновлён: путь к Docker контексту
- [x] Проверено совпадение: название папки = ID приложения
- [x] Создана документация по исправлению

## Проверка правильности

### ✅ Структура папок
```bash
apps/
└── vault-telegram-vault/  ← Правильное название
    ├── umbrel-app.yml
    ├── docker-compose.yml
    ├── docker/
    └── metadata/
```

### ✅ ID в umbrel-app.yml
```yaml
id: vault-telegram-vault  ← Совпадает с названием папки!
```

### ✅ GitHub Actions
```yaml
context: ./apps/vault-telegram-vault/docker  ← Правильный путь!
```

## Что нужно сделать

### 1. Push изменения на GitHub
```bash
git add .
git commit -m "Fix: Rename app folder to match ID (vault-telegram-vault)"
git push origin main
```

### 2. Дождаться GitHub Actions
- Откройте Actions в вашем репозитории
- Дождитесь зелёной галочки ✅

### 3. Обновить в Umbrel
```
Umbrel → App Store → Settings → Community App Stores
→ Обновить "Vault App Store" (кнопка 🔄)
```

Или удалить и добавить заново.

### 4. Проверить результат
В App Store должно появиться:
- Название: "Telegram Vault"
- Описание: "Encrypted Telegram password manager"
- Кнопка: "Install" ✅

## Почему это важно

Umbrel использует название папки для поиска приложений. Если название папки не совпадает с ID в `umbrel-app.yml`, приложение не будет найдено.

### Правило Umbrel:
```
Название папки ДОЛЖНО совпадать с ID приложения
```

### Наш случай:
```
apps/vault-telegram-vault/           ← Название папки
  umbrel-app.yml:
    id: vault-telegram-vault         ← ID приложения
    
✅ Совпадает! Umbrel найдёт приложение.
```

## Дополнительные файлы

- [ACTION-NOW.md](ACTION-NOW.md) - Что делать прямо сейчас (4 шага)
- [UMBREL-FIX.md](UMBREL-FIX.md) - Подробное объяснение проблемы
- [QUICK-START.md](QUICK-START.md) - Быстрый старт после исправления

## Статус

- [x] Проблема идентифицирована
- [x] Исправление применено
- [ ] Изменения запушены на GitHub
- [ ] GitHub Actions выполнен
- [ ] App Store обновлён в Umbrel
- [ ] Приложение появилось в списке

---

**Следующий шаг:** Выполните команды из [ACTION-NOW.md](ACTION-NOW.md)
