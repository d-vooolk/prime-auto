import "./globals.css";
import Footer from "@/components/Footer/Footer";
import Head from "next/head.js";
import {GetAdaptiveHeader} from "@/utils/utils.js";
import React from "react";
import { GoogleTagManager } from '@next/third-parties/google'
import FastUp from "../components/_HelperComponents/FastUp/FastUp.jsx";

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
        <FastUp />
        <GetAdaptiveHeader/>
        {children}
        <Footer/>
        </body>
        </html>
    );
}
