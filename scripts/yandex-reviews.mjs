#!/usr/bin/env node
/*
  Обновляет отзывы и рейтинг с Яндекс Карт: node scripts/yandex-reviews.mjs

  Забирает страницу отзывов карточки мастерской, достаёт из неё рейтинг,
  число оценок и отзывов и последние ~50 отзывов, кладёт всё в
  src/constants/yandexReviews.json. Сайт берёт отзывы оттуда при сборке —
  в браузере к Яндексу ничего не ходит, и текст отзывов лежит в HTML страницы.

  На сайт попадают только отзывы на 5 звёзд и длиннее 100 символов: короткое
  «всё супер» читателю ничего не говорит. Рейтинг при этом честный — общий, с
  карточки. Ответы мастерской не сохраняем.

  Запускать раз в месяц-два, проверить diff и выкатить. Если Яндекс ответил
  капчей, скрипт падает и файл не трогает.
*/
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src", "constants", "yandexReviews.json");
const ORG_URL = "https://yandex.by/maps/org/praym_avto/191443735649/";
const MIN_LENGTH = 100;

const response = await fetch(`${ORG_URL}reviews/`, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    "Accept-Language": "ru-RU,ru;q=0.9",
  },
});
const html = await response.text();

const pick = (pattern) => {
  const match = html.match(pattern);
  if (!match) throw new Error(`Не нашёл ${pattern} — возможно, Яндекс отдал капчу (HTTP ${response.status})`);
  return Number(match[1]);
};

const rating = pick(/"ratingValue":([\d.]+)/);
const ratings = pick(/"ratingCount":(\d+)/);
const reviewsCount = pick(/"reviewCount":(\d+)/);

const start = html.indexOf('"reviewResults":');
if (start < 0) throw new Error("В странице нет блока reviewResults");
const decoder = (() => {
  // JSON.parse не умеет читать с позиции — ищем конец объекта по балансу скобок
  const from = start + '"reviewResults":'.length;
  let depth = 0;
  let inString = false;
  for (let i = from; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) return JSON.parse(html.slice(from, i + 1));
  }
  throw new Error("Не удалось разобрать reviewResults");
})();

const reviews = decoder.reviews
  .filter((item) => item.rating === 5 && item.text && item.text.trim().length >= MIN_LENGTH)
  .map((item) => ({
    id: item.reviewId,
    name: item.author?.name?.trim() || "Клиент",
    date: item.updatedTime.slice(0, 10),
    rating: item.rating,
    text: item.text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim(),
  }))
  .sort((a, b) => b.date.localeCompare(a.date));

const data = {
  url: ORG_URL,
  checkedAt: new Date().toISOString().slice(0, 10),
  rating,
  ratings,
  reviewsCount,
  reviews,
};

fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
console.log(`Рейтинг ${rating}, оценок ${ratings}, отзывов ${reviewsCount}; на сайт — ${reviews.length} отзывов → ${path.relative(ROOT, OUT)}`);
