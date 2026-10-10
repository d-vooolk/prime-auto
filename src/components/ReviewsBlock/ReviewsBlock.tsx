import React from "react";
import Link from "next/link";
import './styles.css';
import ReviewsScroller from "./ReviewsScroller";
import YandexRatingBadge from "@/components/_HelperComponents/YandexRatingBadge/YandexRatingBadge";
import {formatReviewDate, reviewsFor, YANDEX_RATING, type ReviewTopic, type YandexReview} from "@/constants/yandexReviews";
import {NAVIGATION_URL} from "@/constants/navigation";

interface ReviewsBlockProps {
    /** Услуги страницы: отзывы про них встанут первыми */
    topics?: ReviewTopic[];
    /** Марка на странице марки: отзывы, где она упомянута, встанут первыми */
    mention?: string;
    limit?: number;
}

/** Карточка отзыва — общая для ленты и страницы /otzyvy */
export const ReviewCard = ({review, as: Tag = "li"}: {review: YandexReview; as?: "li" | "article"}) => (
    <Tag className="review-card">
        <div className="review-card-head">
            <span className="review-card-avatar" aria-hidden="true">{review.name.charAt(0).toUpperCase()}</span>
            <span className="review-card-author">
                <span className="review-card-name">{review.name}</span>
                <time className="review-card-date" dateTime={review.date}>{formatReviewDate(review.date)}</time>
            </span>
        </div>
        <div className="review-card-stars" aria-label={`Оценка ${review.rating} из 5`}>
            {"★".repeat(review.rating)}
        </div>
        <p className="review-card-text">{review.text}</p>
        <a
            href={YANDEX_RATING.reviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="review-card-source"
        >
            Отзыв на Яндекс Картах
        </a>
    </Tag>
);

/**
 * Блок отзывов с Яндекс Карт: плашка рейтинга, лента реальных отзывов с датами
 * и ссылки «все отзывы» / «оставить отзыв». Отзывы берутся из JSON при сборке —
 * текст лежит в HTML, внешний виджет не грузится и скорость страницы не страдает.
 */
const ReviewsBlock = ({topics, mention, limit = 8}: ReviewsBlockProps) => {
    const reviews = reviewsFor(topics, limit, mention);

    return (
        <section className="reviews-wrapper" id="reviews" aria-labelledby="reviews-title">
            <div className="reviews-head">
                <div className="reviews-title-wrapper">
                    {/* Надпись над заголовком — декоративная, не заголовок: иначе
                        в оглавлении страницы появляется бессмысленный обрывок */}
                    <div className="reviews-title-upper">Наших клиентов</div>
                    <h2 className="reviews-title-under" id="reviews-title">Отзывы</h2>
                </div>
                <YandexRatingBadge />
            </div>

            <ReviewsScroller>
                {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
            </ReviewsScroller>

            <div className="reviews-actions">
                <Link href={NAVIGATION_URL.reviews} className="reviews-button reviews-button--primary">
                    Все отзывы
                </Link>
                <a
                    href={YANDEX_RATING.addReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reviews-button"
                >
                    Оставить отзыв на Яндексе
                </a>
            </div>
        </section>
    );
};

export default ReviewsBlock;
