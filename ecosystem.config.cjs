module.exports = {
    apps: [
        {
            name: "prime-auto",
            script: "server.js", // Ваш серверный файл
            env: {
                NODE_ENV: "development", // Режим по умолчанию
                PORT: 3000, // Порт по умолчанию
            },
            env_production: {
                NODE_ENV: "production", // Режим production
                PORT: 3000, // Порт для production
            },
        },
    ],
};