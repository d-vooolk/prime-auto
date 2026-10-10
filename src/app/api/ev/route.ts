import {NextResponse, type NextRequest} from "next/server";
import {deviceOf, isBot, isConversionType, minskDay, normalizePath, recordConversion, visitorId} from "@/lib/stats";
import {clientIp, rateLimited} from "@/lib/request-meta";

/* Конверсия от src/components/PageViewTracker: заявка, звонок, мессенджер. Ответ всегда 204 */
export const dynamic = "force-dynamic";

export const POST = async (request: NextRequest) => {
    const done = new NextResponse(null, {status: 204});
    const ua = request.headers.get("user-agent") ?? "";
    const ip = clientIp(request);
    if (isBot(ua) || rateLimited(`ev:${ip}`, 30)) return done;

    let payload: {type?: unknown; path?: unknown; width?: unknown; touch?: unknown};
    try {
        payload = JSON.parse(await request.text());
    } catch {
        return done;
    }
    const path = normalizePath(typeof payload.path === "string" ? payload.path : "");
    if (!path || !isConversionType(payload.type)) return done;

    try {
        recordConversion(
            payload.type,
            path,
            visitorId(ip, ua, minskDay()),
            deviceOf(ua, Number(payload.width) || 0, Boolean(payload.touch)),
        );
    } catch (error) {
        console.error("[ev]", (error as Error).message);
    }
    return done;
};
