export interface SendLeadToBotParamsInterface {
    name: string;
    phone: string;
    message: string;
    /** Страница, с которой отправлена заявка */
    page?: string;
    /** Откуда пришёл на сайт */
    source?: string;
    /** Фото фары — data URL (JPEG), до трёх */
    photos?: string[];
}