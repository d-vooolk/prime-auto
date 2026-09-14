/*
  Конфиг для деплоя без простоя (blue-green).
  Два независимых процесса с собственными портами и каталогами сборки.
  В любой момент трафик идёт только на один из них — какой именно,
  решает upstream в nginx (см. docs/deploy.md).

  Старый ecosystem.config.cjs оставлен рабочим: пока nginx проксирует
  на порт 3000, ничего не меняется.
*/
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
            env: {...base.env, PORT: 3001, NEXT_DIST_DIR: ".next-blue"},
            env_production: {NODE_ENV: "production", HOST: "127.0.0.1", PORT: 3001, NEXT_DIST_DIR: ".next-blue"},
        },
        {
            ...base,
            name: "prime-auto-green",
            env: {...base.env, PORT: 3002, NEXT_DIST_DIR: ".next-green"},
            env_production: {NODE_ENV: "production", HOST: "127.0.0.1", PORT: 3002, NEXT_DIST_DIR: ".next-green"},
        },
    ],
};
