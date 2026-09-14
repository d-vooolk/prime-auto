import "./globals.css";
import React from "react";
import ReactDOM from "react-dom";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header.jsx";
import MobileHeader from "@/components/_Mobile/MobileHeader/MobileHeader.jsx";
import FastUp from "../components/_HelperComponents/FastUp/FastUp.jsx";
import ChatFloatingBlock from "../components/ChatFloatingBlock/ChatFloatingBlock.jsx";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import DeferredAnalytics from "@/components/_HelperComponents/DeferredAnalytics/DeferredAnalytics.jsx";
import { SITE_URL } from "@/constants/site.ts";
import { localBusinessJsonLd, webSiteJsonLd } from "@/utils/seo.ts";

export const metadata = {
    // База для canonical и Open Graph: без неё Next отдаёт относительные URL
    metadataBase: new URL(SITE_URL),
    icons: {
        icon: '/favicon.ico',
    },
    verification: {
        yandex: '46166f0eb1874634',
    },
    openGraph: {
        type: 'website',
        locale: 'ru_RU',
        siteName: 'Prime Auto',
    },
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#262626',
};

const FONTS_TO_PRELOAD = [
    '/fonts/inter-cyrillic.woff2',
    '/fonts/montserrat-cyrillic.woff2',
];

export default function RootLayout({children}) {
    // Шрифты лежат локально, но браузер узнаёт о них только после разбора CSS.
    // Preload убирает эту задержку с критического пути отрисовки.
    FONTS_TO_PRELOAD.forEach((href) => {
        ReactDOM.preload(href, {as: 'font', type: 'font/woff2', crossOrigin: 'anonymous'});
    });

    return (
        <html lang="ru">
        <body id="page-start">
        <JsonLd data={[localBusinessJsonLd(), webSiteJsonLd()]} />

        {/* GTM и Метрика поднимаются после первого действия пользователя — см. компонент */}
        <DeferredAnalytics />

        <noscript>
            <iframe
                src="https://www.googletagmanager.com/ns.html?id=GTM-PKL79DZC"
                height="0"
                width="0"
                style={{display: 'none', visibility: 'hidden'}}
                title="Google Tag Manager"
            />
        </noscript>
        <noscript>
            <div>
                {/* Трекинг-пиксель Метрики для клиентов без JS: next/image прогнал бы его
                    через свой оптимизатор и запрос до mc.yandex.ru просто не ушёл бы. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://mc.yandex.ru/watch/103843698" style={{position:'absolute', left:'-9999px'}} alt="" />
            </div>
        </noscript>
        <FastUp />

        {/*
          Обе шапки рендерятся на сервере, нужная выбирается медиазапросом.
          Раньше выбор делался по window.screen.width уже в браузере: до гидратации
          шапки в HTML не было вообще — это и скачок вёрстки, и отсутствие
          навигационных ссылок для поискового робота.
        */}
        <Header/>
        <MobileHeader/>

        {children}
        <Footer/>

        <ChatFloatingBlock />
        </body>
        </html>
    );
}
