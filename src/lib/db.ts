import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import {env} from "./env.mjs";
import {openDatabase} from "./migrations.mjs";
import {seedLegacyArticles} from "./legacy-articles";

/**
 * Подключение к базе.
 *
 * SQLite, потому что на сайте мастерской нагрузки на отдельную СУБД нет:
 * десятки статей и одна админка. Файл читается за микросекунды, бэкап — это
 * копирование одного файла.
 *
 * Файл: ./var/prime-auto.db (или DATABASE_PATH). Папка var/ не в репозитории.
 * Оба процесса blue-green запускаются из одного каталога приложения, поэтому
 * видят одну и ту же базу, и деплой её не трогает.
 */

export const DB_PATH = env("DATABASE_PATH", path.join(process.cwd(), "var", "prime-auto.db"));

/*
  В dev Next перезагружает модули на каждое изменение файла. Без этого
  тайника каждая перезагрузка открывала бы новое соединение.
*/
const globalForDb = globalThis as unknown as {__primeDb?: Database.Database};

export const getDb = (): Database.Database => {
    if (globalForDb.__primeDb) return globalForDb.__primeDb;

    fs.mkdirSync(path.dirname(DB_PATH), {recursive: true});
    const db = openDatabase(Database, DB_PATH);
    seedLegacyArticles(db);

    globalForDb.__primeDb = db;
    return db;
};

export const getSetting = (key: string): string | undefined => {
    const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
        | {value: string}
        | undefined;
    return row?.value;
};

export const setSetting = (key: string, value: string | null): void => {
    if (value === null) {
        getDb().prepare("DELETE FROM settings WHERE key = ?").run(key);
        return;
    }
    getDb()
        .prepare(
            `INSERT INTO settings (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        )
        .run(key, value);
};
