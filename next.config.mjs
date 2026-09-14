/** @type {import('next').NextConfig} */
const YEAR = 60 * 60 * 24 * 365;
const MONTH = 60 * 60 * 24 * 30;

const nextConfig = {
    /*
      Каталог сборки задаётся снаружи, по умолчанию — обычный .next.
      Нужно для деплоя без простоя: новая сборка складывается в отдельный
      каталог и не трогает тот, из которого прямо сейчас читает работающий
      процесс. Значение обязано совпадать на сборке и на запуске.
    */
    distDir: process.env.NEXT_DIST_DIR || '.next',
    reactStrictMode: true, // Включает строгий режим React
    poweredByHeader: false, // лишний заголовок X-Powered-By в ответе не нужен
    experimental: {
        // Вместо 8 отдельных <link rel="stylesheet"> Next встраивает CSS маршрута в HTML.
        // PageSpeed показывал 930 мс блокирующих отрисовку запросов и цепочку
        // документ → css → шрифт из четырёх хопов: инлайн убирает и то, и другое.
        inlineCss: true,
    },
    images: {
        // оптимизированные картинки живут в кэше месяц вместо часа — меньше пересжатий на сервере
        minimumCacheTTL: MONTH,
        // Самая широкая картинка на сайте — hero 1100 CSS-px. Вариант 3840 не нужен никому,
        // но именно его выбирал браузер на мобильных из-за srcset с 2x-дескриптором.
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    },
    webpack: (config) => {
        config.resolve.extensions.push('.ts', '.tsx'); // Убедитесь, что эти расширения добавлены
        return config;
    },
    async headers() {
        return [
            {
                /*
                  Заголовки безопасности из раздела «Надежность и безопасность» Lighthouse.
                  CSP и HSTS сюда намеренно не добавлены: CSP придётся расписывать под GTM,
                  Метрику и ymaps (иначе аналитика отвалится), а HSTS — это обязательство
                  отдавать сайт только по HTTPS, его логичнее включать на уровне nginx.
                */
                source: '/:path*',
                headers: [
                    {key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups'},
                    {key: 'X-Content-Type-Options', value: 'nosniff'},
                    {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
                ],
            },
            {
                // шрифты самохостятся и не меняются — отдаём их с «вечным» кэшем
                source: '/fonts/:path*',
                headers: [
                    {key: 'Cache-Control', value: `public, max-age=${YEAR}, immutable`},
                ],
            },
            {
                source: '/images/:path*',
                headers: [
                    {key: 'Cache-Control', value: `public, max-age=${MONTH}`},
                ],
            },
            {
                source: '/icons/:path*',
                headers: [
                    {key: 'Cache-Control', value: `public, max-age=${MONTH}`},
                ],
            },
            {
                source: '/chatIcons/:path*',
                headers: [
                    {key: 'Cache-Control', value: `public, max-age=${MONTH}`},
                ],
            },
        ];
    },
};

export default nextConfig;
