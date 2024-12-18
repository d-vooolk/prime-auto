import React from "react";
import './styles.css';
import ReviewsSlider from "@/components/_HelperComponents/ReviewsSlider/ReviewsSlider.jsx";
import {reviews} from "./constants.js";

const ReviewsBlock = () => {
    return (
        <div className="reviews-wrapper" id="reviews">
            <div className="reviews-title-wrapper">
                <h2 className="reviews-title-upper">Наших клиентов</h2>
                <h2 className="reviews-title-under">ОТЗЫВЫ</h2>
            </div>

            <div className="reviews-slider-wrapper">
                <ReviewsSlider reviews={reviews} />
            </div>
        </div>
    )
}

export default ReviewsBlock;