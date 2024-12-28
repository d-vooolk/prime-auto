import React from "react";
import {META} from "@/constants/metadata";
import ServicePageTitleContainer
    from "@/components/_HelperComponents/ServicePageTitleContainer/ServicePageTitleContainer";
import './styles.css';
import OurProposalBlock from "@/components/_HelperComponents/OurProposalBlock/OurProposalBlock";
import Portfolio from "@/components/Portfolio/Portfolio";
import FormBlock from "@/components/FormBlock/FormBlock";
import PriceBlock from "@/components/_HelperComponents/PriceBlock/PriceBlock";
import {proposalList, PAGE_TITLE_TEXT, priceDataSource} from "@/app/uslugi/ustraneniye-zapotevaniya/constants";

export const metadata = {...META.lightQuality, robots: String(META.lightQuality.robots)}

const WindowWorks = () => {
    return (
        <div className="light-quality-page-wrapper">
            <ServicePageTitleContainer
                headText={PAGE_TITLE_TEXT.title}
                description={PAGE_TITLE_TEXT.description}
            />
            <OurProposalBlock list={proposalList} />
            <PriceBlock
                title={PAGE_TITLE_TEXT.priceTitle}
                priceDataSource={priceDataSource}
            />
            <Portfolio/>
            <FormBlock/>
        </div>
    )
}

export default WindowWorks;