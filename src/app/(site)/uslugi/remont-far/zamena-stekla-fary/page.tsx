import React from "react";
import {META} from "@/constants/metadata";
import ServiceLandingPage from "@/components/ServiceLandingPage/ServiceLandingPage";
import {buildMetadata} from "@/utils/seo";
import ZamenaSteklaExtra from "@/app/(site)/uslugi/remont-far/zamena-stekla-fary/extra";
import {NAVIGATION_URL} from "@/constants/navigation";
import {proposalList, PAGE_TITLE_TEXT, priceDataSource, SERVICE, BEFORE_AFTER} from "@/app/(site)/uslugi/remont-far/zamena-stekla-fary/constants";

const META_PAGE = META.zamenaStekla;

export const metadata = buildMetadata({
    title: META_PAGE.title,
    description: META_PAGE.description,
    path: NAVIGATION_URL.zamenaStekla,
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
        beforeAfter={BEFORE_AFTER}
        extra={<ZamenaSteklaExtra />}
    />
);

export default Page;
