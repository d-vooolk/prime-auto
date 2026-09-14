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
                        {/* Надпись над заголовком — декоративная. Раньше это был такой же
                      h2/h3, и в оглавлении страницы появлялся бессмысленный
                      обрывок: на главной 9 из 20 заголовков были такими. Класс
                      задаёт размер, вес и отступы сам, поэтому смена тега
                      внешний вид не меняет. */}
                        <div className="price-block-upper-title">Стоимость работ</div>
                        <h2 className="price-block-under-title">{title}</h2>
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