import React from "react";
import './styles.css';
import {META} from "@/constants/metadata";
import ServiceLandingPage from "@/components/ServiceLandingPage/ServiceLandingPage";
import {buildMetadata} from "@/utils/seo";
import {NAVIGATION_URL} from "@/constants/navigation";
import {proposalList, PAGE_TITLE_TEXT, priceDataSource} from "@/app/uslugi/tehnicheskoye-obsluzhivaniye-far/constants";

const META_PAGE = META.tehObsluzhivaniye;

export const metadata = buildMetadata({
    title: META_PAGE.title,
    description: META_PAGE.description,
    path: NAVIGATION_URL.tehObsluzhivaniye,
});

const Page = () => (
    <ServiceLandingPage
        serviceKey="tehObsluzhivaniye"
        headText={PAGE_TITLE_TEXT.title}
        description={PAGE_TITLE_TEXT.description}
        priceTitle={PAGE_TITLE_TEXT.priceTitle}
        proposalList={proposalList}
        priceDataSource={priceDataSource}
        metaDescription={META_PAGE.description}
    />
);

export default Page;
