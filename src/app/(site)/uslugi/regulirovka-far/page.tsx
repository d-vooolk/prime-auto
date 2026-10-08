import React from "react";
import {META} from "@/constants/metadata";
import ServiceLandingPage from "@/components/ServiceLandingPage/ServiceLandingPage";
import {buildMetadata} from "@/utils/seo";
import {NAVIGATION_URL} from "@/constants/navigation";
import {proposalList, PAGE_TITLE_TEXT, priceDataSource, SERVICE} from "@/app/(site)/uslugi/regulirovka-far/constants";

const META_PAGE = META.regulirovka;

export const metadata = buildMetadata({
    title: META_PAGE.title,
    description: META_PAGE.description,
    path: NAVIGATION_URL.regulirovka,
});

/* Страниц марок у регулировки нет: марка на неё не влияет, спроса с маркой почти нет */
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
