import type {NextRequest} from "next/server";

/** IP посетителя: за nginx он в X-Real-IP (см. docs/deploy.md) */
export const clientIp = (request: NextRequest): string =>
    request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? "0.0.0.0";

/*
  Простой ограничитель частоты в памяти процесса: счётчик просмотров и
  оценки статей — открытые адреса, их можно накручивать скриптом.
  60 запросов в минуту с одного IP живому человеку не нужны.
*/
const hits = new Map<string, {count: number; until: number}>();

export const rateLimited = (key: string, limit = 60, windowMs = 60_000): boolean => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.until < now) {
        hits.set(key, {count: 1, until: now + windowMs});
        if (hits.size > 5000) for (const [k, v] of hits) if (v.until < now) hits.delete(k);
        return false;
    }
    entry.count += 1;
    return entry.count > limit;
};
