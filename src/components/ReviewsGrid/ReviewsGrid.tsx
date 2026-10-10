import React from "react";
import './styles.css';
import {ReviewCard} from "@/components/ReviewsBlock/ReviewsBlock";
import type {YandexReview} from "@/constants/yandexReviews";

/**
 * Сетка отзывов для страницы /otzyvy: те же карточки, что в ленте, но без
 * обрезки по высоте — отзыв виден целиком.
 */
const ReviewsGrid = ({reviews}: {reviews: YandexReview[]}) => (
    <div className="reviews-grid-wrapper">
        <div className="reviews-grid">
            {reviews.map((review) => <ReviewCard key={review.id} review={review} as="article" />)}
        </div>
    </div>
);

export default ReviewsGrid;
