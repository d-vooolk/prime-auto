import {NextResponse, type NextRequest} from "next/server";
import {deviceOf, isBot, minskDay, normalizePath, recordView, sourceOf, visitorId} from "@/lib/stats";
import {clientIp, rateLimited} from "@/lib/request-meta";

/*
  Приём просмотра от src/components/PageViewTracker. Ответ всегда 204 —
  браузеру он не нужен (уходит через sendBeacon), а отличать «засчитали /
  не засчитали» снаружи незачем.
*/
export const dynamic = "force-dynamic";

const SITE_HOST = "prime-auto.by";

interface Payload {
    path?: string;
    referrer?: string;
    width?: number;
    touch?: boolean;
    entry?: boolean;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
}

const str = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

export const POST = async (request: NextRequest) => {
    const done = new NextResponse(null, {status: 204});
    const ua = request.headers.get("user-agent") ?? "";
    const ip = clientIp(request);
    if (isBot(ua) || rateLimited(`pv:${ip}`)) return done;

    let payload: Payload;
    try {
        payload = JSON.parse(await request.text()) as Payload;
    } catch {
        return done;
    }
    const path = normalizePath(str(payload.path, 300));
    if (!path) return done;

    const utmSource = str(payload.utmSource, 60);
    const utmMedium = str(payload.utmMedium, 60);
    const {source, host} = sourceOf(str(payload.referrer, 500), utmSource, utmMedium, SITE_HOST);

    try {
        recordView({
            path,
            visitor: visitorId(ip, ua, minskDay()),
            entry: Boolean(payload.entry),
            source,
            referrer: host,
            utm: [utmSource, utmMedium, str(payload.utmCampaign, 60)].filter(Boolean).join(" / "),
            device: deviceOf(ua, Number(payload.width) || 0, Boolean(payload.touch)),
        });
    } catch (error) {
        console.error("[pv]", (error as Error).message);
    }
    return done;
};
