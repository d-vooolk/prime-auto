export interface YandexApiInterface {
    apiKey: string;
    localization: string;
    getUrl: (key: string, loc: string) => string;
    center: number[];
    zoom: number;
    hintContent: string,
    balloonContent: string,
}