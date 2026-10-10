import React from "react";
import './styles.css';
import {formatRating, plural, YANDEX_RATING} from "@/constants/yandexReviews";

interface YandexRatingBadgeProps {
    /** dark — на тёмном фоне (подвал, блок отзывов), light — на светлом */
    theme?: "dark" | "light";
    className?: string;
}

/**
 * Плашка «Яндекс Карты · 5,0 ★★★★★ · 172 оценки» со ссылкой на карточку.
 * Цифры берутся из yandexReviews.json, обновляются скриптом
 * node scripts/yandex-reviews.mjs. Микроразметки рейтинга здесь нет намеренно:
 * Google не показывает звёзды организаций по их собственной разметке, а за
 * чужой рейтинг в разметке можно получить ручные санкции.
 */
const YandexRatingBadge = ({theme = "dark", className = ""}: YandexRatingBadgeProps) => {
    const rating = formatRating(YANDEX_RATING.rating);
    const ratings = plural(YANDEX_RATING.ratings, ["оценка", "оценки", "оценок"]);
    const reviews = plural(YANDEX_RATING.reviewsCount, ["отзыв", "отзыва", "отзывов"]);

    return (
        <a
            href={YANDEX_RATING.reviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`yandex-badge yandex-badge--${theme} ${className}`.trim()}
            aria-label={`Prime Auto на Яндекс Картах: рейтинг ${rating} из 5, ${ratings}, ${reviews}`}
        >
            <span className="yandex-badge-logo" aria-hidden="true">Я</span>
            <span className="yandex-badge-source">
                <span className="yandex-badge-name">Яндекс Карты</span>
                <span className="yandex-badge-count">{ratings} · {reviews}</span>
            </span>
            <span className="yandex-badge-score" aria-hidden="true">
                <span className="yandex-badge-value">{rating}</span>
                <span className="yandex-badge-stars">★★★★★</span>
            </span>
        </a>
    );
};

export default YandexRatingBadge;
