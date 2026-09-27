import {NextResponse, type NextRequest} from "next/server";

/**
 * Быстрая отсечка неавторизованных на подступах к админке.
 *
 * Здесь только проверка наличия куки, без базы. Настоящая проверка сессии —
 * requireAdmin() / getAdmin() внутри каждой страницы, действия и обработчика:
 * этот файл — удобство, а не рубеж безопасности. Витрины он не касается,
 * иначе её страницы стали бы динамическими.
 */

const COOKIE = "pa_admin";

export function proxy(request: NextRequest) {
    const {pathname} = request.nextUrl;
    const signedIn = Boolean(request.cookies.get(COOKIE)?.value);
    const isLogin = pathname.startsWith("/admin/login");

    if (!signedIn && !isLogin) {
        if (pathname.startsWith("/admin/api/")) {
            return NextResponse.json({error: "Нужно войти заново"}, {status: 401});
        }
        return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
