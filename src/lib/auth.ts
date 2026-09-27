import crypto from "node:crypto";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {cache} from "react";
import {getDb, getSetting, setSetting} from "./db";
// Формат хеша описан один раз в password.mjs — оттуда же его берёт
// scripts/admin.mjs, которым пароль сбрасывают на сервере.
import {checkPasswordStrength, hashPassword, verifyPassword} from "./password.mjs";

/**
 * Вход в админку — по одному паролю, без логина.
 *
 * Админку ведёт один человек, поэтому пользователей нет: есть пароль и
 * сессии. Устроено так же, как в vdf.by:
 *
 *   пароль  — scrypt со случайной солью; в базе и в коде только хеш;
 *   сессия  — 32 случайных байта в httpOnly-куке, в базе лежит её sha256.
 *
 * Пароль по умолчанию задан хешем ниже — открытым текстом его в репозитории
 * нет. После смены в настройках админки новый хеш хранится в базе и имеет
 * приоритет. Забытый пароль сбрасывается на сервере: npm run admin.
 */

export const ADMIN_COOKIE = "pa_admin";
const PASSWORD_KEY = "admin:password_hash";
const DEFAULT_PASSWORD_HASH =
    "scrypt$16384$8$1$837UYuSHhi14lUBxmzWlrw==$T/XQnYmaK3f786MhrdmHv0gAVRJirDUtbrN6DYUeaj9shzq+g/tSuTPhmTpJb8ggIDb861M2FQqKckDUO8TlHw==";

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
/** Сессии ссылаются на пользователя — заводим одного служебного */
const ADMIN_LOGIN = "admin";

export interface AdminUser {
    id: number;
}

const passwordHash = (): string => getSetting(PASSWORD_KEY) || DEFAULT_PASSWORD_HASH;

const adminUserId = (): number => {
    const db = getDb();
    const row = db.prepare("SELECT id FROM users WHERE login = ?").get(ADMIN_LOGIN) as {id: number} | undefined;
    if (row) return row.id;
    return Number(
        db.prepare("INSERT INTO users (login, password_hash, created_at) VALUES (?, '', ?)").run(ADMIN_LOGIN, Date.now())
            .lastInsertRowid,
    );
};

/* ------------------------------------------------------------------ */
/* Защита от подбора                                                   */
/* ------------------------------------------------------------------ */

/*
  Считаем попытки и по адресу, и все вместе: по адресу — чтобы один человек
  с опечатками не блокировал вход всем, общий счётчик — чтобы перебор с
  тысячи адресов упирался в тот же предел.
*/
const attempts = new Map<string, number[]>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const LIMIT_PER_IP = 10;
const LIMIT_TOTAL = 50;

const recent = (key: string): number[] => {
    const list = (attempts.get(key) ?? []).filter((time) => Date.now() - time < ATTEMPT_WINDOW_MS);
    attempts.set(key, list);
    return list;
};

const hashToken = (token: string): string => crypto.createHash("sha256").update(token).digest("hex");

export type LoginResult = {ok: true} | {ok: false; error: string};

/** Проверяет пароль и ставит куку. Вызывается из Server Action. */
export const login = async (password: string, userAgent: string, ip: string): Promise<LoginResult> => {
    const ipKey = `ip:${ip || "?"}`;
    if (recent(ipKey).length >= LIMIT_PER_IP || recent("all").length >= LIMIT_TOTAL) {
        return {ok: false, error: "Слишком много попыток. Подождите 15 минут."};
    }

    if (!verifyPassword(password, passwordHash())) {
        for (const key of [ipKey, "all"]) recent(key).push(Date.now());
        return {ok: false, error: "Неверный пароль"};
    }
    attempts.delete(ipKey);

    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = Date.now() + SESSION_MS;
    const db = getDb();
    const userId = adminUserId();
    db.prepare(
        `INSERT INTO sessions (token_hash, user_id, created_at, expires_at, user_agent)
         VALUES (?, ?, ?, ?, ?)`,
    ).run(hashToken(token), userId, Date.now(), expiresAt, userAgent.slice(0, 300));
    db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(Date.now(), userId);
    // Заодно подчищаем протухшие сессии — отдельная задача ради этого не нужна
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());

    (await cookies()).set(ADMIN_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: new Date(expiresAt),
    });
    return {ok: true};
};

export const logout = async (): Promise<void> => {
    const store = await cookies();
    const token = store.get(ADMIN_COOKIE)?.value;
    if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    store.delete(ADMIN_COOKIE);
};

/**
 * Смена пароля из настроек. Остальные сессии закрываются: смена пароля
 * должна выкидывать того, кто мог войти со старым. Текущая остаётся.
 */
export const changePassword = async (current: string, next: string): Promise<LoginResult> => {
    if (!verifyPassword(current, passwordHash())) return {ok: false, error: "Текущий пароль указан неверно"};
    const weak = checkPasswordStrength(next);
    if (weak) return {ok: false, error: weak};

    setSetting(PASSWORD_KEY, hashPassword(next));
    const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
    getDb().prepare("DELETE FROM sessions WHERE token_hash != ?").run(hashToken(token));
    return {ok: true};
};

/**
 * Текущий администратор или null. В react cache: за один рендер функцию
 * дёргают и layout, и страница — запрос к базе при этом один.
 */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
    const token = (await cookies()).get(ADMIN_COOKIE)?.value;
    if (!token) return null;

    const row = getDb()
        .prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash = ?")
        .get(hashToken(token)) as {user_id: number; expires_at: number} | undefined;
    if (!row) return null;
    if (row.expires_at < Date.now()) {
        getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
        return null;
    }
    return {id: row.user_id};
});

/**
 * Обязательная проверка перед любым действием админки. proxy.ts её не
 * заменяет: Server Actions и route handlers — обычные POST-адреса, до них
 * можно достучаться в обход интерфейса.
 */
export const requireAdmin = async (): Promise<AdminUser> => {
    const admin = await getAdmin();
    if (!admin) redirect("/admin/login");
    return admin;
};
