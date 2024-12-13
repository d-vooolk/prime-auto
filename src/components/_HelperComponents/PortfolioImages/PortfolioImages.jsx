'use client'

import React from "react";
import Image from "next/image";
import './styles.css';

const imageSrc = '/images/portfolio/';
const images = [];

const pullImages = () => {
    for (let i = 1; i <= 8; i++) {
        images.push(i);
    }
}

pullImages();

const PortfolioImages = () => {
    return (
        <div className="portfolio-images-wrapper">
            {
                images.length && images.map((item) => (
                    <div className="portfolio-image-wrapper" key={`${item}${Math.random() * item}`}>
                        <Image
                            src={`${imageSrc}${item}.png`}
                            alt="примеры работ"
                            width={250}
                            height={250}
                        />
                    </div>
                ))
            }
        </div>
    )
}

export default PortfolioImages;