# Быстрая настройка автоматической публикации

## 3 простых шага

### 1. Docker Hub - создайте токен

1. Зарегистрируйтесь на https://hub.docker.com (если еще нет)
2. Account Settings → Security → New Access Token
3. Название: `GitHub Actions`
4. Permissions: `Read, Write, Delete`
5. **Скопируйте токен** (больше не покажется!)

### 2. Docker Hub - создайте репозиторий

1. Repositories → Create Repository
2. Name: `telegram-vault`
3. Visibility: **Public** ✅
4. Create

### 3. GitHub - добавьте секреты

1. Ваш репозиторий → Settings → Secrets and variables → Actions
2. New repository secret:
   - Name: `DOCKER_USERNAME`
   - Value: ваш username (например: `pitcentr`)
3. New repository secret:
   - Name: `DOCKER_PASSWORD`
   - Value: токен из шага 1

## Готово! Теперь запушьте код:

```bash
git add .
git commit -m "Add GitHub Actions for Docker build"
git push
```

## Проверка

1. GitHub → Actions → смотрите прогресс сборки (3-5 минут)
2. Docker Hub → https://hub.docker.com/r/pitcentr/telegram-vault
3. Должны появиться теги: `latest` и `1.0.2`

## Что дальше?

После успешной сборки:
1. Установите приложение в Umbrel
2. При каждом push образ будет обновляться автоматически

---

**Подробная инструкция:** [GITHUB-ACTIONS-SETUP.md](GITHUB-ACTIONS-SETUP.md)
