export interface  PriceDataSourceInterface {
    serviceName: string;
    price: string;
}

export interface CustomTableProps {
    priceDataSource: PriceDataSourceInterface[];
}