'use client'

import React, {useRef} from "react";

/**
 * Лента отзывов со стрелками. Сами карточки рендерятся на сервере и лежат в
 * HTML целиком — клиентский тут только скролл по стрелкам. Без JS лента
 * листается пальцем, колесом с Shift или тачпадом.
 */
const ReviewsScroller = ({children}: {children: React.ReactNode}) => {
    const listRef = useRef<HTMLUListElement>(null);

    const scroll = (direction: 1 | -1) => {
        const list = listRef.current;
        if (!list) return;
        list.scrollBy({left: direction * list.clientWidth * 0.9, behavior: "smooth"});
    };

    return (
        <div className="reviews-scroller">
            <ul className="reviews-list" ref={listRef}>
                {children}
            </ul>
            <div className="reviews-arrows">
                <button type="button" className="reviews-arrow" onClick={() => scroll(-1)} aria-label="Предыдущие отзывы">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button type="button" className="reviews-arrow" onClick={() => scroll(1)} aria-label="Следующие отзывы">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ReviewsScroller;
