import React from "react";
import Link from "next/link";
import './styles.css';
import ServicePageTitleContainer
    from "@/components/_HelperComponents/ServicePageTitleContainer/ServicePageTitleContainer";
import ReviewsGrid from "@/components/ReviewsGrid/ReviewsGrid";
import FaqBlock from "@/components/_HelperComponents/FaqBlock/FaqBlock";
import Portfolio from "@/components/Portfolio/Portfolio";
import FormBlock from "@/components/FormBlock/FormBlock";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import {reviews} from "@/components/ReviewsBlock/constants";
import {LINKS} from "@/constants/links";
import {NAVIGATION_URL} from "@/constants/navigation";
import {buildMetadata, reviewsJsonLd} from "@/utils/seo";
import {REVIEWS_PAGE_FAQ, REVIEWS_PAGE_TEXT} from "@/app/otzyvy/constants";

export const metadata = buildMetadata({
    title: 'Отзывы о Prime Auto — мастерская автосвета в Минске',
    description: 'Отзывы клиентов о ремонте фар, установке Bi-Led модулей и полировке ' +
        'в Минске — с Яндекс.Карт, со ссылками на источники.',
    path: NAVIGATION_URL.reviews,
});

const ReviewsPage = () => (
    <main className="reviews-page-wrapper">
        <JsonLd data={reviewsJsonLd(reviews, NAVIGATION_URL.reviews)} />

        <ServicePageTitleContainer
            headText={REVIEWS_PAGE_TEXT.title}
            description={REVIEWS_PAGE_TEXT.description}
            breadcrumbs={[
                {name: 'Главная', path: NAVIGATION_URL.home},
                {name: 'Отзывы', path: NAVIGATION_URL.reviews},
            ]}
        />

        <ReviewsGrid reviews={reviews} />

        <div className="reviews-page-cta">
            <p className="reviews-page-cta-text">{REVIEWS_PAGE_TEXT.ctaText}</p>
            <Link
                href={LINKS.yandexMap}
                target="_blank"
                rel="noopener noreferrer"
                className="reviews-page-cta-button"
            >
                <span>Все отзывы на Яндекс.Картах</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 7H17M17 7V17M17 7L7 17" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </Link>
        </div>

        <FaqBlock items={REVIEWS_PAGE_FAQ} />

        <Portfolio />
        <FormBlock />
    </main>
);

export default ReviewsPage;
