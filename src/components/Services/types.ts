export interface CardInfoItem {
    title: string;
    list: string[];
}

export interface CardInfoInterface {
    [type: string]: CardInfoItem;
}