import React from 'react';
import {ServicePageTitleContainerProps} from "@/components/_HelperComponents/ServicePageTitleContainer/types";
import './styles.css';
import Breadcrumbs from "@/components/_HelperComponents/Breadcrumbs/Breadcrumbs";

const ServicePageTitleContainer = ({ headText, description }: ServicePageTitleContainerProps) => {
    return (
        <div className="service-page-title-container-wrapper">
            <Breadcrumbs />
            <h1 className="service-page-title-container-head-text">{ headText }</h1>
            <h2 className="service-page-title-container-description">{ description }</h2>
        </div>
    )
}

export default ServicePageTitleContainer;