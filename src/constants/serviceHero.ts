/**
 * Первый экран страниц услуг: фото, короткий лид и три факта.
 *
 * Длинный SEO-текст страницы (PAGE_TITLE_TEXT.description в constants.ts
 * услуги) остаётся на странице целиком — блоком «Об услуге» ниже, а здесь
 * то, что человек должен понять за пять секунд: что делаем, сколько стоит,
 * сколько ждать. Цифры — из прайсов страниц и «Фактов, которые должны быть
 * везде одинаковыми» в docs/seo-plan.md: меняются цены — правьте и здесь.
 *
 * Фото сгенерированы (Leonardo AI) и лежат в public/images/services —
 * заменить на свои снимки можно, не трогая код, тем же именем файла.
 */
import {NAVIGATION_URL} from "./navigation";

export interface ServiceFact {
    value: string;
    label: string;
}

export interface ServiceHeroData {
    image: string;
    imageAlt: string;
    /** 1–2 предложения под заголовком */
    lead: string;
    facts: ServiceFact[];
}

export const SERVICE_HERO: Record<string, ServiceHeroData> = {
    [NAVIGATION_URL.remont]: {
        image: '/images/services/remont-far.webp',
        imageAlt: 'Мастер ремонтирует разобранную фару на верстаке',
        lead: 'Чиним фары, когда новая — дорого или не нужна: стекло, трещины корпуса и крепления, LED и ДХО, ' +
            'запотевание. Смету называем после осмотра, до начала работ.',
        facts: [
            {value: '150–200 руб.', label: 'разборка и сборка фары'},
            {value: '1–2 дня', label: 'ремонт с разборкой'},
            {value: '4 руб./см', label: 'сварка трещин корпуса'},
        ],
    },
    [NAVIGATION_URL.zamenaStekla]: {
        image: '/images/services/zamena-stekla-fary.webp',
        imageAlt: 'Фара на верстаке перед заменой стекла',
        lead: 'Меняем мутное, сколотое или разбитое стекло фары на новое: фара снова прозрачная и герметичная — ' +
            'без покупки новой фары.',
        facts: [
            {value: '150–200 руб.', label: 'работа: разборка и сборка'},
            {value: '1–2 дня', label: 'герметик полимеризуется'},
            {value: 'Проверка', label: 'на герметичность перед выдачей'},
        ],
    },
    [NAVIGATION_URL.remontLed]: {
        image: '/images/services/remont-led-far-i-dho.webp',
        imageAlt: 'Пайка светодиодной платы дневных ходовых огней фары',
        lead: 'Чиним светодиодные фары и ДХО: платы и светодиоды, драйверы и блоки, световоды, адаптив и матрицу — ' +
            'с диагностикой и кодированием после ремонта.',
        facts: [
            {value: 'от 100 руб.', label: 'ремонт ДХО'},
            {value: 'за день', label: 'ДХО и электрика обычно'},
            {value: '50 руб.', label: 'диагностика прибором'},
        ],
    },
    [NAVIGATION_URL.polirovkaOkleyka]: {
        image: '/images/services/polirovka-far.webp',
        imageAlt: 'Полировка пожелтевшей фары полировальной машинкой',
        lead: 'Возвращаем прозрачность пожелтевшим и мутным фарам и защищаем их полиуретановой плёнкой, ' +
            'чтобы результат держался годами.',
        facts: [
            {value: 'от 150 руб.', label: 'полировка двух фар'},
            {value: 'от 150 руб.', label: 'оклейка плёнкой двух фар'},
            {value: '1 день', label: 'полировка с оклейкой'},
        ],
    },
    [NAVIGATION_URL.zapotevaniye]: {
        image: '/images/services/ustranenie-zapotevaniya.webp',
        imageAlt: 'Конденсат внутри фары автомобиля',
        lead: 'Находим, откуда в фару попадает влага, переуплотняем её на новом герметике и проверяем ' +
            'на герметичность — чтобы конденсат не вернулся.',
        facts: [
            {value: '150–200 руб.', label: 'переуплотнение фары'},
            {value: '1–2 дня', label: 'с полимеризацией герметика'},
            {value: 'Проверка', label: 'на герметичность перед выдачей'},
        ],
    },
    [NAVIGATION_URL.regulirovka]: {
        image: '/images/services/regulirovka-far.webp',
        imageAlt: 'Свет фар на настроечной стене со светотеневой границей',
        lead: 'Настраиваем свет фар на стене по ГОСТ при вас: машина светит на дорогу, а не в глаза встречным. ' +
            'Основные и противотуманные фары.',
        facts: [
            {value: '50 руб.', label: 'регулировка, с подкрылков — от 70'},
            {value: '15 минут', label: 'машина ждёт при вас'},
            {value: 'По ГОСТ', label: 'на настроечной стене'},
        ],
    },
    [NAVIGATION_URL.tehObsluzhivaniye]: {
        image: '/images/services/to-far.webp',
        imageAlt: 'Мастер меняет лампу в фаре под капотом',
        lead: 'Замена ламп и блоков розжига, регулировка света и мелкий ремонт фар — быстро и с проверкой ' +
            'результата на стене.',
        facts: [
            {value: 'от 50 руб.', label: 'замена ламп и блоков розжига'},
            {value: '50 руб.', label: 'регулировка света по ГОСТ'},
            {value: '15 минут', label: 'регулировка при вас'},
        ],
    },
    [NAVIGATION_URL.uluchsheniyeKachestvaSveta]: {
        image: '/images/services/retrofit-far.webp',
        imageAlt: 'Фары после ретрофита со светящимися линзами',
        lead: 'Ставим в фары Bi-Led модули и би-линзы вместо штатного света: яркий свет с чёткой светотеневой ' +
            'границей, который не слепит встречных.',
        facts: [
            {value: 'от 50 руб.', label: 'установка модуля в фару'},
            {value: '1–2 дня', label: 'с разборкой фары'},
            {value: 'от 2 лет', label: 'гарантия на модули'},
        ],
    },
    [NAVIGATION_URL.biled]: {
        image: '/images/services/ustanovka-biled.webp',
        imageAlt: 'Bi-Led модули на верстаке перед установкой в фару',
        lead: 'Устанавливаем Bi-Led модули в фары: подбираем под вашу фару, ставим с правильной светотеневой ' +
            'границей и регулируем на стене. Гарантия на модули — от 2 лет.',
        facts: [
            {value: 'от 50 руб.', label: 'установка модуля в фару'},
            {value: '1–2 дня', label: 'с разборкой фары'},
            {value: 'от 2 лет', label: 'гарантия на модули'},
        ],
    },
};

export const USLUGI_HERO_IMAGE = '/images/services/uslugi.webp';
