import React from "react";
import {META} from "@/constants/metadata";
import ServiceLandingPage from "@/components/ServiceLandingPage/ServiceLandingPage";
import {buildMetadata} from "@/utils/seo";
import {NAVIGATION_URL} from "@/constants/navigation";
import {withRating} from "@/constants/yandexReviews";
import {proposalList, PAGE_TITLE_TEXT, priceDataSource, SERVICE} from "@/app/(site)/uslugi/remont-far/chistka-fary-iznutri/constants";

const META_PAGE = META.chistka;

export const generateMetadata = () => buildMetadata({
    title: META_PAGE.title,
    description: withRating(META_PAGE.description),
    path: NAVIGATION_URL.chistka,
});

/* Статический сегмент рядом с [brand]: Next отдаёт его раньше динамического, слаги марок с ним не совпадают */
const Page = () => (
    <ServiceLandingPage
        service={SERVICE}
        headText={PAGE_TITLE_TEXT.title}
        description={PAGE_TITLE_TEXT.description}
        priceTitle={PAGE_TITLE_TEXT.priceTitle}
        proposalList={proposalList}
        priceDataSource={priceDataSource}
        metaDescription={META_PAGE.description}
    />
);

export default Page;
