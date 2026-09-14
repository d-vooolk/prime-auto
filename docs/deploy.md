# Деплой без простоя

## Откуда брался простой

В прежнем `npm run restart` простой складывался из двух вещей:

1. `rm -rf .next` выполнялся **до** сборки, пока старый процесс работал и читал
   файлы из этого каталога. Всё время сборки (15–60 с) сайт отдавал ошибки.
2. Даже без этого `pm2 restart` гасит единственный процесс, и пока новый
   поднимается (2–5 с на старт Next), nginx получает отказ в соединении → 502.

Плюс отдельный баг в порядке шагов: кэш nginx чистился **до** перезапуска
приложения, поэтому nginx успевал наполнить пустой кэш ответами ещё старого
процесса. После обновления вы могли видеть старую вёрстку. С `inlineCss: true`
это стало заметнее — CSS теперь лежит внутри HTML-документа.

## Как устроено сейчас

Два процесса, `blue` (порт 3001) и `green` (порт 3002), каждый со своим
каталогом сборки (`.next-blue` / `.next-green`) — за это отвечает
`distDir: process.env.NEXT_DIST_DIR` в `next.config.mjs`. Под трафиком всегда
ровно один; какой именно, решает `upstream` в nginx.

`scripts/deploy.sh` собирает и поднимает **простаивающий** цвет, проверяет
health-check'ом, что он отвечает, и только потом переключает на него nginx.
Старый процесс до этого момента продолжает обслуживать пользователей, а
`systemctl reload nginx` подменяет воркеры плавно, не обрывая соединения.

Если сборка или health-check упали — трафик не переключается, и сайт
продолжает работать на старой версии. Это главное свойство схемы:
**неудачный деплой не приводит к падению.**

## Разовая настройка на сервере

Всё ниже выполняется от root (в скриптах `sudo` нет — вы и так root).

### 1. Код и первая сборка

```bash
cd /var/www/prime-auto
git checkout -- package-lock.json    # разблокировать pull, если ещё не делали
git pull
npm ci

NODE_ENV=production NEXT_DIST_DIR=.next-blue npm run build
mkdir -p shared/next-static
cp -rlf .next-blue/static/. shared/next-static/
```

### 2. Поднять blue и убедиться, что он отвечает

```bash
pm2 start ecosystem.bluegreen.cjs --only prime-auto-blue --env production
curl -I http://127.0.0.1:3001/        # ожидаем 200
```

Старый процесс на 3000 пока работает и обслуживает сайт — не трогаем.

### 3. upstream для nginx

Этот файл дальше перезаписывает `deploy.sh`, вручную к нему возвращаться не нужно.

```bash
cat > /etc/nginx/conf.d/prime-auto-upstream.conf <<'EOF'
upstream prime_auto {
    server 127.0.0.1:3001;
}
EOF
```

### 4. Правки в конфиге сайта

В вашем `server { ... }` для `prime-auto.by`:

```nginx
# Статику отдаёт nginx из общего каталога. Там лежат чанки и текущего, и
# предыдущего релиза — поэтому клиент, у которого в браузере остался HTML
# прошлой версии, не поймает 404 на /_next/static/chunks/<старый-хеш>.js.
# Побочная польза: раздача статики уходит с Node на nginx.
location /_next/static/ {
    alias /var/www/prime-auto/shared/next-static/;
    access_log off;
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
}

location / {
    proxy_pass http://prime_auto;          # вместо http://127.0.0.1:3000
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_cache            ВАША_ЗОНА;      # см. предупреждение ниже
    proxy_cache_use_stale  updating error timeout http_500 http_502 http_503 http_504;
    proxy_cache_background_update on;
    proxy_cache_lock       on;
}
```

**`proxy_cache ВАША_ЗОНА`** — подставьте имя зоны из своей директивы
`proxy_cache_path ... keys_zone=ИМЯ:...`. Я её не знаю; если сейчас в конфиге
`proxy_cache` уже есть, просто оставьте как есть и добавьте только строки
`proxy_cache_use_stale` / `background_update` / `lock`.

Отдельно стоит отметить `proxy_cache_use_stale`: он разрешает nginx отдавать
устаревший ответ из кэша, пока бэкенд недоступен или обновляется. Для сайта,
который почти целиком статические страницы, это прячет от пользователя даже
секундные перезапуски — **и работает независимо от blue-green**. Если на
полную схему переходить не хочется, начните с одной этой строки.

### 5. Применить и переключиться

```bash
nginx -t && systemctl reload nginx
curl -I https://prime-auto.by/         # проверяем, что сайт жив на blue
pm2 delete prime-auto                  # старый одиночный процесс на 3000 больше не нужен
pm2 save --force
```

### 6. Собрать второй цвет, чтобы откат был возможен сразу

```bash
NODE_ENV=production NEXT_DIST_DIR=.next-green npm run build
cp -rlf .next-green/static/. shared/next-static/
```

## Повседневное использование

```bash
cd /var/www/prime-auto && ./scripts/deploy.sh
```

или `npm run deploy:bluegreen`. Скрипт сам определяет активный цвет по конфигу
nginx, так что помнить, где вы сейчас, не нужно.

Откат на предыдущую версию (без сборки, секунды):

```bash
./scripts/rollback.sh
```

Откат возможен **ровно на один деплой назад** — следующий `deploy.sh`
перезапишет каталог сборки того цвета.

## Что осталось знать

- **`shared/next-static` растёт.** Каждый деплой докладывает туда статику и
  ничего не удаляет — в этом весь смысл. Раз в месяц по cron:
  `find /var/www/prime-auto/shared/next-static -type f -mtime +30 -delete`.
  Копирование идёт жёсткими ссылками (`cp -l`), так что места занимает
  столько же, сколько сами сборки.
- **Диск.** Теперь на сервере лежат два `node_modules`-независимых каталога
  сборки вместо одного, плюс общая статика. Ориентировочно +300–400 МБ.
- **Первый запрос после переключения** идёт в холодный процесс и кэш nginx
  чистится, поэтому одна-две страницы отдадутся медленнее обычного. На метрики
  PageSpeed это не влияет — он мерит позже.
- **Перезагрузка сервера.** `pm2 save --force` в конце деплоя фиксирует
  состояние; убедитесь, что `pm2 startup` когда-то был выполнен, иначе после
  ребута процессы не поднимутся.
- **Прежний путь никуда не делся.** `ecosystem.config.cjs` и `npm run restart`
  оставлены рабочими. Пока nginx проксирует на 3000, всё работает по-старому,
  и перейти на blue-green можно в любой момент.
