/**
 * Отзывы и рейтинг мастерской с Яндекс Карт.
 *
 * Откуда данные. На сервере cron раз в неделю запускает
 * node scripts/yandex-reviews.mjs --live, и тот пишет свежие цифры и отзывы
 * в var/yandex-reviews.json (вне репозитория). Страницы перегенерируются раз
 * в сутки (revalidate в src/app/(site)/layout.js) и каждый раз перечитывают
 * этот файл — поэтому здесь функции, а не константы: модуль живёт в процессе
 * неделями, и значение, посчитанное при загрузке, так бы и осталось старым.
 * Если файла нет или он битый — берётся yandexReviews.json из репозитория.
 *
 * Здесь же
 * разметка отзывов по услугам: на странице ремонта первыми идут отзывы про
 * ремонт, на странице Bi-Led — про модули. Отзыв без явной услуги
 * («ребята молодцы») подходит для любой страницы и стоит после профильных.
 */
import fs from "node:fs";
import path from "node:path";
import bundled from "./yandexReviews.json";
import {NAVIGATION_URL} from "./navigation";
import {env} from "@/lib/env.mjs";

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

type ReviewsData = typeof bundled;

const LIVE_FILE = env("YANDEX_REVIEWS_FILE", path.join(process.cwd(), "var", "yandex-reviews.json"));

let cache: {mtime: number; data: ReviewsData} | null = null;

/** Свежие данные с сервера, если они есть и не старше тех, что в репозитории */
const loadData = (): ReviewsData => {
    try {
        const mtime = fs.statSync(LIVE_FILE).mtimeMs;
        if (cache?.mtime !== mtime) {
            const live = JSON.parse(fs.readFileSync(LIVE_FILE, "utf8")) as ReviewsData;
            if (!live.rating || !Array.isArray(live.reviews) || !live.reviews.length) throw new Error("пустой файл");
            cache = {mtime, data: live};
        }
        return cache.data.checkedAt >= bundled.checkedAt ? cache.data : bundled;
    } catch {
        return bundled;
    }
};

/** Адреса карточки — постоянные */
export const YANDEX_RATING = {
    url: bundled.url,
    reviewsUrl: `${bundled.url}reviews/`,
    /** Яндекс открывает форму отзыва по этому параметру */
    addReviewUrl: `${bundled.url}reviews/?add-review=true`,
};

/** Рейтинг и счётчики — читаются при каждой отрисовке */
export const getYandexStats = () => {
    const data = loadData();
    return {checkedAt: data.checkedAt, rating: data.rating, ratings: data.ratings, reviewsCount: data.reviewsCount};
};

export const getYandexReviews = (): YandexReview[] =>
    loadData().reviews.map((review) => ({...review, topics: topicsOf(review.text)}));

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
    const reviews = getYandexReviews();
    if (!topics.length && !mention) return reviews.slice(0, limit);
    const mentionLower = mention?.toLowerCase();
    const score = (review: YandexReview) => {
        if (mentionLower && review.text.toLowerCase().includes(mentionLower)) return -1;
        if (review.topics.some((topic) => topics.includes(topic))) return 0;
        return review.topics.length === 0 ? 1 : 2;
    };
    return reviews
        .sort((a, b) => score(a) - score(b) || b.date.localeCompare(a.date))
        .slice(0, limit);
};

/** 5 → «5,0»; 4.87 → «4,9» */
export const formatRating = (value: number) =>
    value.toLocaleString("ru-RU", {minimumFractionDigits: 1, maximumFractionDigits: 1});

/* склонение — в отдельном модуле без node:fs, его используют и клиентские компоненты */
import {plural} from "@/utils/plural";
export {plural};

export const formatReviewDate = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString("ru-RU", {day: "numeric", month: "long", year: "numeric"})
        .replace(/\s?г\.$/, "");

/**
 * Хвост description страницы с рейтингом Яндекса: звёзды и число оценок в
 * сниппете — самый простой способ выделиться среди агрегаторов. Цифры — из
 * того же файла, что и плашка, обновляются раз в неделю.
 */
export const withRating = (description: string): string => {
    const stats = getYandexStats();
    return `${description} Рейтинг ${formatRating(stats.rating)} на Яндекс Картах — ` +
        `${plural(stats.ratings, ["оценка", "оценки", "оценок"])}.`;
};
