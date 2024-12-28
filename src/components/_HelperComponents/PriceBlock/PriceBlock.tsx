'use client'

import React from "react";
import './styles.css';
import {PriceBlockProps} from "@/components/_HelperComponents/PriceBlock/types";
import CustomTable from "@/components/_HelperComponents/CustomTable/CustomTable";

const PriceBlock = ({title, priceDataSource, withoutHeader = false}: PriceBlockProps) => {
    return (
        <div className="price-block-wrapper">
            {
                !withoutHeader && (
                    <>
                        <h2 className="price-block-upper-title">Стоимость работ</h2>
                        <h2 className="price-block-under-title">{title.toUpperCase()}</h2>
                    </>
                )
            }

            <CustomTable
                priceDataSource={priceDataSource}
            />
        </div>
    )
}

export default PriceBlock;