import React from "react";
import './styles.css';
import {META} from "@/constants/metadata";
import ServiceLandingPage from "@/components/ServiceLandingPage/ServiceLandingPage";
import {buildMetadata} from "@/utils/seo";
import {NAVIGATION_URL} from "@/constants/navigation";
import {proposalList, PAGE_TITLE_TEXT, priceDataSource} from "@/app/uslugi/remont-far/constants";

const META_PAGE = META.remont;

export const metadata = buildMetadata({
    title: META_PAGE.title,
    description: META_PAGE.description,
    keywords: META_PAGE.keywords,
    path: NAVIGATION_URL.remont,
});

const Page = () => (
    <ServiceLandingPage
        serviceKey="remont"
        headText={PAGE_TITLE_TEXT.title}
        description={PAGE_TITLE_TEXT.description}
        priceTitle={PAGE_TITLE_TEXT.priceTitle}
        proposalList={proposalList}
        priceDataSource={priceDataSource}
        metaDescription={META_PAGE.description}
    />
);

export default Page;
