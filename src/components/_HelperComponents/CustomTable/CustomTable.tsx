import React from "react";
import './styles.css';
import {CustomTableProps, PriceDataSourceInterface} from "@/components/_HelperComponents/CustomTable/types";

const CustomTable = ({ priceDataSource }: CustomTableProps) => {
    return (
        <div className="custom-table-wrapper">
            <div className="custom-table-row-first custom-table-row">
                <div className="custom-table-service-name">УСЛУГА</div>
                <div className="custom-table-service-price">СТОИМОСТЬ, РУБ</div>
            </div>

            {
                priceDataSource.map(({ serviceName, price }: PriceDataSourceInterface) => (
                    <div className="custom-table-row" key={`${serviceName}-${Math.random()*Math.random()}`}>
                        <div className="custom-table-service-name">{ serviceName }</div>
                        <div className="custom-table-service-price">{ price }</div>
                    </div>
                ))
            }
        </div>
    )
}

export default CustomTable;