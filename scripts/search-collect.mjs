#!/usr/bin/env node
/*
  Снимок поисковой статистики в базу: node scripts/search-collect.mjs

  Search Console, Вебмастер и Метрика (src/lib/seo-collect.mjs) за последние
  28 дней и предыдущие 28 — одной записью на день в search_snapshots. Вкладка
  «Поиск» в админке показывает свежий снимок. Хранятся 30 последних дней.

  На сервере — cron раз в сутки (нужен node 20, на котором собран
  better-sqlite3). Ключи: var/gsc-key.json и var/yandex-token.txt.
*/
import path from "node:path";
import {fileURLToPath} from "node:url";
import Database from "better-sqlite3";
import {env} from "../src/lib/env.mjs";
import {openDatabase} from "../src/lib/migrations.mjs";
import {collectSearch, isoDay} from "../src/lib/seo-collect.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SECRETS = env("SEO_SECRETS_DIR", path.join(ROOT, "var"));
const DB = env("DATABASE_PATH", path.join(ROOT, "var", "prime-auto.db"));

const data = await collectSearch({
  gscKeyFile: path.join(SECRETS, "gsc-key.json"),
  yandexTokenFile: path.join(SECRETS, "yandex-token.txt"),
});

const problems = ["google", "webmaster", "metrika"].filter((key) => !data[key]?.ok);
const db = openDatabase(Database, DB);
const day = isoDay(Date.now());
db.prepare(
  `INSERT INTO search_snapshots (day, collected_at, data) VALUES (?, ?, ?)
   ON CONFLICT(day) DO UPDATE SET collected_at = excluded.collected_at, data = excluded.data`,
).run(day, Date.now(), JSON.stringify(data));
db.prepare("DELETE FROM search_snapshots WHERE day < ?").run(isoDay(Date.now() - 30 * 86400000));
db.close();

console.log(`${new Date().toISOString()} снимок за ${day}${problems.length ? `, ошибки: ${problems.join(", ")}` : ", всё собрано"}`);
if (problems.length === 3) process.exit(1);
