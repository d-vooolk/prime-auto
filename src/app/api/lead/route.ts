import {NextResponse, type NextRequest} from "next/server";
import {env} from "@/lib/env.mjs";
import {clientIp, rateLimited} from "@/lib/request-meta";

/*
  Заявка из формы → раздел «Заявки» в CRM (crm.prime-auto.by), в Telegram заявки не уходят:
  браузер шлёт сюда, а мы пересылаем в CRM с общим ключом — ключ не попадает в браузер.
  CRM_LEADS_KEY в .env.local сайта = SITE_LEADS_KEY в .env CRM. Ключа нет — пересылка выключена.
*/
export const dynamic = "force-dynamic";

const CRM_URL = env("CRM_LEADS_URL", "https://crm.prime-auto.by/api/integrations/site/leads");
const MAX_PHOTOS = 3;
// Фото уже сжаты в браузере до ~200 КБ; в base64 с запасом
const MAX_PHOTO_LENGTH = 4_000_000;

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export const POST = async (request: NextRequest) => {
    const key = env("CRM_LEADS_KEY", "");
    if (!key) return NextResponse.json({success: false, reason: "disabled"}, {status: 503});
    if (rateLimited(`lead:${clientIp(request)}`, 10)) return NextResponse.json({success: false}, {status: 429});

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({success: false}, {status: 400});
    }

    const name = text(body.name, 200);
    const phone = text(body.phone, 50);
    if (!name || phone.replace(/\D/g, "").length < 7) return NextResponse.json({success: false}, {status: 400});

    const photos = (Array.isArray(body.photos) ? body.photos : [])
        .filter((p): p is string => typeof p === "string" && p.startsWith("data:image/") && p.length <= MAX_PHOTO_LENGTH)
        .slice(0, MAX_PHOTOS);

    try {
        const response = await fetch(CRM_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json", "x-integration-key": key},
            body: JSON.stringify({
                name,
                phone,
                message: text(body.message, 5000),
                page: text(body.page, 500),
                source: text(body.source, 500),
                photos,
            }),
            signal: AbortSignal.timeout(20_000),
        });
        if (!response.ok) {
            console.error("CRM: заявка не принята", response.status, await response.text().catch(() => ""));
            return NextResponse.json({success: false}, {status: 502});
        }
        return NextResponse.json({success: true});
    } catch (error) {
        console.error("CRM: заявка не отправлена", error);
        return NextResponse.json({success: false}, {status: 502});
    }
};
