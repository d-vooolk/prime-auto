export const LINKS = {
    instagram: 'https://www.instagram.com/prime_auto_minsk/',
    telegram: 'https://t.me/primeautominsk',
    viber: 'viber://chat?number=%2B375336655449',
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
    /* Профиль на агрегаторе onlix.by — там ищут «ремонт фар в минске онликс» */
    onlix: 'https://onlix.by/companies/prime-auto',
    /*
      Карточки в справочниках (docs/links-and-catalogs.md) — тоже в sameAs:
      одни и те же название, адрес и телефон на разных площадках плюс обратная
      ссылка на сайт помогают поисковику связать их с одной организацией.
      2ГИС — постоянный адрес карточки, без параметров карты.
    */
    twoGis: 'https://2gis.by/minsk/firm/70000001118557262',
    idriver: 'https://idriver.by/4892-ooo-pervyy-avtosvet',
    spravka: 'https://spravka.by/avtoatele/prajm-avto-remont-far',
    forsage: 'https://forsage.by/service/sto/15021-praym-avto-minsk-card/',
    /*
      Магазин VDF.BY — тот же владелец. Товары (стёкла, модули) ведём туда,
      услуги — сюда; на vdf.by у товаров обратные ссылки на наши услуги.
    */
    vdfGlass: 'https://vdf.by/catalog/stekla-far/',
    vdfBiled: 'https://vdf.by/catalog/bi-led-moduli/',
    vdfFrames: 'https://vdf.by/catalog/perehodnye-ramki/',
}
