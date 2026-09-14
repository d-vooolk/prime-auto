#!/usr/bin/env bash
#
# Откат на предыдущий цвет. Ничего не собирает — просто поднимает тот
# процесс, который был под трафиком до последнего деплоя, и возвращает
# на него upstream. Работает, пока каталог .next-<цвет> прошлой версии
# не перезаписан следующим деплоем, то есть ровно один деплой назад.
#
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/prime-auto}"
UPSTREAM_CONF="${UPSTREAM_CONF:-/etc/nginx/conf.d/prime-auto-upstream.conf}"
NGINX_CACHE="${NGINX_CACHE:-/var/cache/nginx}"
BLUE_PORT=3001
GREEN_PORT=3002

cd "$APP_DIR"

if grep -q "127.0.0.1:$GREEN_PORT" "$UPSTREAM_CONF" 2>/dev/null; then
    CURRENT=green; TARGET=blue;  TARGET_PORT=$BLUE_PORT
else
    CURRENT=blue;  TARGET=green; TARGET_PORT=$GREEN_PORT
fi

[ -f ".next-$TARGET/BUILD_ID" ] || { echo "нет сборки .next-$TARGET — откатывать не на что" >&2; exit 1; }

echo "==> откат $CURRENT -> $TARGET (порт $TARGET_PORT)"

if pm2 describe "prime-auto-$TARGET" >/dev/null 2>&1; then
    pm2 restart "prime-auto-$TARGET" --update-env
else
    pm2 start ecosystem.bluegreen.cjs --only "prime-auto-$TARGET" --env production
fi

for _ in $(seq 1 30); do
    curl -fsS -o /dev/null --max-time 5 "http://127.0.0.1:$TARGET_PORT/" && ok=1 && break
    sleep 2
done
[ -n "${ok:-}" ] || { echo "prime-auto-$TARGET не поднялся, upstream не трогаю" >&2; exit 1; }

printf 'upstream prime_auto {\n    server 127.0.0.1:%s;\n}\n' "$TARGET_PORT" > "$UPSTREAM_CONF"
nginx -t && systemctl reload nginx
rm -rf "$NGINX_CACHE"/* 2>/dev/null || true
systemctl reload nginx

echo "==> откатились на $TARGET"
