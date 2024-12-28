import {PriceDataSourceInterface} from "@/components/_HelperComponents/CustomTable/types";

export interface PriceBlockProps {
    title: string;
    priceDataSource: PriceDataSourceInterface[];
    withoutHeader?: boolean;
}