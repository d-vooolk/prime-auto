/**
 * Кейсы — конкретные машины и что с ними сделали.
 *
 * Показываются на странице «Наши работы» (/raboty), на страницах услуг
 * (подходящие по услуге) и на страницах марок (по марке). Для страниц марок
 * кейс с фото — то самое уникальное содержимое, которого им не хватало:
 * пара «марка + услуга», у которой есть кейс с фото, открывается для индекса
 * (src/utils/brandPages.ts).
 *
 * Откуда материал: фото — портфолио мастерской (на снимках подписаны машина
 * и работы) и фото из папки «картинки статей»; цитаты — реальные отзывы
 * клиентов с Яндекс Карт (имя, дата и текст как в карточке). Цены в кейсах
 * не пишем — их нет в источниках, а выдумывать нельзя.
 *
 * Как добавить кейс: фото в public/images/works или public/images/portfolio,
 * запись сюда. brand — slug из carBrands.ts (если марки там нет — null,
 * кейс будет только на /raboty).
 */
import {NAVIGATION_URL} from "./navigation";
import recent from "./cases-recent.json";

export type CaseService =
    | "biled" | "remont" | "zamenaStekla" | "remontLed" | "polirovkaOkleyka"
    | "zapotevaniye" | "regulirovka" | "uluchsheniyeKachestvaSveta" | "tehObsluzhivaniye";

/* Группы работ на странице «Наши работы» — по главной работе кейса */
export type CaseCluster = "biled" | "dho" | "zapotevanie" | "polirovka" | "remont";

export const CLUSTERS: {key: CaseCluster; title: string; description: string; href: string}[] = [
    {key: "biled", title: "Установка Bi-Led модулей", href: NAVIGATION_URL.biled,
        description: "Bi-Led вместо штатного света — чаще всего вместе с новыми стёклами или полировкой и защитной плёнкой."},
    {key: "dho", title: "Ремонт и пересвет ДХО", href: NAVIGATION_URL.remontLed,
        description: "Пожелтевшие, сгоревшие и мигающие дневные ходовые огни; пересвет в лимонный и оранжевый."},
    {key: "zapotevanie", title: "Устранение запотевания", href: NAVIGATION_URL.zapotevaniye,
        description: "Конденсат и вода в фаре: находим, откуда попадает влага, и возвращаем герметичность."},
    {key: "polirovka", title: "Полировка и оклейка плёнкой", href: NAVIGATION_URL.polirovkaOkleyka,
        description: "Мутные и пожелтевшие фары — полировка и защитная полиуретановая плёнка."},
    {key: "remont", title: "Ремонт фар", href: NAVIGATION_URL.remont,
        description: "Стёкла, корпуса, крепления, разборка и чистка изнутри."},
];

export const clusterOf = (item: {services: CaseService[]}): CaseCluster =>
    item.services.includes("biled") ? "biled"
        : item.services.includes("remontLed") ? "dho"
            : item.services.includes("zapotevaniye") ? "zapotevanie"
                : item.services.some((s) => s === "remont" || s === "zamenaStekla") ? "remont"
                    : item.services.includes("polirovkaOkleyka") ? "polirovka" : "remont";

export interface WorkCase {
    id: string;
    /** «BMW E60» */
    car: string;
    brand: string | null;
    title: string;
    /** Что было и что сделали — 1–2 предложения */
    text: string;
    services: CaseService[];
    photos: {src: string; alt: string}[];
    /** Фото — сгенерированная иллюстрация, а не наша работа: на карточке пометка */
    illustration?: boolean;
    quote?: {name: string; date: string; text: string};
}

export const SERVICE_TITLES: Record<CaseService, {title: string; href: string}> = {
    biled: {title: "Установка Bi-Led", href: NAVIGATION_URL.biled},
    remont: {title: "Ремонт фар", href: NAVIGATION_URL.remont},
    zamenaStekla: {title: "Замена стекла", href: NAVIGATION_URL.zamenaStekla},
    remontLed: {title: "Ремонт LED и ДХО", href: NAVIGATION_URL.remontLed},
    polirovkaOkleyka: {title: "Полировка и плёнка", href: NAVIGATION_URL.polirovkaOkleyka},
    zapotevaniye: {title: "Запотевание", href: NAVIGATION_URL.zapotevaniye},
    regulirovka: {title: "Регулировка", href: NAVIGATION_URL.regulirovka},
    uluchsheniyeKachestvaSveta: {title: "Ретрофит", href: NAVIGATION_URL.uluchsheniyeKachestvaSveta},
    tehObsluzhivaniye: {title: "ТО фар", href: NAVIGATION_URL.tehObsluzhivaniye},
};

