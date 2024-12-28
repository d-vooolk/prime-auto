import React from "react";
import './styles.css';
import ReviewsSlider from "@/components/_HelperComponents/ReviewsSlider/ReviewsSlider.jsx";
import {reviews} from "./constants.js";
import Link from "next/link";
import {LINKS} from "../../constants/links.js";

const ReviewsBlock = () => {
    return (
        <div className="reviews-wrapper" id="reviews">
            <div className="reviews-title-wrapper">
                <h2 className="reviews-title-upper">Наших клиентов</h2>
                <h2 className="reviews-title-under">ОТЗЫВЫ</h2>
            </div>

            <div className="reviews-slider-wrapper">
                <ReviewsSlider reviews={reviews}/>
            </div>

            <Link
                href={LINKS.yandexMap}
                className="reviews-block-button-wrapper"
                target="_blank noopener noreferrer"
            >
                <button type="submit" className="reviews-get-lead-button">
                    <span>Читать все</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 7H17M17 7V17M17 7L7 17" stroke="currentColor" strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"/>
                    </svg>
                </button>
            </Link>
        </div>
    )
}

export default ReviewsBlock;