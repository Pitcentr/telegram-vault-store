# ⚡ Что делать ПРЯМО СЕЙЧАС

## 🔧 Проблема исправлена!

Папка переименована: `apps/telegram-vault` → `apps/vault-telegram-vault`

Теперь название папки совпадает с ID приложения, и Umbrel сможет показать приложение.

## 📝 Выполните эти 4 шага:

### Шаг 1: Commit изменения (30 секунд)
```bash
git add .
git commit -m "Fix: Rename app folder to match ID"
git push origin main
```

### Шаг 2: Дождаться GitHub Actions (1-2 минуты)
```
1. Откройте: https://github.com/pitcentr/telegram-vault-store/actions
2. Дождитесь зелёной галочки ✅
```

### Шаг 3: Обновить App Store в Umbrel (10 секунд)

**Вариант A (быстрый):**
```
Umbrel → App Store → Settings (⚙️) → Community App Stores
→ Найдите "Vault App Store"
→ Нажмите кнопку обновления (🔄)
```

**Вариант B (если не помогло):**
```
1. Удалите "Vault App Store"
2. Добавьте заново: https://github.com/pitcentr/telegram-vault-store
```

### Шаг 4: Проверить (5 секунд)
```
App Store → Найдите "Telegram Vault"
→ Должна появиться кнопка "Install" ✅
```

## ✅ Что должно получиться

После обновления в Umbrel App Store вы увидите:

```
┌─────────────────────────────────────┐
│  Vault App Store                    │
├─────────────────────────────────────┤
│                                     │
│  🔐 Telegram Vault                  │
│  Encrypted Telegram password manager│
│                                     │
│  [Install]  ← Эта кнопка!          │
│                                     │
└─────────────────────────────────────┘
```

## ❓ Если не работает

### Проблема: Всё ещё не показывает приложение

**Решение 1:** Очистить кэш Umbrel
```
1. Полностью удалите App Store из Umbrel
2. Подождите 30 секунд
3. Добавьте заново
```

**Решение 2:** Проверить GitHub
```
1. Убедитесь что GitHub Actions успешно выполнился
2. Проверьте что файлы на месте:
   - apps/vault-telegram-vault/umbrel-app.yml
   - apps/vault-telegram-vault/docker-compose.yml
```

**Решение 3:** Проверить структуру
```bash
# Выполните в терминале:
ls apps/
# Должно показать: vault-telegram-vault

cat apps/vault-telegram-vault/umbrel-app.yml | grep "^id:"
# Должно показать: id: vault-telegram-vault
```

### Проблема: GitHub Actions не запустился

**Решение:**
```bash
# Проверьте что изменения запушены:
git status
git log --oneline -1

# Если нужно, запушьте снова:
git push origin main
```

### Проблема: Docker image не собирается

**Решение:**
```
1. Проверьте логи GitHub Actions
2. Убедитесь что путь правильный:
   context: ./apps/vault-telegram-vault/docker
```

## 📚 Подробности

Полное объяснение проблемы и решения: [UMBREL-FIX.md](UMBREL-FIX.md)

## 🎯 Следующие шаги после установки

После того как приложение появится в App Store:

1. Нажмите Install
2. Заполните переменные (см. QUICK-START.md)
3. Дождитесь установки
4. Откройте Telegram и протестируйте бота

---

**Время выполнения:** ~3 минуты  
**Сложность:** Легко  
**Результат:** Рабочее приложение в Umbrel ✅
