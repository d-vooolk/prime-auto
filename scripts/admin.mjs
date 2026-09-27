#!/usr/bin/env node
/**
 * Сброс пароля админки — на случай, если пароль забыт.
 *
 *   npm run admin                         спросит новый пароль скрытым вводом
 *   npm run admin -- --password …         без вопросов (для скриптов)
 *   npm run admin -- --default            вернуть пароль по умолчанию
 *
 * Обычно пароль меняют в самой админке (Настройки). Консоль — для случая,
 * когда войти уже нельзя. Все открытые сессии при сбросе закрываются.
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {fileURLToPath} from "node:url";
import Database from "better-sqlite3";
import {openDatabase} from "../src/lib/migrations.mjs";
import {env} from "../src/lib/env.mjs";
import {checkPasswordStrength, hashPassword} from "../src/lib/password.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB_PATH = env("DATABASE_PATH", path.join(ROOT, "var", "prime-auto.db"));
// Ключ тот же, что в src/lib/auth.ts
const PASSWORD_KEY = "admin:password_hash";

function arg(name) {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? process.argv[index + 1] : undefined;
}

/** Ввод пароля без отображения на экране */
function askPassword(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({input: process.stdin, output: process.stdout, terminal: true});
        // readline печатает каждый введённый символ — пароль на экране не нужен
        const output = rl.output;
        let muted = false;
        rl._writeToOutput = (text) => {
            if (!muted || text.includes(question)) output.write(text);
        };
        rl.question(question, (answer) => {
            rl.close();
            output.write("\n");
            resolve(answer);
        });
        muted = true;
    });
}

fs.mkdirSync(path.dirname(DB_PATH), {recursive: true});
const db = openDatabase(Database, DB_PATH);

if (process.argv.includes("--default")) {
    db.prepare("DELETE FROM settings WHERE key = ?").run(PASSWORD_KEY);
} else {
    const provided = arg("password");
    const password = provided ?? (await askPassword("Новый пароль: "));
    if (!provided && (await askPassword("Ещё раз: ")) !== password) {
        console.error("\n[admin] Пароли не совпали.\n");
        process.exit(1);
    }
    const weak = checkPasswordStrength(password);
    if (weak) {
        console.error(`\n[admin] ${weak}\n`);
        process.exit(1);
    }
    db.prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    ).run(PASSWORD_KEY, hashPassword(password));
}

const closed = db.prepare("DELETE FROM sessions").run().changes;
console.log(
    `[admin] пароль ${process.argv.includes("--default") ? "возвращён к паролю по умолчанию" : "изменён"}` +
        (closed ? `, закрыто сессий: ${closed}` : "") +
        ". Вход: /admin",
);
db.close();
