/**
 * Отзывы и рейтинг мастерской с Яндекс Карт.
 *
 * Данные лежат в yandexReviews.json и обновляются скриптом
 * node scripts/yandex-reviews.mjs — руками JSON не правим. Здесь только
 * разметка отзывов по услугам: на странице ремонта первыми идут отзывы про
 * ремонт, на странице Bi-Led — про модули. Отзыв без явной услуги
 * («ребята молодцы») подходит для любой страницы и стоит после профильных.
 */
import data from "./yandexReviews.json";
import {NAVIGATION_URL} from "./navigation";

export type ReviewTopic =
    | "remont"
    | "steklo"
    | "led"
    | "biled"
    | "polirovka"
    | "zapotevanie"
    | "regulirovka";

export interface YandexReview {
    id: string;
    name: string;
    /** YYYY-MM-DD */
    date: string;
    rating: number;
    text: string;
    topics: ReviewTopic[];
}

const TOPIC_PATTERNS: Record<ReviewTopic, RegExp> = {
    remont: /ремонт|восстанов|трещин|корпус|креплени|разбит|корректор|каретк|адаптив|моргать|не горе|прекратила гореть/i,
    steklo: /стекл/i,
    led: /дхо|ресниц|светодиод|led-фар|плат[уаы]|матричн/i,
    biled: /bi[\s-]?led|би[\s-]?л[еэ]д|biled|линз|модул|ксенон|xenon|ретрофит|свет бомба|новый свет|хороший свет|шикарный свет/i,
    polirovka: /полир|отпол|отпорол|плёнк|пленк|бронеп/i,
    zapotevanie: /запотев|конденсат|мокр|влаг|вод[аы] в фар/i,
    regulirovka: /регулир|настроил|выставил/i,
};

const topicsOf = (text: string): ReviewTopic[] =>
    (Object.keys(TOPIC_PATTERNS) as ReviewTopic[]).filter((topic) => TOPIC_PATTERNS[topic].test(text));

export const YANDEX_RATING = {
    url: data.url,
    reviewsUrl: `${data.url}reviews/`,
    /** Яндекс открывает форму отзыва по этому параметру */
    addReviewUrl: `${data.url}reviews/?add-review=true`,
    checkedAt: data.checkedAt,
    rating: data.rating,
    ratings: data.ratings,
    reviewsCount: data.reviewsCount,
};

export const YANDEX_REVIEWS: YandexReview[] = data.reviews.map((review) => ({
    ...review,
    topics: topicsOf(review.text),
}));

/** Какие отзывы поднимать на странице услуги (ключ — адрес страницы) */
export const REVIEW_TOPICS_BY_PATH: Record<string, ReviewTopic[]> = {
    [NAVIGATION_URL.remont]: ["remont", "steklo", "led"],
    [NAVIGATION_URL.zamenaStekla]: ["steklo"],
    [NAVIGATION_URL.remontLed]: ["led"],
    [NAVIGATION_URL.polirovkaOkleyka]: ["polirovka"],
    [NAVIGATION_URL.regulirovka]: ["regulirovka"],
    [NAVIGATION_URL.zapotevaniye]: ["zapotevanie"],
    [NAVIGATION_URL.tehObsluzhivaniye]: ["zapotevanie", "polirovka", "regulirovka"],
    [NAVIGATION_URL.uluchsheniyeKachestvaSveta]: ["biled"],
    [NAVIGATION_URL.biled]: ["biled"],
};

/**
 * Отзывы для страницы: сначала с упоминанием марки (на страницах марок), потом
 * про эту услугу, потом общие, потом остальные; внутри группы — свежие выше.
 * Без услуги — просто самые свежие.
 */
export const reviewsFor = (topics: ReviewTopic[] = [], limit = 8, mention?: string): YandexReview[] => {
    if (!topics.length && !mention) return YANDEX_REVIEWS.slice(0, limit);
    const mentionLower = mention?.toLowerCase();
    const score = (review: YandexReview) => {
        if (mentionLower && review.text.toLowerCase().includes(mentionLower)) return -1;
        if (review.topics.some((topic) => topics.includes(topic))) return 0;
        return review.topics.length === 0 ? 1 : 2;
    };
    return [...YANDEX_REVIEWS]
        .sort((a, b) => score(a) - score(b) || b.date.localeCompare(a.date))
        .slice(0, limit);
};

/** 5 → «5,0»; 4.87 → «4,9» */
export const formatRating = (value: number) =>
    value.toLocaleString("ru-RU", {minimumFractionDigits: 1, maximumFractionDigits: 1});

/** 172 → «172 оценки», 109 → «109 отзывов» */
export const plural = (n: number, forms: [string, string, string]) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} ${forms[0]}`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${forms[1]}`;
    return `${n} ${forms[2]}`;
};

export const formatReviewDate = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString("ru-RU", {day: "numeric", month: "long", year: "numeric"})
        .replace(/\s?г\.$/, "");
