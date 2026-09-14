import React from "react";
import './styles.css';
import {META} from "@/constants/metadata";
import ServicePageTitleContainer
    from "@/components/_HelperComponents/ServicePageTitleContainer/ServicePageTitleContainer";
import ContactsBlock from "@/components/ContactsBlock/ContactsBlock";
import OurProposalBlock from "@/components/_HelperComponents/OurProposalBlock/OurProposalBlock";
import FaqBlock from "@/components/_HelperComponents/FaqBlock/FaqBlock";
import Portfolio from "@/components/Portfolio/Portfolio";
import FormBlock from "@/components/FormBlock/FormBlock";
import {lightQualityProposalList, PAGE_TITLE_TEXT} from "@/app/contacts/constants";
import {CONTACTS_FAQ} from "@/constants/faq";
import {NAVIGATION_URL} from "@/constants/navigation";
import {buildMetadata} from "@/utils/seo";

export const metadata = buildMetadata({
    title: META.contacts.title,
    description: META.contacts.description,
    keywords: META.contacts.keywords,
    path: NAVIGATION_URL.contacts,
});

const ContactsPage = () => (
    <main className="light-quality-page-wrapper">
        <ServicePageTitleContainer
            headText={PAGE_TITLE_TEXT.title}
            description={PAGE_TITLE_TEXT.description}
            breadcrumbs={[
                {name: 'Главная', path: NAVIGATION_URL.home},
                {name: 'Контакты', path: NAVIGATION_URL.contacts},
            ]}
        />

        aksdk

        <ContactsBlock />
        <OurProposalBlock list={lightQualityProposalList} />

        <FaqBlock items={CONTACTS_FAQ} />

        <Portfolio/>
        <FormBlock/>
    </main>
);

export default ContactsPage;
