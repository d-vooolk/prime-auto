import React from "react";
import './styles.css';
import {META} from "@/constants/metadata";
import ServiceLandingPage from "@/components/ServiceLandingPage/ServiceLandingPage";
import {buildMetadata} from "@/utils/seo";
import {withRating} from "@/constants/yandexReviews";
import BiledExtra from "@/app/(site)/uslugi/uluchshenie-kachestva-sveta/ustanovka-biled-moduley-minsk/extra";
import {NAVIGATION_URL} from "@/constants/navigation";
import {lightQualityProposalList, PAGE_TITLE_TEXT, priceDataSource, BEFORE_AFTER} from "@/app/(site)/uslugi/uluchshenie-kachestva-sveta/ustanovka-biled-moduley-minsk/constants";

const META_PAGE = META.biled;

export const generateMetadata = () => buildMetadata({
    title: META_PAGE.title,
    description: withRating(META_PAGE.description),
    path: NAVIGATION_URL.biled,
});

const Page = () => (
    <ServiceLandingPage
        serviceKey="biled"
        headText={PAGE_TITLE_TEXT.title}
        description={PAGE_TITLE_TEXT.description}
        priceTitle={PAGE_TITLE_TEXT.priceTitle}
        proposalList={lightQualityProposalList}
        priceDataSource={priceDataSource}
        metaDescription={META_PAGE.description}
        extra={<BiledExtra />}
        beforeAfter={BEFORE_AFTER}
    />
);

export default Page;
