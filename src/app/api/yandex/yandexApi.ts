import {YandexApiInterface} from "@/app/api/yandex/interface";

const baseUrl = 'https://api-maps.yandex.ru/2.1/?';
const apiKeyUrl = "apikey=";
const langUrl = "lang=";

export const yandexApi: YandexApiInterface = {
    apiKey: '53e7d909-9f86-43f2-b80f-27d73bf8503b',
    localization: 'ru_RU',
    getUrl: (key: string, loc: string) => `${baseUrl}${apiKeyUrl}${key}&${langUrl}${loc}`,
    center: [53.871641, 27.523566],
    zoom: 16,
    hintContent: "Мы здесь",
    balloonContent: "Добро пожаловать в Prime Auto"
}