import "./globals.css";
import {META} from "@/constants/metadata";
import Footer from "@/components/Footer/Footer";
import Head from "next/head.js";
import {GetAdaptiveHeader} from "@/utils/utils.js";
import React from "react";
import { GoogleTagManager } from '@next/third-parties/google'


export const metadata = {...META.general, robots: String(META.general.robots)}

export default function RootLayout({children}) {

    return (
        <html lang="ru">
        <GoogleTagManager gtmId="GTM-PKL79DZC" />
        <Head>
            <link rel="icon" href="/favicon.ico"/>
            <meta charSet="UTF-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
        </Head>
        <body>
        <GetAdaptiveHeader/>
        {children}
        <Footer/>
        </body>
        </html>
    );
}
