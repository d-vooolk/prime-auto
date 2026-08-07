import "./globals.css";
import Footer from "@/components/Footer/Footer";
import Head from "next/head.js";
import {GetAdaptiveHeader} from "@/utils/utils.js";
import React from "react";
import { GoogleTagManager } from '@next/third-parties/google'
import FastUp from "../components/_HelperComponents/FastUp/FastUp.jsx";
import Script from "next/script.js";

export default function RootLayout({children}) {
    return (
        <html lang="ru">
        <GoogleTagManager gtmId="GTM-PKL79DZC" />
        <head>
            <meta name="yandex-verification" content="46166f0eb1874634" />
        </head>
        <Head>
            <link rel="icon" href="/favicon.ico" />
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <body id="page-start">
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
        <GetAdaptiveHeader/>
        {children}
        <Footer/>
        </body>
        </html>
    );
}
