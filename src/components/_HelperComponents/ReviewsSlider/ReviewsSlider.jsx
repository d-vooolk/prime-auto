'use client'

import React from "react";
import {useState} from "react";
import Image from "next/image";
import Link from "next/link";
import './styles.css';

const ReviewCardQuoteImage = () => {
    return (
        <div className="slider-reviews-double">
            <Image
                src="/images/reviews-double.png"
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
            className="slider-link"
        >
            Прочитать источник
        </Link>
    </div>
);

const ReviewsSlider = ({reviews}) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextPage = () => {
        if (reviews[currentSlide + 2]) {
            setCurrentSlide(currentSlide + 2)
        }
    }

    const prevPage = () => {
        if (reviews[currentSlide - 2]) {
            setCurrentSlide(currentSlide - 2)
        }
    }

    return (
        <div className="slider-wrapper">
            <div
                className="reviews-arrow-back"
                onClick={() => prevPage()}
            >
                <Image src="/images/slider-prev.png" alt="стрелка назад" width={62} height={50}/>
            </div>
            <div
                className="reviews-arrow-next"
                onClick={() => nextPage()}
            >
                <Image src="/images/slider-next.png" alt="стрелка вперёд" width={62} height={50}/>
            </div>

            <ReviewCard
                name={reviews[currentSlide].name}
                review={reviews[currentSlide].review}
                link={reviews[currentSlide].link}
            />

            <ReviewCard
                name={reviews[currentSlide + 1].name}
                review={reviews[currentSlide + 1].review}
                link={reviews[currentSlide + 1].link}
            />
        </div>
    )
}

export default ReviewsSlider;