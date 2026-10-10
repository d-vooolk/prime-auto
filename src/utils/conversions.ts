/*
  Конверсии для своего счётчика (src/lib/stats.ts, админка → «Конверсии»).
  Клики по ссылкам (телефон, мессенджеры, карта) ловит PageViewTracker сам;
  заявку и открытие формы отправляют компоненты через trackConversion.
*/

export type ConversionType = "lead" | "lead_open" | "phone" | "telegram" | "viber" | "whatsapp" | "instagram" | "map";

const LINK_TYPES: [RegExp, ConversionType][] = [
    [/^tel:/i, "phone"],
    [/^https?:\/\/t\.me\//i, "telegram"],
    [/^viber:/i, "viber"],
    [/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i, "whatsapp"],
    [/^https?:\/\/(www\.)?instagram\.com\//i, "instagram"],
    [/^https?:\/\/(yandex\.[a-z]+\/maps|share\.google|maps\.google|www\.google\.[a-z]+\/maps)/i, "map"],
];

export const conversionForLink = (href: string): ConversionType | null =>
    LINK_TYPES.find(([pattern]) => pattern.test(href))?.[1] ?? null;

export const trackConversion = (type: ConversionType) => {
    if (typeof window === "undefined") return;
    const body = JSON.stringify({
        type,
        path: window.location.pathname,
        width: window.innerWidth,
        touch: navigator.maxTouchPoints > 1,
    });
    if (!navigator.sendBeacon?.("/api/ev", new Blob([body], {type: "application/json"}))) {
        fetch("/api/ev", {method: "POST", body, keepalive: true, headers: {"Content-Type": "application/json"}}).catch(() => {});
    }
};
