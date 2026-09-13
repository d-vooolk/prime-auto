import React from "react";
import type {Metadata} from "next";
import BrandServicePage from "@/components/BrandServicePage/BrandServicePage";
import {brandStaticParams, buildBrandPageMetadata, type BrandRouteParams} from "@/utils/brandPages";

const SERVICE_KEY = 'remont';

/** Страницы марок собираются на билде; чужие слаги отдают 404, а не бесконечный набор URL */
export const dynamicParams = false;

export const generateStaticParams = brandStaticParams;

export async function generateMetadata(
    {params}: {params: Promise<BrandRouteParams>},
): Promise<Metadata> {
    const {brand} = await params;

    return buildBrandPageMetadata(SERVICE_KEY, brand);
}

const Page = async ({params}: {params: Promise<BrandRouteParams>}) => {
    const {brand} = await params;

    return <BrandServicePage serviceKey={SERVICE_KEY} brandSlug={brand} />;
};

export default Page;
