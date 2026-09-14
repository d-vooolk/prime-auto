#!/usr/bin/env bash
#
# Деплой без простоя (blue-green).
#
# Идея: собираем и поднимаем новую версию рядом с работающей, проверяем, что
# она отвечает, и только потом переключаем на неё трафик в nginx. Пользователь
# в момент подмены не видит ни ошибок, ни паузы: старый процесс продолжает
# отвечать до самого переключения, а nginx reload делает это плавно.
#
# Разбор и первичная настройка — docs/deploy.md
#
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/prime-auto}"
ECOSYSTEM="ecosystem.bluegreen.config.cjs"
UPSTREAM_CONF="${UPSTREAM_CONF:-/etc/nginx/conf.d/prime-auto-upstream.conf}"
NGINX_CACHE="${NGINX_CACHE:-/var/cache/nginx}"
SHARED_STATIC="$APP_DIR/shared/next-static"
HEALTH_RETRIES=30
HEALTH_DELAY=2
DRAIN_SECONDS=10

log() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[31mОШИБКА: %s\033[0m\n' "$*" >&2; exit 1; }

cd "$APP_DIR"

# Порты живут только в ecosystem-конфиге, здесь их не дублируем: разъехавшиеся
# копии в трёх файлах — надёжный способ переключить трафик не туда.
port_of() {
    node -e "
        const c = require('$APP_DIR/$ECOSYSTEM');
        const a = c.apps.find((x) => x.name === 'prime-auto-$1');
        if (!a || !a.env_production || !a.env_production.PORT) process.exit(1);
        process.stdout.write(String(a.env_production.PORT));
    "
}
BLUE_PORT=$(port_of blue)   || die "не смог прочитать порт blue из $ECOSYSTEM"
GREEN_PORT=$(port_of green) || die "не смог прочитать порт green из $ECOSYSTEM"

# --- 1. Кто сейчас под трафиком -------------------------------------------
# Единственный источник правды — конфиг nginx, а не файл-маркер: если они
# разойдутся, маркер соврёт, а конфиг нет.
if [ -f "$UPSTREAM_CONF" ] && grep -q "127.0.0.1:$GREEN_PORT" "$UPSTREAM_CONF"; then
    ACTIVE=green; IDLE=blue;  IDLE_PORT=$BLUE_PORT
else
    ACTIVE=blue;  IDLE=green; IDLE_PORT=$GREEN_PORT
fi
log "под трафиком: $ACTIVE  →  разворачиваю в: $IDLE (порт $IDLE_PORT)"

# --- 2. Порт свободен или уже наш? ----------------------------------------
# На сервере живут и другие приложения. Если порт занял кто-то посторонний,
# наш процесс не сможет забиндиться и уйдёт в цикл перезапусков — ловим это
# сразу и с внятным сообщением.
if ss -ltn "sport = :$IDLE_PORT" 2>/dev/null | grep -q LISTEN; then
    pm2 describe "prime-auto-$IDLE" >/dev/null 2>&1 \
        || die "порт $IDLE_PORT занят посторонним процессом (см. ss -ltnp | grep :$IDLE_PORT). Поменяйте порты в $ECOSYSTEM."
fi

# --- 3. Код и зависимости --------------------------------------------------
log "git pull"
git pull

log "npm ci"
npm ci   # строго по lock-файлу и, в отличие от npm install, его не перезаписывает

# --- 4. Сборка в каталог простаивающего цвета ------------------------------
# Работающий процесс читает свой .next-$ACTIVE и не затрагивается вообще —
# именно здесь раньше возникал простой на всё время сборки.
log "сборка в .next-$IDLE"
rm -rf ".next-$IDLE"
NODE_ENV=production NEXT_DIST_DIR=".next-$IDLE" npm run build

BUILD_ID=$(cat ".next-$IDLE/BUILD_ID") || die "сборка не дала BUILD_ID"
log "BUILD_ID новой версии: $BUILD_ID"

# --- 5. Статика в общий каталог, старую НЕ удаляем -------------------------
# У клиента в браузере может лежать HTML прошлой версии со ссылками на чанки
# с прошлыми хешами. Если отдавать статику только из новой сборки, такой
# клиент получит 404. Поэтому копим статику обоих релизов в одном каталоге,
# который раздаёт nginx (заодно снимаем эту работу с Node).
log "статика → $SHARED_STATIC"
mkdir -p "$SHARED_STATIC"
cp -rlf ".next-$IDLE/static/." "$SHARED_STATIC/" 2>/dev/null \
    || cp -rf ".next-$IDLE/static/." "$SHARED_STATIC/"

# --- 6. Поднимаем простаивающий цвет --------------------------------------
# Перезапуск здесь безопасен: на этот порт трафик пока не идёт.
log "запуск prime-auto-$IDLE"
if pm2 describe "prime-auto-$IDLE" >/dev/null 2>&1; then
    pm2 restart "prime-auto-$IDLE" --update-env
else
    pm2 start "$ECOSYSTEM" --only "prime-auto-$IDLE" --env production
fi
pm2 describe "prime-auto-$IDLE" >/dev/null 2>&1 \
    || die "pm2 не создал процесс prime-auto-$IDLE. Проверьте, что имя файла $ECOSYSTEM содержит '.config.cjs' — иначе pm2 запускает его как обычный скрипт."

# --- 7. Health-check по BUILD_ID ------------------------------------------
# Проверяем не просто «порт отвечает», а что отвечает именно наше приложение
# и именно новой сборкой. Иначе чужой сервис на этом порту или не успевший
# подхватить сборку процесс молча прошли бы проверку.
log "проверка http://127.0.0.1:$IDLE_PORT/ на BUILD_ID $BUILD_ID"
ok=
for _ in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -fsS --max-time 5 "http://127.0.0.1:$IDLE_PORT/" 2>/dev/null | grep -q "$BUILD_ID"; then
        ok=1; break
    fi
    sleep "$HEALTH_DELAY"
done
if [ -z "$ok" ]; then
    pm2 logs "prime-auto-$IDLE" --lines 20 --nostream || true
    pm2 stop "prime-auto-$IDLE" || true
    die "prime-auto-$IDLE не отдаёт новую сборку. Трафик остался на $ACTIVE, сайт работает."
fi

# --- 8. Переключение трафика ----------------------------------------------
log "переключаю nginx на порт $IDLE_PORT"
cp "$UPSTREAM_CONF" "$UPSTREAM_CONF.bak" 2>/dev/null || true
printf 'upstream prime_auto {\n    server 127.0.0.1:%s;\n}\n' "$IDLE_PORT" > "$UPSTREAM_CONF"
if ! nginx -t; then
    [ -f "$UPSTREAM_CONF.bak" ] && mv "$UPSTREAM_CONF.bak" "$UPSTREAM_CONF"
    die "nginx -t не прошёл, конфиг откатил. Трафик остался на $ACTIVE."
fi
systemctl reload nginx

# --- 9. Кэш nginx — только ПОСЛЕ переключения ------------------------------
# Если чистить до, nginx успеет наполнить пустой кэш ответами старого
# процесса, и после переключения вы будете отдавать старую вёрстку.
# С inlineCss это особенно заметно: CSS лежит внутри HTML-документа.
log "сброс кэша nginx"
rm -rf "$NGINX_CACHE"/* 2>/dev/null || true
systemctl reload nginx

# --- 10. Гасим старый цвет ------------------------------------------------
# С задержкой, чтобы запросы, уже принятые старым процессом, успели дожить.
log "через ${DRAIN_SECONDS}с останавливаю prime-auto-$ACTIVE"
sleep "$DRAIN_SECONDS"
pm2 stop "prime-auto-$ACTIVE" || true
pm2 save --force

log "готово: под трафиком $IDLE (порт $IDLE_PORT), BUILD_ID $BUILD_ID"
