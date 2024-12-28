import React from "react";
import {META} from "@/constants/metadata";
import ServicePageTitleContainer
    from "@/components/_HelperComponents/ServicePageTitleContainer/ServicePageTitleContainer";
import './styles.css';
import OurProposalBlock from "@/components/_HelperComponents/OurProposalBlock/OurProposalBlock";
import {lightQualityProposalList, PAGE_TITLE_TEXT} from "@/app/contacts/constants";
import Portfolio from "@/components/Portfolio/Portfolio";
import FormBlock from "@/components/FormBlock/FormBlock";
import ContactsBlock from "@/components/ContactsBlock/ContactsBlock";

export const metadata = {...META.contacts, robots: String(META.contacts.robots)}

const LightQuality = () => {
    return (
        <div className="light-quality-page-wrapper">
            <ServicePageTitleContainer
                headText={PAGE_TITLE_TEXT.title}
                description={PAGE_TITLE_TEXT.description}
            />
            <ContactsBlock />
            <OurProposalBlock list={lightQualityProposalList} />
            <Portfolio/>
            <FormBlock/>
        </div>
    )
}

export default LightQuality;