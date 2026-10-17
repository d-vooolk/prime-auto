# Среда выполнения сайта: Node из .nvmrc и всё, что нужно сборке и скриптам.
#
# Кода в образе нет — каталог приложения монтируется томом (docker-compose.yml).
# Сборка читает базу из var/, а оба цвета blue-green работают из одного
# каталога, поэтому «запечь» код в образ нельзя: каждому контейнеру нужен тот
# же var/ и свой .next-<цвет> рядом. Образ отвечает только за версию Node и
# системные пакеты — то, что раньше давали nvm и pm2 на сервере.
FROM node:20.19.6-bookworm-slim

# curl — scripts/yandex-reviews.mjs качает страницу отзывов через него.
# python3, make, g++ — запасной путь для better-sqlite3: если готового
# бинарника под эту версию Node нет, npm ci соберёт его из исходников.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
