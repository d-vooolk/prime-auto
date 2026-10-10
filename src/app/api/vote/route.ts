import {NextResponse, type NextRequest} from "next/server";
import {isBot, minskDay, recordVote, visitorId} from "@/lib/stats";
import {getPublishedArticle} from "@/lib/articles";
import {clientIp, rateLimited} from "@/lib/request-meta";

/* Оценка «Статья полезна?» из блока под статьёй. Один голос на посетителя в день, можно передумать */
export const dynamic = "force-dynamic";

export const POST = async (request: NextRequest) => {
    const ua = request.headers.get("user-agent") ?? "";
    const ip = clientIp(request);
    if (isBot(ua) || rateLimited(`vote:${ip}`, 20)) return NextResponse.json({ok: false}, {status: 429});

    let body: {slug?: unknown; useful?: unknown};
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ok: false}, {status: 400});
    }
    const slug = typeof body.slug === "string" ? body.slug.slice(0, 120) : "";
    if (!slug || typeof body.useful !== "boolean" || !getPublishedArticle(slug)) {
        return NextResponse.json({ok: false}, {status: 400});
    }
    recordVote(slug, body.useful, visitorId(ip, ua, minskDay()));
    return NextResponse.json({ok: true});
};
