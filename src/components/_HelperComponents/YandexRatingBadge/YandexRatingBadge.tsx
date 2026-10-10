import React from "react";
import './styles.css';
import {formatRating, getYandexStats, plural, YANDEX_RATING} from "@/constants/yandexReviews";

interface YandexRatingBadgeProps {
    /** dark — на тёмном фоне (подвал, блок отзывов), light — на светлом */
    theme?: "dark" | "light";
    /** compact — одна строка для первого экрана: «Я 5,0 ★★★★★ 172 оценки на Яндекс Картах» */
    variant?: "full" | "compact";
    className?: string;
}

/**
 * Плашка «Яндекс Карты · 5,0 ★★★★★ · 172 оценки» со ссылкой на карточку.
 * Цифры обновляются сами раз в неделю — см. src/constants/yandexReviews.ts. Микроразметки рейтинга здесь нет намеренно:
 * Google не показывает звёзды организаций по их собственной разметке, а за
 * чужой рейтинг в разметке можно получить ручные санкции.
 */
const YandexRatingBadge = ({theme = "dark", variant = "full", className = ""}: YandexRatingBadgeProps) => {
    const stats = getYandexStats();
    const rating = formatRating(stats.rating);
    const ratings = plural(stats.ratings, ["оценка", "оценки", "оценок"]);
    const reviews = plural(stats.reviewsCount, ["отзыв", "отзыва", "отзывов"]);

    const label = `Prime Auto на Яндекс Картах: рейтинг ${rating} из 5, ${ratings}, ${reviews}`;

    if (variant === "compact") {
        return (
            <a
                href={YANDEX_RATING.reviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`yandex-badge-compact yandex-badge-compact--${theme} ${className}`.trim()}
                aria-label={label}
            >
                <span className="yandex-badge-logo yandex-badge-logo--small" aria-hidden="true">Я</span>
                <span className="yandex-badge-compact-text" aria-hidden="true">
                    <span className="yandex-badge-compact-top">
                        <b>{rating}</b>
                        <span className="yandex-badge-stars">★★★★★</span>
                    </span>
                    <span className="yandex-badge-compact-count">{ratings} на Яндекс Картах</span>
                </span>
            </a>
        );
    }

    return (
        <a
            href={YANDEX_RATING.reviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`yandex-badge yandex-badge--${theme} ${className}`.trim()}
            aria-label={label}
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