/** Услуга кейса → услуга страниц марок (BRAND_SERVICES) */
export const BRAND_SERVICE_OF: Record<CaseService, string> = {
    biled: "biled",
    uluchsheniyeKachestvaSveta: "uluchsheniyeKachestvaSveta",
    remont: "remont",
    zamenaStekla: "remont",
    remontLed: "remont",
    polirovkaOkleyka: "polirovkaOkleyka",
    zapotevaniye: "zapotevaniye",
    regulirovka: "tehObsluzhivaniye",
    tehObsluzhivaniye: "tehObsluzhivaniye",
};

/* Работы из портфолио и кейсы по отзывам с Яндекса */
const OLDER_CASES: WorkCase[] = [
    {
        id: "bmw-e60-biled",
        car: "BMW E60",
        brand: "bmw",
        title: "Bi-Led, новые стёкла, маркеры и «ресницы»",
        text: "Полный апгрейд фар: Bi-Led модули вместо штатного света, новые стёкла, обновлённые маркеры и «ресницы».",
        services: ["biled", "zamenaStekla", "uluchsheniyeKachestvaSveta"],
        photos: [{src: "/images/portfolio/bmw-e60.webp", alt: "Фара BMW E60 после установки Bi-Led модулей: новые стёкла, маркеры и ресницы"}],
    },
    {
        id: "bmw-x1-biled",
        car: "BMW X1",
        brand: "bmw",
        title: "Bi-Led, новые стёкла и плёнка",
        text: "Модули Bi-Led вместо штатного света, новые стёкла и защитная плёнка поверх.",
        services: ["biled", "zamenaStekla", "polirovkaOkleyka"],
        photos: [{src: "/images/portfolio/bmw-x1.webp", alt: "Фара BMW X1 после установки Bi-Led модулей, замены стёкол и оклейки плёнкой"}],
    },
    {
        id: "bmw-g30-polirovka",
        car: "BMW G30",
        brand: "bmw",
        title: "Полировка и оклейка защитной плёнкой",
        text: "Отполировали фары и сразу оклеили защитной плёнкой — без неё полировка снова мутнеет за сезон-два.",
        services: ["polirovkaOkleyka"],
        photos: [{src: "/images/portfolio/bmw-g30.webp", alt: "Фара BMW G30 после полировки и оклейки защитной плёнкой"}],
    },
    {
        id: "bmw-g30-dho",
        car: "BMW G30",
        brand: "bmw",
        title: "Пересвет ДХО в лимонный цвет",
        text: "Пересветили дневные ходовые огни в лимонный цвет.",
        services: ["remontLed"],
        photos: [{src: "/images/works/bmw-g30-dho-limonnyy.webp", alt: "BMW G30 с ДХО, перешитыми в лимонный цвет"}],
    },
    {
        id: "bmw-e39-retrofit",
        car: "BMW E39 (дорестайлинг)",
        brand: "bmw",
        title: "Ретрофит дорестайлинговых фар",
        text: "Родные фары оказались не ремонтопригодны. Подобрали б/у фары в хорошем состоянии и уже в них " +
            "поставили Bi-Led модули, восстановили габариты и поворотники, отполировали и оклеили плёнкой.",
        services: ["uluchsheniyeKachestvaSveta", "biled", "polirovkaOkleyka"],
        photos: [{src: "/images/works/illustrations/bmw-e39-retrofit.webp", alt: "Иллюстрация: BMW E39"}],
        illustration: true,
        quote: {
            name: "Волат",
            date: "2024-08-31",
            text: "…если в других мастерских при словах, что у меня дорестовая bmw e39 я слышал отказ, здесь я услышал: " +
                "конечно приезжайте, разберёмся и сделаем красиво.",
        },
    },
    {
        id: "audi-a8-d3-biled",
        car: "Audi A8 D3",
        brand: "audi",
        title: "Bi-Led, новые стёкла и плёнка",
        text: "Заменили штатный свет на Bi-Led модули, поставили новые стёкла и закрыли их защитной плёнкой.",
        services: ["biled", "zamenaStekla", "polirovkaOkleyka"],
        photos: [{src: "/images/portfolio/audi-a8-d3.webp", alt: "Фара Audi A8 D3 после установки Bi-Led модулей, замены стёкол и оклейки плёнкой"}],
    },
    {
        id: "audi-q7-4m-dho",
        car: "Audi Q7 4M",
        brand: "audi",
        title: "Ремонт пожелтевших ДХО",
        text: "Дневные ходовые огни пожелтели. Восстановили ДХО — свет снова белый.",
        services: ["remontLed", "remont"],
        photos: [{src: "/images/works/audi-q7-4m-remont-dho-do-posle.webp", alt: "Ремонт пожелтевших ДХО Audi Q7 4M: до и после"}],
    },
    {
        id: "audi-a6-c5-upgrade",
        car: "Audi A6 C5",
        brand: "audi",
        title: "Полный апгрейд фар",
        text: "Восстановили корректор, поставили новые стёкла и Bi-Led модули, оклеили бронеплёнкой.",
        services: ["biled", "zamenaStekla", "remont", "polirovkaOkleyka"],
        photos: [{src: "/images/works/cases/audi-a6-c5-biled.webp", alt: "Audi A6 C5: установили bi-led модули, поставили новые стёкла, оклеили фары защитной плёнкой"}],
        quote: {
            name: "Rostislav Chepurnoy",
            date: "2026-09-24",
            text: "Восстановили корректор, поставили новые стекла, закатали в броне плёнку, все вывели как по заводу, " +
                "но внутри теперь жирная начинка и БиЛэд модули светят просто невероятно.",
        },
    },
    {
        id: "mercedes-slk-biled",
        car: "Mercedes SLK",
        brand: "mercedes-benz",
        title: "Bi-Led модули и новые стёкла",
        text: "Поставили Bi-Led модули и заменили помутневшие стёкла фар.",
        services: ["biled", "zamenaStekla"],
        photos: [{src: "/images/portfolio/mercedes-slk.webp", alt: "Mercedes SLK после установки Bi-Led модулей и замены стёкол фар"}],
    },
    {
        id: "volkswagen-tiguan-remont",
        car: "Volkswagen Tiguan I",
        brand: "volkswagen",
        title: "Ремонт стекла, корпуса и креплений",
        text: "Фара после повреждения: разбито стекло, треснул корпус, сломаны точки крепления. " +
            "Восстановили без покупки новой фары.",
        services: ["remont", "zamenaStekla"],
        photos: [{src: "/images/works/illustrations/volkswagen-tiguan-remont.webp", alt: "Иллюстрация: Volkswagen Tiguan"}],
        illustration: true,
        quote: {
            name: "ANATOLI YANKOUSKI",
            date: "2026-02-12",
            text: "Обратился с просьбой отремонтировать фару автомобиля Тигуан1 (повреждены стекло, корпус, точки крепления)… " +
                "восстановили фару прекрасно.",
        },
    },
    {
        id: "volkswagen-golf-7-biled",
        car: "Volkswagen Golf 7",
        brand: "volkswagen",
        title: "Установка Bi-Led модулей",
        text: "Заменили штатный свет на Bi-Led модули с правильной светотеневой границей.",
        services: ["biled"],
        photos: [{src: "/images/works/illustrations/volkswagen-golf-7-biled.webp", alt: "Иллюстрация: Volkswagen Golf 7"}],
        illustration: true,
        quote: {name: "Сергей Мащёнский", date: "2024-11-04", text: "Установили biled модули на гольф 7, получилось прекрасно, светом очень доволен."},
    },
    {
        id: "skoda-octavia-2004",
        car: "Skoda Octavia (2004)",
        brand: "skoda",
        title: "Восстановление головного света",
        text: "Головной свет со временем стал тусклым — восстановили свет фар.",
        services: ["remont", "uluchsheniyeKachestvaSveta"],
        photos: [{src: "/images/works/illustrations/skoda-octavia-2004.webp", alt: "Иллюстрация: Skoda Octavia"}],
        illustration: true,
        quote: {
            name: "Андрей Томилин",
            date: "2024-12-01",
            text: "Обратился со своей старушкой Шкода Октавия 2004 г., головной свет с течением времени стал не очень хорошим. " +
                "Сделали быстро и очень качественно, езжу и наслаждаюсь освещением дороги.",
        },
    },
    {
        id: "toyota-sienna-2021",
        car: "Toyota Sienna (2021)",
        brand: "toyota",
        title: "Китайские фары не проходили техосмотр",
        text: "Неоригинальные фары не регулировались по высоте и светили куда угодно. За три дня собрали рабочие " +
            "фары из разбитых оригинальных и китайских — техосмотр пройден.",
        services: ["remont", "regulirovka"],
        photos: [{src: "/images/works/illustrations/toyota-sienna-2021.webp", alt: "Иллюстрация: Toyota Sienna"}],
        illustration: true,
        quote: {
            name: "Alexandr Greschik",
            date: "2025-09-27",
            text: "Специалисты Прайм авто за 3 дня работы собрали трансформеры из разбитых оригинальных фар и этих ужасных китайских. " +
                "Свет стал вполне приемлемым, техосмотр прошел без проблем.",
        },
    },
    {
        id: "mazda-6-gj-biled",
        car: "Mazda 6 GJ",
        brand: "mazda",
        title: "Bi-Led, новые стёкла и ПТФ",
        text: "Поставили Bi-Led модули, заменили стёкла фар, обновили противотуманки — стёкла и лампы.",
        services: ["biled", "zamenaStekla"],
        photos: [{src: "/images/works/cases/mazda-6-biled.webp", alt: "Mazda 6: установили bi-led модули, поставили новые стёкла, оклеили фары защитной плёнкой"}],
        quote: {
            name: "Артур Бураченок",
            date: "2026-03-23",
            text: "Установили шикарный свет Bi Led, поменяли стекла в фарах — освещение улучшилось в несколько раз.",
        },
    },
    {
        id: "mazda-6-xenon-biled",
        car: "Mazda 6",
        brand: "mazda",
        title: "Замена ксенона на Bi-Led",
        text: "Штатный ксенон заменили на Bi-Led модули.",
        services: ["biled", "uluchsheniyeKachestvaSveta"],
        photos: [{src: "/images/works/illustrations/mazda-6-xenon-biled.webp", alt: "Иллюстрация: Mazda 6"}],
        illustration: true,
        quote: {name: "Oleg Shestakov", date: "2026-01-22", text: "У меня Mazda 6, менял Xenon на BI LED. Профессионально проконсультировали, работы выполнили очень качественно."},
    },
    {
        id: "hyundai-ix35",
        car: "Hyundai ix35",
        brand: "hyundai",
        title: "Замена фары, полировка и регулировка",
        text: "Заменили разбитую фару, отполировали и отрегулировали обе фары.",
        services: ["remont", "polirovkaOkleyka", "regulirovka"],
        photos: [{src: "/images/works/illustrations/hyundai-ix35.webp", alt: "Иллюстрация: Hyundai ix35"}],
        illustration: true,
        quote: {name: "Рома П.", date: "2026-10-02", text: "Замена фары, полировка и регулировка обоих фар заняла максимум 30 минут."},
    },
    {
        id: "lexus-gs-430-biled",
        car: "Lexus GS 430",
        brand: "lexus",
        title: "Bi-Led модули",
        text: "Поставили Bi-Led модули в фары Lexus GS.",
        services: ["biled"],
        photos: [{src: "/images/works/illustrations/lexus-gs-430-biled.webp", alt: "Иллюстрация: Lexus GS 430"}],
        illustration: true,
        quote: {name: "Тычко Виталий", date: "2026-09-04", text: "Ставил на Lexus GS 430 bi-led, работой очень доволен."},
    },
    {
        id: "honda-civic-zapotevanie",
        car: "Honda Civic",
        brand: "honda",
        title: "Вода в фаре и окисленная плата",
        text: "Фара была мокрой изнутри, плата окислилась. Устранили причину, восстановили плату и отполировали фару снаружи.",
        services: ["zapotevaniye", "remontLed", "polirovkaOkleyka"],
        photos: [{src: "/images/works/cases/honda-civic-zapotevanie.webp", alt: "Honda Civic: устранили запотевание фары"}],
        quote: {name: "Юлия", date: "2026-08-28", text: "Спасли фару Хонда цивик, мокрую изнутри. Спасли окисленую плату, отполировали снаружи — как новая теперь."},
    },
    {
        id: "subaru-forester-3-steklo",
        car: "Subaru Forester III",
        brand: "subaru",
        title: "Замена стёкол фар",
        text: "Заменили помутневшие стёкла фар на новые.",
        services: ["zamenaStekla"],
        photos: [{src: "/images/works/illustrations/subaru-forester-3-steklo.webp", alt: "Иллюстрация: Subaru Forester III"}],
        illustration: true,
        quote: {name: "EVGENIY V.", date: "2026-08-28", text: "Прекрасно выполненная работа по замене стекол фар Субару форестер 3."},
    },
    {
        id: "jaguar-xe-biled",
        car: "Jaguar XE",
        brand: null,
        title: "Bi-Led, новые стёкла и плёнка",
        text: "Bi-Led модули вместо штатного света, замена стёкол и защитная плёнка.",
        services: ["biled", "zamenaStekla", "polirovkaOkleyka"],
        photos: [{src: "/images/portfolio/jaguar-xe.webp", alt: "Фара Jaguar XE после установки Bi-Led модулей, замены стёкол и оклейки плёнкой"}],
    },
    {
        id: "dodge-challenger-portfolio",
        car: "Dodge Challenger",
        brand: null,
        title: "Bi-Led модули и подсветка колец",
        text: "Поставили Bi-Led модули и сделали подсветку колец.",
        services: ["biled", "uluchsheniyeKachestvaSveta"],
        photos: [{src: "/images/portfolio/dodge-challenger.webp", alt: "Фара Dodge Challenger после установки Bi-Led модулей с подсветкой колец"}],
    },
];

