/*
  Конфиг для деплоя без простоя (blue-green).

  ВАЖНО про имя файла: pm2 считает файл ecosystem-конфигом только если в имени
  есть .config.js / .config.cjs / .config.mjs / .json / .yaml. Файл с любым
  другим именем pm2 молча запустит как обычный Node-скрипт, и приложения из
  него не поднимутся. Поэтому переименовывать в ecosystem.bluegreen.cjs нельзя.

  ПОРТЫ — единственное место, где они заданы: scripts/deploy.sh и
  scripts/rollback.sh читают их отсюда. На сервере несколько приложений,
  свободные порты проверяйте через `ss -ltnp` перед правкой.
  Два независимых процесса с собственными портами и каталогами сборки.
  В любой момент трафик идёт только на один из них — какой именно,
  решает upstream в nginx (см. docs/deploy.md).

  Старый ecosystem.config.cjs оставлен рабочим: пока nginx проксирует
  на порт 3000, ничего не меняется.
*/
const BLUE_PORT = 3101;
const GREEN_PORT = 3102;

const base = {
    script: "server.js",
    cwd: __dirname,
    exec_mode: "fork",
    autorestart: true,
    max_memory_restart: "512M",
    // Наружу процессы не смотрят — их публикует nginx
    env: {NODE_ENV: "production", HOST: "127.0.0.1"},
};

module.exports = {
    apps: [
        {
            ...base,
            name: "prime-auto-blue",
            env: {...base.env, PORT: BLUE_PORT, NEXT_DIST_DIR: ".next-blue"},
            env_production: {NODE_ENV: "production", HOST: "127.0.0.1", PORT: BLUE_PORT, NEXT_DIST_DIR: ".next-blue"},
        },
        {
            ...base,
            name: "prime-auto-green",
            env: {...base.env, PORT: GREEN_PORT, NEXT_DIST_DIR: ".next-green"},
            env_production: {NODE_ENV: "production", HOST: "127.0.0.1", PORT: GREEN_PORT, NEXT_DIST_DIR: ".next-green"},
        },
    ],
};
