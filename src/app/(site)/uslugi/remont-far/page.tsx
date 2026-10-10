import React from "react";
import './styles.css';
import {META} from "@/constants/metadata";
import ServiceLandingPage from "@/components/ServiceLandingPage/ServiceLandingPage";
import {buildMetadata} from "@/utils/seo";
import {NAVIGATION_URL} from "@/constants/navigation";
import {proposalList, PAGE_TITLE_TEXT, priceDataSource, BEFORE_AFTER} from "@/app/(site)/uslugi/remont-far/constants";
import RemontExtra from "@/app/(site)/uslugi/remont-far/RemontExtra";
import {formatRating, getYandexStats, plural} from "@/constants/yandexReviews";

const META_PAGE = META.remont;

/*
  Рейтинг с Яндекса — в description: при 6-м месте по «ремонт фар в минске»
  CTR был 0,2%, звёзды и число оценок в сниппете — самый простой способ
  выделиться среди агрегаторов. Берётся из того же файла, что и плашка.
*/
export const generateMetadata = () => {
    const stats = getYandexStats();
    return buildMetadata({
        title: META_PAGE.title,
        description: `${META_PAGE.description} Рейтинг ${formatRating(stats.rating)} на Яндекс Картах — ` +
            `${plural(stats.ratings, ["оценка", "оценки", "оценок"])}.`,
        path: NAVIGATION_URL.remont,
    });
};

const Page = () => (
    <ServiceLandingPage
        serviceKey="remont"
        headText={PAGE_TITLE_TEXT.title}
        description={PAGE_TITLE_TEXT.description}
        priceTitle={PAGE_TITLE_TEXT.priceTitle}
        proposalList={proposalList}
        priceDataSource={priceDataSource}
        metaDescription={META_PAGE.description}
        beforeAfter={BEFORE_AFTER}
        extra={<RemontExtra />}
    />
);

export default Page;
