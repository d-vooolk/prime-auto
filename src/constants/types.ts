/*
  keywords и robots из этого типа убраны.

  keywords: мета-тег keywords Google игнорирует с 2009 года, Яндекс — фактически
  тоже. Поле только создавало ощущение работы: его заполняли на каждой странице
  и генерировали по шаблону для 240 страниц марок.

  robots: значение ["index", "follow"] нигде не читалось — заголовок robots
  целиком собирает buildMetadata из флага noIndex.
*/
interface MetaParams {
    title: string;
    description: string;
}

export interface MetaParamsInterface {
    general: MetaParams,
    uslugi: MetaParams,
    lightQuality: MetaParams,
    contacts: MetaParams,
    price: MetaParams,
    polirovkaOkleyka: MetaParams,
    remont: MetaParams,
    tehObsluzhivaniye: MetaParams,
    zapotevaniye: MetaParams,
    biled: MetaParams,
}
