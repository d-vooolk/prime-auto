'use client'

import React from "react";
import Image from "next/image";

const FullWidthImage = ({ src, alt,  className, height }) => {
    const screenWidth = window.screen.width;

    return (
        <div className={className}>
            <Image
                src={src}
                alt={alt}
                width={screenWidth}
                height={height}
            />
        </div>
    )
}

export default FullWidthImage;