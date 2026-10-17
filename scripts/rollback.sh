#!/usr/bin/env bash
#
# Откат на предыдущий цвет. Ничего не собирает — просто поднимает тот
# контейнер, который был под трафиком до последнего деплоя, и возвращает
# на него upstream. Работает, пока каталог .next-<цвет> прошлой версии
# не перезаписан следующим деплоем, то есть ровно один деплой назад.
#
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/prime-auto}"
UPSTREAM_CONF="${UPSTREAM_CONF:-/etc/nginx/conf.d/prime-auto-upstream.conf}"
NGINX_CACHE="${NGINX_CACHE:-/var/cache/nginx}"

die() { printf '\n\033[31mОШИБКА: %s\033[0m\n' "$*" >&2; exit 1; }

cd "$APP_DIR"

port_of() {
    docker compose config --format json | python3 -c "
import json, sys
port = json.load(sys.stdin)['services']['$1']['environment'].get('PORT')
if not port: sys.exit(1)
print(port)
"
}
BLUE_PORT=$(port_of blue)   || die "не смог прочитать порт blue из docker-compose.yml"
GREEN_PORT=$(port_of green) || die "не смог прочитать порт green из docker-compose.yml"

if grep -q "127.0.0.1:$GREEN_PORT" "$UPSTREAM_CONF" 2>/dev/null; then
    CURRENT=green; TARGET=blue;  TARGET_PORT=$BLUE_PORT
else
    CURRENT=blue;  TARGET=green; TARGET_PORT=$GREEN_PORT
fi

[ -f ".next-$TARGET/BUILD_ID" ] || die "нет сборки .next-$TARGET — откатывать не на что"
BUILD_ID=$(cat ".next-$TARGET/BUILD_ID")

echo "==> откат $CURRENT -> $TARGET (порт $TARGET_PORT, BUILD_ID $BUILD_ID)"

docker compose up -d --no-deps --force-recreate "$TARGET"

ok=
for _ in $(seq 1 30); do
    if curl -fsS --max-time 5 "http://127.0.0.1:$TARGET_PORT/" 2>/dev/null | grep -qF -- "$BUILD_ID"; then
        ok=1; break
    fi
    sleep 2
done
[ -n "$ok" ] || die "prime-auto-$TARGET не отдаёт сборку $BUILD_ID, upstream не трогаю"

printf 'upstream prime_auto {\n    server 127.0.0.1:%s;\n}\n' "$TARGET_PORT" > "$UPSTREAM_CONF"
nginx -t || die "nginx -t не прошёл"
systemctl reload nginx
rm -rf "$NGINX_CACHE"/* 2>/dev/null || true
systemctl reload nginx

docker compose stop "$CURRENT" || true

echo "==> откатились на $TARGET (BUILD_ID $BUILD_ID)"
