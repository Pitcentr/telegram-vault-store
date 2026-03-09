# Настройка GitHub Actions для автоматической публикации

## Что это дает?

✅ Автоматическая сборка Docker образа при каждом push
✅ Публикация на Docker Hub без ручных команд
✅ Поддержка нескольких архитектур (amd64, arm64)
✅ Версионирование образов (latest + версия из umbrel-app.yml)

## Шаг 1: Создайте аккаунт Docker Hub

Если у вас еще нет аккаунта:
1. Перейдите на https://hub.docker.com
2. Зарегистрируйтесь (бесплатно)
3. Запомните ваш username (например: `pitcentr`)

## Шаг 2: Создайте Access Token в Docker Hub

1. Войдите в Docker Hub
2. Нажмите на ваш аватар → Account Settings
3. Security → New Access Token
4. Введите описание: `GitHub Actions - Telegram Vault`
5. Permissions: `Read, Write, Delete`
6. Нажмите Generate
7. **ВАЖНО:** Скопируйте токен сейчас! Он больше не будет показан

## Шаг 3: Добавьте Secrets в GitHub

1. Откройте ваш репозиторий на GitHub
2. Settings → Secrets and variables → Actions
3. Нажмите "New repository secret"

### Добавьте первый секрет:
- Name: `DOCKER_USERNAME`
- Secret: ваш username с Docker Hub (например: `pitcentr`)
- Нажмите "Add secret"

### Добавьте второй секрет:
- Name: `DOCKER_PASSWORD`
- Secret: токен, который вы скопировали на шаге 2
- Нажмите "Add secret"

## Шаг 4: Создайте репозиторий на Docker Hub

1. Войдите в Docker Hub
2. Repositories → Create Repository
3. Name: `telegram-vault`
4. Visibility: **Public** (обязательно!)
5. Нажмите Create

Ваш образ будет доступен по адресу: `pitcentr/telegram-vault`

## Шаг 5: Запушьте код

```bash
git add .
git commit -m "Add GitHub Actions workflow for Docker build"
git push
```

## Шаг 6: Проверьте сборку

1. Откройте ваш репозиторий на GitHub
2. Перейдите во вкладку "Actions"
3. Вы увидите запущенный workflow "Build and Push Docker Image"
4. Кликните на него, чтобы посмотреть прогресс
5. Сборка займет 3-5 минут

## Проверка результата

После успешной сборки:

1. **На GitHub:**
   - Actions → последний workflow → зеленая галочка ✅

2. **На Docker Hub:**
   - Откройте https://hub.docker.com/r/pitcentr/telegram-vault
   - Вы увидите два тега:
     - `latest`
     - `1.0.2` (версия из umbrel-app.yml)

3. **Проверьте образ:**
   ```bash
   docker pull pitcentr/telegram-vault:latest
   docker images | grep telegram-vault
   ```

## Как это работает?

### Триггеры сборки

Workflow запускается автоматически при:
- Push в ветку `main` или `master`
- Изменении файлов в `vault-telegram-vault/docker/`
- Изменении `vault-telegram-vault/umbrel-app.yml`
- Ручном запуске через GitHub UI (Actions → Build and Push → Run workflow)

### Что делает workflow?

1. Клонирует репозиторий
2. Настраивает Docker Buildx (для multi-platform сборки)
3. Логинится в Docker Hub
4. Извлекает версию из `umbrel-app.yml`
5. Собирает образ для amd64 и arm64
6. Публикует с тегами `latest` и версией
7. Использует кеш для ускорения следующих сборок

## Ручной запуск сборки

Если нужно пересобрать образ без изменений в коде:

1. GitHub → Actions
2. "Build and Push Docker Image" → Run workflow
3. Выберите ветку (main/master)
4. Нажмите "Run workflow"

## Обновление версии

Когда обновляете версию приложения:

1. Измените версию в `vault-telegram-vault/umbrel-app.yml`:
   ```yaml
   version: "1.0.3"
   ```

2. Закоммитьте и запушьте:
   ```bash
   git add vault-telegram-vault/umbrel-app.yml
   git commit -m "Bump version to 1.0.3"
   git push
   ```

3. GitHub Actions автоматически:
   - Соберет новый образ
   - Опубликует с тегами `latest` и `1.0.3`

## Troubleshooting

### Ошибка: "denied: requested access to the resource is denied"
→ Проверьте DOCKER_USERNAME и DOCKER_PASSWORD в GitHub Secrets

### Ошибка: "repository does not exist"
→ Создайте репозиторий `telegram-vault` на Docker Hub

### Workflow не запускается
→ Убедитесь, что изменения в правильных файлах (vault-telegram-vault/docker/)

### Образ не публичный
→ Docker Hub → Repository Settings → Make Public

## Преимущества этого подхода

✅ Не нужно устанавливать Docker локально
✅ Автоматическая сборка при каждом изменении
✅ Поддержка ARM64 (для Raspberry Pi)
✅ Версионирование образов
✅ Кеширование слоев (быстрые пересборки)
✅ История всех сборок в GitHub Actions

## Следующие шаги

После успешной сборки:
1. Убедитесь, что образ доступен на Docker Hub
2. Установите приложение в Umbrel
3. Проверьте работу

---

**Готово!** Теперь каждый push автоматически обновляет Docker образ. 🚀
