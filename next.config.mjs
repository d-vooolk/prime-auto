/** @type {import('next').NextConfig} */
const YEAR = 60 * 60 * 24 * 365;
const MONTH = 60 * 60 * 24 * 30;

const nextConfig = {
    reactStrictMode: true, // Включает строгий режим React
    poweredByHeader: false, // лишний заголовок X-Powered-By в ответе не нужен
    images: {
        // оптимизированные картинки живут в кэше месяц вместо часа — меньше пересжатий на сервере
        minimumCacheTTL: MONTH,
    },
    webpack: (config) => {
        config.resolve.extensions.push('.ts', '.tsx'); // Убедитесь, что эти расширения добавлены
        return config;
    },
    async headers() {
        return [
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