/*
  Последние работы — фото из папки «последние работы», подписи файла (марка,
  модель, список работ) разобраны скриптом в cases-recent.json. Три фото
  совпали с кейсами-отзывами (та же модель и работы) и стоят там.
*/
const ATTACHED_TO_REVIEWS = new Set(["audi-a6-c5-biled", "mazda-6-biled", "honda-civic-zapotevanie"]);

const recentTitle = (item: {services: string[]; text: string}): string => {
    const s = new Set(item.services);
    if (s.has("biled")) {
        return ["Bi-Led модули", s.has("zamenaStekla") && "новые стёкла",
            /отполировали и оклеили фары/.test(item.text) ? "полировка и плёнка" : /оклеили фары/.test(item.text) ? "плёнка" : /отполировали фары/.test(item.text) && "полировка",
            s.has("uluchsheniyeKachestvaSveta") && "доработка масок и ДХО"].filter(Boolean).join(", ");
    }
    const recolor = item.text.match(/пересветили ДХО в (\S+) цвет/);
    if (recolor) return `Пересвет ДХО в ${recolor[1]} цвет`;
    if (s.has("remontLed")) return /сгоревшие/.test(item.text) ? "Восстановление сгоревших ДХО" : "Ремонт ДХО";
    if (s.has("zapotevaniye")) return "Устранение запотевания";
    if (s.has("remont")) return "Чистка стекла фары изнутри";
    return "Полировка и оклейка плёнкой";
};

