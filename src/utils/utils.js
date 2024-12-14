'use client'

import {useEffect, useState} from "react";
import MobileHeader from "@/components/_Mobile/MobileHeader/MobileHeader.jsx";
import Header from "@/components/Header/Header.jsx";

export const GetAdaptiveHeader = () => {
    const [screenWidth, setScreenWidth] = useState(0);

    useEffect(() => {
        setScreenWidth(window.screen.width);
    }, []);

    if (screenWidth >= 320 && screenWidth <= 768) {
        return <MobileHeader />
    } else if (screenWidth >= 768) {
        return <Header />
    }
}
