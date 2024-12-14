'use client'

import React, {useEffect, useState} from "react";
import Image from "next/image";

const FullWidthImage = ({ src, alt, className, height }) => {
    const [screenWidth, setScreenWidth] = useState(0);

    useEffect(() => {
        setScreenWidth(window.screen.width);
    }, []);

    if (screenWidth === 0) {
        return null;
    }

    return (
        <div className={className}>
            <Image
                src={src}
                alt={alt}
                width={screenWidth}
                height={height}
            />
        </div>
    );
};

export default FullWidthImage;