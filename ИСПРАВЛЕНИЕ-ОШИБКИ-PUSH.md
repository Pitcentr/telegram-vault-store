# Исправление ошибки push

## Проблема
```
refusing to allow a Personal Access Token to create or update workflow 
`.github/workflows/docker-publish.yml` without `workflow` scope
```

## Причина
Ваш GitHub Personal Access Token не имеет прав на создание/изменение workflow файлов.

## Решение 1: Обновить токен (РЕКОМЕНДУЕТСЯ)

### Шаг 1: Создайте новый токен с правильными правами

1. Откройте GitHub
2. Settings (ваш профиль) → Developer settings
3. Personal access tokens → Tokens (classic)
4. Generate new token (classic)
5. Отметьте галочки:
   - ✅ **repo** (Full control of private repositories)
   - ✅ **workflow** (Update GitHub Action workflows)
6. Generate token
7. **СКОПИРУЙТЕ ТОКЕН** (больше не покажется!)

### Шаг 2: Обновите токен в Git

**macOS/Linux:**
```bash
# Удалите старые credentials
git credential-osxkeychain erase
host=github.com
protocol=https

# Или для Linux
git credential-cache exit

# При следующем push введите новый токен
git push
```

**Или через командную строку:**
```bash
# Удалите старый токен
git credential reject <<EOF
protocol=https
host=github.com
EOF

# Попробуйте push снова
git push
# Введите username и НОВЫЙ токен как password
```

### Шаг 3: Push снова
```bash
git push
```

## Решение 2: Создать workflow через GitHub UI

Если не хотите обновлять токен:

### Шаг 1: Закоммитьте без workflow
```bash
# Удалите workflow из staging
git reset HEAD .github/workflows/docker-publish.yml

# Закоммитьте остальное
git add .
git commit -m "Fix Umbrel installation - add app_proxy and documentation"
git push
```

### Шаг 2: Создайте workflow на GitHub

1. Откройте репозиторий на GitHub
2. Actions → New workflow → "set up a workflow yourself"
3. Скопируйте содержимое из локального файла `.github/workflows/docker-publish.yml`
4. Commit new file

### Шаг 3: Синхронизируйте локально
```bash
git pull
```

## Решение 3: Временно - пропустить workflow

Если нужно быстро запушить изменения:

```bash
# Удалите workflow файл временно
rm -rf .github/workflows/docker-publish.yml

# Закоммитьте
git add .
git commit -m "Fix Umbrel installation"
git push

# Потом добавьте workflow через GitHub UI (см. Решение 2)
```

## Проверка токена

Проверьте, какие права у вашего текущего токена:

```bash
# Получите информацию о токене
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# Проверьте scopes
curl -I -H "Authorization: token YOUR_TOKEN" https://api.github.com/user | grep x-oauth-scopes
```

Должно быть: `x-oauth-scopes: repo, workflow`

## Что делать дальше?

После успешного push:

1. **Если использовали Решение 1:**
   - Всё готово! Workflow будет работать автоматически

2. **Если использовали Решение 2 или 3:**
   - Настройте Docker Hub secrets (см. БЫСТРАЯ-НАСТРОЙКА-CI.md)
   - Workflow запустится при следующем push

## FAQ

**Q: Где найти Personal Access Token?**
A: GitHub → Settings → Developer settings → Personal access tokens

**Q: Можно ли использовать SSH вместо HTTPS?**
A: Да, но для workflow всё равно нужны secrets в GitHub

**Q: Что если забыл токен?**
A: Создайте новый, старый можно удалить

**Q: Нужно ли удалять старый токен?**
A: Рекомендуется для безопасности

## Следующие шаги

После успешного push:
1. Настройте Docker Hub secrets (DOCKER_USERNAME, DOCKER_PASSWORD)
2. Workflow запустится автоматически
3. Проверьте GitHub → Actions

---

**Быстрая настройка CI:** [БЫСТРАЯ-НАСТРОЙКА-CI.md](БЫСТРАЯ-НАСТРОЙКА-CI.md)
**Финальная инструкция:** [ФИНАЛЬНАЯ-ИНСТРУКЦИЯ.md](ФИНАЛЬНАЯ-ИНСТРУКЦИЯ.md)
