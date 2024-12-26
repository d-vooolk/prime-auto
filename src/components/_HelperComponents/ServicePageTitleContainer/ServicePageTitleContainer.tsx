import React from 'react';
import {ServicePageTitleContainerProps} from "@/components/_HelperComponents/ServicePageTitleContainer/types";
import './styles.css';

const ServicePageTitleContainer = ({ headText, description }: ServicePageTitleContainerProps) => {
    return (
        <div className="service-page-title-container-wrapper">
            <h1 className="service-page-title-container-head-text">{ headText }</h1>
            <h2 className="service-page-title-container-description">{ description }</h2>
        </div>
    )
}

export default ServicePageTitleContainer;