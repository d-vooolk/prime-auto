#!/usr/bin/env node
/*
  AI-SEO по cron: node scripts/ai-seo-collect.mjs

  1. Логи nginx (все, что лежат: logrotate держит 14 дней) → ai_bot_hits:
     заходы ИИ-ботов по дням и страницам. Бот засчитывается, только если IP
     из его официального списка, а где списка нет — если с этого IP не было
     сканирования. Каждый полный день пересчитывается целиком, поэтому запуск
     можно повторять; сегодняшний день не пишем — он ещё не закончился.
  2. Свежий снимок поиска (search_snapshots) → ai_daily: сколько показов и
     кликов у вопросных запросов. Снимки живут 30 дней, а это — дольше.

  Логи: NGINX_LOG_DIR (по умолчанию /var/log/nginx; в контейнер tools он
  смонтирован только на чтение). С 29.10.2026 у сайта свой лог
  prime-auto.by.access.log; общий access.log (там же crm и zapis) читается
  для дней до переключения.
*/
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import readline from "node:readline";
import net from "node:net";
import {fileURLToPath} from "node:url";
import Database from "better-sqlite3";
import {env} from "../src/lib/env.mjs";
import {openDatabase} from "../src/lib/migrations.mjs";
import {isoDay} from "../src/lib/seo-collect.mjs";
import {AI_BOTS, BRAND_QUERY, botOf, isQuestion, parseLogLine, SCANNER_PATH, SITE_PATH, STATIC_PATH} from "../src/lib/ai-seo-shared.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB = env("DATABASE_PATH", path.join(ROOT, "var", "prime-auto.db"));
const LOG_DIR = env("NGINX_LOG_DIR", "/var/log/nginx");
const KEEP_DAYS = 800;

/* ---------- официальные IP ботов ---------- */

