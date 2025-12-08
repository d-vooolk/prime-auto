/** @type {import('next').NextConfig} */
const nextConfig = {
    // // Явно отключаем Turbopack для сборки
    // experimental: {
    //     turbo: undefined
    // },
    reactStrictMode: true, // Включает строгий режим React
    webpack: (config) => {
        config.resolve.extensions.push('.ts', '.tsx'); // Убедитесь, что эти расширения добавлены
        return config;
    },
};

export default nextConfig;