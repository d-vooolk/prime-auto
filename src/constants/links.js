export const LINKS = {
    instagram: 'https://www.instagram.com/prime_auto_minsk/',
    facebook: 'https://www.facebook.com/profile.php?id=61558468265260',
    tiktok: 'https://www.tiktok.com/@prime_auto_minsk',
    youTube: 'https://www.youtube.com/@prime-auto-minsk',
    /*
      Канонический адрес карточки организации в Яндекс.Картах: в пути лежит
      постоянный ID компании (191443735649). Раньше здесь была короткая ссылка
      вида /maps/-/CHQcfJiy — она ведёт на точку на карте, а не на карточку,
      и для sameAs/hasMap годится хуже: поисковику нужен именно адрес сущности.
      Параметры ?ll=&z= убраны — это состояние камеры, к организации не относится.
    */
    yandexMap: 'https://yandex.by/maps/org/praym_avto/191443735649/',
    /*
      Карточка в Google Business Profile. Вместе с яндексовой уходит в sameAs
      микроразметки организации: для локального бизнеса связь сайта с двумя
      картографическими сущностями весит больше, чем ссылки на соцсети.
    */
    googleBusiness: 'https://share.google/sXDdDf0UyPz8lXxl2',
}
