import React from "react";
import {META} from "@/constants/metadata";
import ServicePageTitleContainer
    from "@/components/_HelperComponents/ServicePageTitleContainer/ServicePageTitleContainer";
import './styles.css';
import {PAGE_TITLE_TEXT} from "@/app/uslugi/constants";
import Portfolio from "@/components/Portfolio/Portfolio";
import FormBlock from "@/components/FormBlock/FormBlock";
import Services from "@/components/Services/Services";

export const metadata = {...META.uslugi, robots: String(META.uslugi.robots)}

const LightQuality = () => {
    return (
        <div className="light-quality-page-wrapper">
            <ServicePageTitleContainer
                headText={PAGE_TITLE_TEXT.title}
                description={PAGE_TITLE_TEXT.description}
            />

            <Services withoutHeader />

            <Portfolio/>
            <FormBlock/>
        </div>
    )
}

export default LightQuality;