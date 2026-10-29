#!/usr/bin/env bash
#
# Деплой без простоя (blue-green) в Docker.
#
# Идея: собираем и поднимаем новую версию рядом с работающей, проверяем, что
# она отвечает, и только потом переключаем на неё трафик в nginx. Пользователь
# в момент подмены не видит ни ошибок, ни паузы: старый контейнер продолжает
# отвечать до самого переключения, а nginx reload делает это плавно.
#
# Разбор и первичная настройка — docs/deploy.md
#
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/prime-auto}"
UPSTREAM_CONF="${UPSTREAM_CONF:-/etc/nginx/conf.d/prime-auto-upstream.conf}"
NGINX_CACHE="${NGINX_CACHE:-/var/cache/nginx}"
CRON_FILE="${CRON_FILE:-/etc/cron.d/prime-auto}"
SHARED_STATIC="$APP_DIR/shared/next-static"
HEALTH_RETRIES=30
HEALTH_DELAY=2
DRAIN_SECONDS=10

log() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[31mОШИБКА: %s\033[0m\n' "$*" >&2; exit 1; }

cd "$APP_DIR"

command -v docker >/dev/null || die "нет docker"
docker compose version >/dev/null 2>&1 || die "нет плагина docker compose"

# Порты живут только в docker-compose.yml, здесь их не дублируем: разъехавшиеся
# копии в трёх файлах — надёжный способ переключить трафик не туда.
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

# Переход с pm2: до Docker цвета жили там под именами prime-auto-<цвет>.
# Когда pm2 на сервере не останется, функция просто ничего не делает.
pm2_has() { command -v pm2 >/dev/null 2>&1 && pm2 describe "prime-auto-$1" >/dev/null 2>&1; }
running() { [ -n "$(docker compose ps -q --status running "$1" 2>/dev/null)" ]; }

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
# контейнер не сможет забиндиться и уйдёт в цикл перезапусков — ловим это
# сразу и с внятным сообщением.
if pm2_has "$IDLE"; then
    pm2 delete "prime-auto-$IDLE" >/dev/null
fi
if ss -ltn "sport = :$IDLE_PORT" 2>/dev/null | grep -q LISTEN && ! running "$IDLE"; then
    die "порт $IDLE_PORT занят посторонним процессом (см. ss -ltnp | grep :$IDLE_PORT). Поменяйте порты в docker-compose.yml."
fi

# --- 3. Код, среда и зависимости -------------------------------------------
log "git pull"
git pull

# Образ — это только Node и системные пакеты. Пересобирается по-настоящему
# лишь при правке Dockerfile, в остальных случаях берётся из кэша за секунду.
log "образ среды"
docker compose build -q

log "npm ci"
docker compose run --rm --no-deps tools npm ci   # строго по lock-файлу

# --- 4. Сборка в каталог простаивающего цвета ------------------------------
# Работающий контейнер читает свой .next-$ACTIVE и не затрагивается вообще.
log "сборка в .next-$IDLE"
rm -rf ".next-$IDLE"
# tsconfig подключает типы всех каталогов сборки, а в чужих каталогах они
# описывают прошлую версию маршрутов — после переименования страниц проверка
# типов падает на несуществующих файлах. Для работы процессов types не нужны
# (это только объявления для tsc), новая сборка создаст свои.
rm -rf .next/types .next/dev/types .next-blue/types .next-blue/dev/types .next-green/types .next-green/dev/types
docker compose run --rm --no-deps -e NODE_ENV=production -e NEXT_DIST_DIR=".next-$IDLE" tools npm run build

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
# Пересоздание здесь безопасно: на этот порт трафик пока не идёт.
log "запуск prime-auto-$IDLE"
docker compose up -d --no-deps --force-recreate "$IDLE"

# --- 7. Health-check по BUILD_ID ------------------------------------------
# Проверяем не просто «порт отвечает», а что отвечает именно наше приложение
# и именно новой сборкой. Иначе чужой сервис на этом порту или не успевший
# подхватить сборку процесс молча прошли бы проверку.
log "проверка http://127.0.0.1:$IDLE_PORT/ на BUILD_ID $BUILD_ID"
ok=
for _ in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -fsS --max-time 5 "http://127.0.0.1:$IDLE_PORT/" 2>/dev/null | grep -qF -- "$BUILD_ID"; then
        ok=1; break
    fi
    sleep "$HEALTH_DELAY"
done
if [ -z "$ok" ]; then
    docker compose logs --tail 20 "$IDLE" || true
    docker compose stop "$IDLE" || true
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
docker compose stop "$ACTIVE" || true
if pm2_has "$ACTIVE"; then
    pm2 delete "prime-auto-$ACTIVE" >/dev/null || true
fi
command -v pm2 >/dev/null 2>&1 && pm2 save --force >/dev/null 2>&1 || true

# --- 11. Расписание -------------------------------------------------------
# Скрипты по расписанию работают в той же среде, что и сайт. Файл пишется
# при каждом деплое: правка расписания едет вместе с кодом.
log "cron → $CRON_FILE"
cat > "$CRON_FILE" <<CRON
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
# Отзывы Яндекса — по понедельникам
15 5 * * 1 root cd $APP_DIR && docker compose run --rm --no-deps tools node scripts/yandex-reviews.mjs --live >> /var/log/prime-auto-yandex-reviews.log 2>&1
# Сводка поиска (Search Console, Вебмастер) — каждое утро
40 6 * * * root cd $APP_DIR && docker compose run --rm --no-deps tools node scripts/search-collect.mjs >> /var/log/prime-auto-search.log 2>&1
# AI-SEO: ИИ-боты из логов nginx и вопросные запросы — после сводки поиска
10 7 * * * root cd $APP_DIR && docker compose run --rm --no-deps tools node scripts/ai-seo-collect.mjs >> /var/log/prime-auto-ai-seo.log 2>&1
# Статика прошлых релизов старше месяца никому уже не нужна
30 4 1 * * root find $SHARED_STATIC -type f -mtime +30 -delete
CRON
chmod 644 "$CRON_FILE"
# До Docker эти задачи жили в crontab root и запускались системным node.
if crontab -l 2>/dev/null | grep -q "$APP_DIR && .*node scripts/"; then
    crontab -l | grep -v "$APP_DIR && .*node scripts/" | crontab -
fi

log "готово: под трафиком $IDLE (порт $IDLE_PORT), BUILD_ID $BUILD_ID"
