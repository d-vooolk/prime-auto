module.exports = {
    apps: [
        {
            name: "prime-auto",
            script: "server.js", // Ваш серверный файл
            env: {
                NODE_ENV: "production", // Установить production-режим
                PORT: 3000, // Укажите порт
            },
        },
    ],
};