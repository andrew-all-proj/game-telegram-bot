# Game Telegram Bot

Телеграм-бот для игры Mutantorium: обрабатывает команды `/start`, `/fight`, `/monster`, отправляет результаты боёв

## Требования

- Node.js 20+, Corepack (yarn 4), Git (зависимость `game-db` ставится из публичного HTTPS-репозитория)
- PostgreSQL и Redis
- Telegram Bot API токен

## Настройка окружения

1. Скопируйте `.env.example` в `.env` и заполните значения:
   - `BOT_TOKEN`, `BOT_USER_NAME`
   - `JWT_SECRET`, `INTERNAL_JWT_SECRET`
   - `URL_WEB_APP`, `DEEP_LINK_WEB_APP`, `FILE_URL_PREFIX`
   - `API_SERVICE_URL`, `WEBHOOK_URL`, `PORT`, `NODE_ENV`
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `ELASTICSEARCH_NODE`, `ELASTIC_USERNAME`, `ELASTIC_PASSWORD`
   - `GLOBAL_AGENT_HTTP_PROXY` (опционально для прокси)
   - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

## Локальный запуск

```bash
corepack enable
yarn install
yarn start         # tsc + nodemon, сервер на http://localhost:3000
```

В режиме разработки бот работает через long polling (в вебхуки уходит только при `NODE_ENV=productionnn`).

## Сборка

```bash
yarn build
```

## Запуск в Docker

Обычная сборка по HTTPS, без SSH-монта.

```bash
DOCKER_BUILDKIT=1 docker build -t game-telegram-bot .
docker run --env-file .env -p 3000:3000 game-telegram-bot
```
