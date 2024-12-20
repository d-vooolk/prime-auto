'use client'

import React, {useEffect} from "react";
import {useState} from "react";
import Image from "next/image";
import Link from "next/link";
import './styles.css';

const ReviewCardQuoteImage = () => {
    return (
        <div className="slider-reviews-double">
            <Image
                src="/images/reviews-double.webp"
                alt="цитата отзыва"
                width={73}
                height={59}
            />
        </div>
    )
}

const ReviewCard = ({ name, review, link }) => (
    <div className="slider-card">
        <ReviewCardQuoteImage />
        <div className="slider-name">{name.toUpperCase()}</div>
        <div className="slider-description">{review}</div>
        <Link
            href={link}
            target="_blank noopener norefferer"
            className="slider-link"
        >
            Прочитать источник
        </Link>
    </div>
);

const ReviewsSlider = ({reviews}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [screenWidth, setScreenWidth] = useState(0);

    useEffect(() => {
        const handleResize = () => setScreenWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const slidesToMove = screenWidth >= 1200 ? 2 : 1;

    const nextPage = () => {
        const nextSlide = currentSlide + slidesToMove;
        if (reviews[nextSlide]) {
            setCurrentSlide(nextSlide);
        }
    };

    const prevPage = () => {
        const prevSlide = currentSlide - slidesToMove;
        if (reviews[prevSlide]) {
            setCurrentSlide(prevSlide);
        }
    };

    return (
        <div className="slider-wrapper">
            <div className="slider-buttons-wrapper">
                <div
                    className="reviews-arrow-back"
                    onClick={() => prevPage()}
                >
                    <Image src="/images/slider-prev.webp" alt="стрелка назад" width={62} height={50}/>
                </div>
                <div
                    className="reviews-arrow-next"
                    onClick={() => nextPage()}
                >
                    <Image src="/images/slider-next.webp" alt="стрелка вперёд" width={62} height={50}/>
                </div>
            </div>

            <ReviewCard
                name={reviews[currentSlide].name}
                review={reviews[currentSlide].review}
                link={reviews[currentSlide].link}
            />

            {
                screenWidth >= 1200 && (
                    <ReviewCard
                        name={reviews[currentSlide + 1].name}
                        review={reviews[currentSlide + 1].review}
                        link={reviews[currentSlide + 1].link}
                    />
                )
            }
        </div>
    )
}

export default ReviewsSlider;