import React from "react";
import Image from "next/image";
import Link from "next/link";
import './styles.css';

/**
 * Сетка отзывов для отдельной страницы: тот же визуальный язык, что у слайдера
 * на главной, но без обрезки по высоте — весь текст отзыва виден поисковику сразу.
 */
const ReviewsGrid = ({reviews}) => (
    <div className="reviews-grid-wrapper">
        <div className="reviews-grid">
            {reviews.map((item) => (
                <article className="reviews-grid-card" key={item.name + item.review.slice(0, 24)}>
                    <div className="reviews-grid-quote">
                        <Image
                            src="/images/reviews-double.webp"
                            alt=""
                            width={73}
                            height={59}
                        />
                    </div>
                    <div className="reviews-grid-name">{item.name.toUpperCase()}</div>
                    <p className="reviews-grid-description">{item.review}</p>
                    <Link
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="reviews-grid-link"
                    >
                        Прочитать источник
                    </Link>
                </article>
            ))}
        </div>
    </div>
);

export default ReviewsGrid;
