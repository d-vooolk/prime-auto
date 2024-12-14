import "./globals.css";
import {META} from "@/constants/metadata";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import Head from "next/head.js";


export const metadata = {...META.general, robots: String(META.general.robots)}

export default function RootLayout({children}) {

    return (
        <html lang="ru">
        <Head>
            <link rel="icon" href="/favicon.ico"/>
            <meta charSet="UTF-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <title>Мой сайт</title>
        </Head>
        <body>
            <Header/>
            {children}
            <Footer/>
        </body>
        </html>
    );
}
