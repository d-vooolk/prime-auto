import React from 'react';
import {ServicePageTitleContainerProps} from "@/components/_HelperComponents/ServicePageTitleContainer/types";
import './styles.css';
import Breadcrumbs from "@/components/_HelperComponents/Breadcrumbs/Breadcrumbs";
import ListComponent from "@/components/_HelperComponents/ListComponent/ListComponent";
import JsonLd from "@/components/_HelperComponents/JsonLd/JsonLd";
import {breadcrumbJsonLd} from "@/utils/seo";

const ServicePageTitleContainer = ({
    headText,
    description,
    list,
    currentLabel,
    breadcrumbs,
}: ServicePageTitleContainerProps) => {
    return (
        <div className="service-page-title-container-wrapper">
            {breadcrumbs?.length ? <JsonLd data={breadcrumbJsonLd(breadcrumbs)} /> : null}

            <Breadcrumbs currentLabel={currentLabel} />
            <h1 className="service-page-title-container-head-text">{ headText }</h1>
            <div className="service-page-title-container-description">{ description }</div>

            {list?.length ? (
                <ListComponent
                    list={list}
                    className="service-page-title-container-list-item"
                    wrapperClassname="service-page-title-container-list"
                />
            ) : null}
        </div>
    )
}

export default ServicePageTitleContainer;
