import "./globals.css";
import React from "react";
import ReactDOM from "react-dom";
import { GoogleTagManager } from '@next/third-parties/google'
import Script from "next/script.js";
import Footer from "@/components/Footer/Footer";
import Header from "@/components/Header/Header.jsx";
import MobileHeader from "@/components/_Mobile/MobileHeader/MobileHeader.jsx";
import FastUp from "../components/_HelperComponents/FastUp/FastUp.jsx";
import ChatFloatingBlock from "../components/ChatFloatingBlock/ChatFloatingBlock.jsx";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
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
        <GoogleTagManager gtmId="GTM-PKL79DZC" />

        <JsonLd data={[localBusinessJsonLd(), webSiteJsonLd()]} />

        <Script
            id="yandex-metrika"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
                __html: `
                            (function(m,e,t,r,i,k,a){
                                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                                m[i].l=1*new Date();
                                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
                            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js','ym');

                            ym(103843698, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
                        `
            }}
        />
        <noscript>
            <div>
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