const toBig = (ip) => {
  if (net.isIPv4(ip)) return {v: 4, n: ip.split(".").reduce((acc, part) => (acc << 8n) + BigInt(part), 0n)};
  const [head, tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const parts = ip.includes("::") ? [...h, ...Array(8 - h.length - t.length).fill("0"), ...t] : h;
  return {v: 6, n: parts.reduce((acc, part) => (acc << 16n) + BigInt(parseInt(part || "0", 16)), 0n)};
};

const toRange = (cidr) => {
  const [ip, bits] = cidr.split("/");
  const {v, n} = toBig(ip);
  const size = v === 4 ? 32n : 128n;
  const shift = size - BigInt(bits);
  return {v, from: (n >> shift) << shift, to: ((n >> shift) << shift) + (1n << shift) - 1n};
};

const loadRanges = async (url) => {
  try {
    const response = await fetch(url, {headers: {"User-Agent": "prime-auto.by ai-seo"}, signal: AbortSignal.timeout(20_000)});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return (data.prefixes ?? []).map((p) => toRange(p.ipv4Prefix ?? p.ipv6Prefix)).filter(Boolean);
  } catch (error) {
    console.error(`список IP ${url}: ${error.message}`);
    return null;
  }
};

const official = new Map();
for (const bot of AI_BOTS.filter((b) => b.ips)) {
  const lists = await Promise.all(bot.ips.map(loadRanges));
  // список не скачался — проверяем этого бота так же, как ботов без списка
  if (lists.every(Boolean)) official.set(bot.id, lists.flat());
}

const inRanges = (ip, ranges) => {
  if (!net.isIP(ip)) return false;
  const {v, n} = toBig(ip);
  return ranges.some((r) => r.v === v && n >= r.from && n <= r.to);
};

/* ---------- логи ---------- */

// Свой лог сайта и общий: с 29.10.2026 запросы prime-auto.by пишутся только в свой,
// поэтому двойного счёта нет, а дни до переключения берутся из общего, пока он хранится
const logFiles = () => fs.readdirSync(LOG_DIR)
  .filter((name) => /^(prime-auto\.by\.)?access\.log(\.\d+(\.gz)?)?$/.test(name))
  .map((name) => path.join(LOG_DIR, name));

const lines = async function* (file) {
  const stream = fs.createReadStream(file);
  const input = file.endsWith(".gz") ? stream.pipe(zlib.createGunzip()) : stream;
  yield* readline.createInterface({input, crlfDelay: Infinity});
};

const scanners = new Set();
const candidates = [];
const seenDays = new Set();
for (const file of logFiles()) {
  for await (const line of lines(file)) {
    const hit = parseLogLine(line);
    if (!hit) continue;
    seenDays.add(hit.day);
    if (SCANNER_PATH.test(hit.path)) scanners.add(hit.ip);
    const bot = botOf(hit.ua);
    if (bot && SITE_PATH.test(hit.path) && !STATIC_PATH.test(hit.path) && hit.status < 400) candidates.push({...hit, bot: bot.id});
  }
}

const today = new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/Minsk"}).format(new Date());
const days = [...seenDays].filter((day) => day < today).sort();
const counts = new Map();
let fakes = 0;
for (const hit of candidates) {
  if (hit.day >= today) continue;
  const ranges = official.get(hit.bot);
  const real = ranges ? inRanges(hit.ip, ranges) : !scanners.has(hit.ip);
  if (!real) {
    fakes += 1;
    continue;
  }
  const key = `${hit.day}\t${hit.bot}\t${hit.path.toLowerCase().replace(/\/+$/, "") || "/"}`;
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

const db = openDatabase(Database, DB);
const existing = new Set(db.prepare("SELECT DISTINCT day FROM ai_bot_hits").all().map((r) => r.day));
// самый ранний день в логах может быть неполным (обрезан ротацией) — не затираем
// им уже записанный
const writable = days.filter((day, index) => index > 0 || !existing.has(day));
const writeBots = db.transaction(() => {
  const remove = db.prepare("DELETE FROM ai_bot_hits WHERE day = ?");
  for (const day of writable) remove.run(day);
  const insert = db.prepare("INSERT INTO ai_bot_hits (day, bot, path, hits) VALUES (?, ?, ?, ?)");
  for (const [key, n] of counts) {
    const [day, bot, page] = key.split("\t");
    if (writable.includes(day)) insert.run(day, bot, page, n);
  }
  // пустой день тоже отмечаем: «ботов не было» ≠ «не собирали»
  for (const day of writable) {
    if (![...counts.keys()].some((key) => key.startsWith(`${day}\t`))) insert.run(day, "-", "-", 0);
  }
  db.prepare("DELETE FROM ai_bot_hits WHERE day < ?").run(isoDay(Date.now() - KEEP_DAYS * 86400000));
});
writeBots();

/* ---------- вопросные запросы ---------- */

const snapshot = db.prepare("SELECT day, data FROM search_snapshots ORDER BY day DESC LIMIT 1").get();
if (snapshot) {
  const data = JSON.parse(snapshot.data);
  const sum = (rows) => {
    const total = {queries: 0, impressions: 0, clicks: 0};
    const questions = {queries: 0, impressions: 0, clicks: 0, top5: 0, top5Clicks: 0};
    for (const row of rows) {
      total.queries += 1;
      total.impressions += row.impressions;
      total.clicks += row.clicks;
      if (BRAND_QUERY.test(row.query) || !isQuestion(row.query)) continue;
      questions.queries += 1;
      questions.impressions += row.impressions;
      questions.clicks += row.clicks;
      // вопрос в топ-5, а кликов нет — ответ, скорее всего, дал сам поиск (нейроответ)
      if (row.position <= 5) {
        questions.top5 += row.impressions;
        questions.top5Clicks += row.clicks;
      }
    }
    return {total, questions};
  };
  const google = data.google?.ok
    ? sum((data.google.data.queries ?? []).map((r) => ({query: r.keys[0], impressions: r.impressions, clicks: r.clicks, position: r.position})))
    : null;
  const yandex = data.webmaster?.ok
    ? sum((data.webmaster.data.queries ?? []).filter((r) => r.indicators?.TOTAL_SHOWS).map((r) => ({
      query: r.query_text, impressions: r.indicators.TOTAL_SHOWS, clicks: r.indicators.TOTAL_CLICKS ?? 0, position: r.indicators.AVG_SHOW_POSITION,
    })))
    : null;
  db.prepare("INSERT INTO ai_daily (day, data) VALUES (?, ?) ON CONFLICT(day) DO UPDATE SET data = excluded.data")
    .run(snapshot.day, JSON.stringify({google, yandex}));
}
db.close();

console.log(`${new Date().toISOString()} ИИ-боты: дней ${writable.length} (${writable[0] ?? "—"} — ${writable.at(-1) ?? "—"}), `
  + `засчитано ${[...counts.values()].reduce((a, b) => a + b, 0)}, подделок отброшено ${fakes}; `
  + `списки IP: ${official.size}/${AI_BOTS.filter((b) => b.ips).length}; вопросы: ${snapshot ? snapshot.day : "нет снимка"}`);