const RECENT_CASES: WorkCase[] = recent
    .filter((item) => !ATTACHED_TO_REVIEWS.has(item.id))
    .map((item) => ({
        id: item.id,
        car: item.car,
        brand: item.brand,
        title: recentTitle(item),
        text: item.text,
        services: item.services as CaseService[],
        photos: [{src: item.photo, alt: item.alt}],
    }));

/** Свежие работы — первыми */
export const CASES: WorkCase[] = [...RECENT_CASES, ...OLDER_CASES];

/** Кейсы с настоящими фото — вперёд, иллюстрации — после */
const photoRank = (c: WorkCase) => (c.photos.length && !c.illustration ? 2 : c.photos.length ? 1 : 0);
const byPhotos = (a: WorkCase, b: WorkCase) => photoRank(b) - photoRank(a);

/* На общей странице ремонта уместны и работы по стёклам, ДХО и запотеванию — это тоже ремонт фар */
const RELATED_SERVICES: Partial<Record<string, CaseService[]>> = {
    remont: ["remont", "zamenaStekla", "remontLed", "zapotevaniye"],
    uluchsheniyeKachestvaSveta: ["uluchsheniyeKachestvaSveta", "biled"],
};

export const casesForService = (service: CaseService | string, limit = 3): WorkCase[] => {
    const wanted = RELATED_SERVICES[service] ?? [service as CaseService];
    return CASES.filter((c) => c.services.some((s) => wanted.includes(s))).sort(byPhotos).slice(0, limit);
};

/** Кейсы марки: сначала по этой услуге страниц марок, потом остальные кейсы марки */
export const casesForBrand = (brandSlug: string, brandServiceKey?: string): WorkCase[] => {
    const list = CASES.filter((c) => c.brand === brandSlug);
    const matches = (c: WorkCase) => Boolean(brandServiceKey && c.services.some((s) => BRAND_SERVICE_OF[s] === brandServiceKey));
    return list.sort((a, b) => Number(matches(b)) - Number(matches(a)) || byPhotos(a, b));
};

/** Есть ли у пары «услуга марок + марка» кейс с фото — тогда страницу можно открыть для индекса */
export const hasPhotoCase = (brandServiceKey: string, brandSlug: string): boolean =>
    CASES.some((c) => c.brand === brandSlug && c.photos.length > 0 && !c.illustration
        && c.services.some((s) => BRAND_SERVICE_OF[s] === brandServiceKey));
