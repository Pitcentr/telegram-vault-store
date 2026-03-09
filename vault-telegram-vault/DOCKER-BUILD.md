# Docker Build Instructions

## Важно!
Umbrel не может собирать Docker образы во время установки. Вам нужно:

1. Собрать образ локально
2. Опубликовать его на Docker Hub
3. Использовать опубликованный образ в docker-compose.yml

## Шаги:

### 1. Соберите образ
```bash
cd vault-telegram-vault/docker
docker build -t pitcentr/telegram-vault:latest .
```

### 2. Протестируйте локально
```bash
docker run --rm -e TG_TOKEN=your_token -e PB_URL=http://pocketbase:8090 -e PB_ADMIN=admin -e PB_PASSWORD=password -e MASTER_PASSWORD=master -e ALLOWED_USERS=123456 pitcentr/telegram-vault:latest
```

### 3. Войдите в Docker Hub
```bash
docker login
```

### 4. Опубликуйте образ
```bash
docker push pitcentr/telegram-vault:latest
```

### 5. Для версионирования (рекомендуется)
```bash
docker tag pitcentr/telegram-vault:latest pitcentr/telegram-vault:1.0.2
docker push pitcentr/telegram-vault:1.0.2
```

## Альтернатива: GitHub Container Registry

Если хотите использовать GitHub:

```bash
# Войдите в GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Соберите с правильным тегом
docker build -t ghcr.io/pitcentr/telegram-vault:latest .

# Опубликуйте
docker push ghcr.io/pitcentr/telegram-vault:latest
```

Затем измените в docker-compose.yml:
```yaml
image: ghcr.io/pitcentr/telegram-vault:latest
```
