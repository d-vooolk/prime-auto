import React from "react";
import {META} from "@/constants/metadata";
import ServicePageTitleContainer
    from "@/components/_HelperComponents/ServicePageTitleContainer/ServicePageTitleContainer";
import './styles.css';
import {PAGE_TITLE_TEXT, priceDataSource} from "@/app/price/constants";
import Portfolio from "@/components/Portfolio/Portfolio";
import FormBlock from "@/components/FormBlock/FormBlock";
import PriceBlock from "@/components/_HelperComponents/PriceBlock/PriceBlock";

export const metadata = {...META.price, robots: String(META.price.robots)}

const LightQuality = () => {
    return (
        <div className="light-quality-page-wrapper">
            <ServicePageTitleContainer
                headText={PAGE_TITLE_TEXT.title}
                description={PAGE_TITLE_TEXT.description}
            />
            <PriceBlock
                title={PAGE_TITLE_TEXT.priceTitle}
                priceDataSource={priceDataSource}
                withoutHeader
            />
            <Portfolio/>
            <FormBlock/>
        </div>
    )
}

export default LightQuality;