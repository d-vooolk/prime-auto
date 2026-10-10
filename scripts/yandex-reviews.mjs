#!/usr/bin/env node
/*
  Обновляет отзывы и рейтинг с Яндекс Карт.

    node scripts/yandex-reviews.mjs          → src/constants/yandexReviews.json
                                               (в репозиторий, запасные данные)
    node scripts/yandex-reviews.mjs --live   → var/yandex-reviews.json
                                               (на сервере, cron раз в неделю;
                                               сайт подхватывает за сутки без деплоя)

  Забирает страницу отзывов карточки мастерской, достаёт из неё рейтинг,
  число оценок и отзывов и последние ~50 отзывов. Сайт рендерит их на сервере —
  в браузере к Яндексу ничего не ходит, и текст отзывов лежит в HTML страницы.

  На сайт попадают только отзывы на 5 звёзд и длиннее 100 символов: короткое
  «всё супер» читателю ничего не говорит. Рейтинг при этом честный — общий, с
  карточки. Ответы мастерской не сохраняем.

  Если Яндекс ответил капчей или прислал подозрительно мало данных, скрипт
  падает и файл не трогает — на сайте остаются прошлые цифры.
*/
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {execFileSync} from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = process.argv.includes("--live");
const OUT = LIVE
  ? process.env.YANDEX_REVIEWS_FILE || path.join(ROOT, "var", "yandex-reviews.json")
  : path.join(ROOT, "src", "constants", "yandexReviews.json");
const ORG_URL = "https://yandex.by/maps/org/praym_avto/191443735649/";
const MIN_LENGTH = 100;

/*
  Страницу берём через curl, а не встроенным fetch: Яндекс узнаёт fetch Node
  по отпечатку TLS-соединения и отдаёт ему капчу, а curl пропускает (проверено
  с сервера 10.10.2026). curl есть и на сервере, и в Windows 10+.
*/
const html = execFileSync("curl", [
  "-sL", "--compressed", "--max-time", "60",
  "-A", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  "-H", "Accept-Language: ru-RU,ru;q=0.9",
  `${ORG_URL}reviews/`,
], {encoding: "utf8", maxBuffer: 50 * 1024 * 1024});

const pick = (pattern) => {
  const match = html.match(pattern);
  if (!match) throw new Error(`Не нашёл ${pattern} — возможно, Яндекс отдал капчу`);
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

// защита от полупустого ответа: не меняем хорошие данные на мусор
if (!(rating > 0 && rating <= 5) || ratings < 1 || reviews.length < 5) {
  throw new Error(`Подозрительный ответ: рейтинг ${rating}, оценок ${ratings}, отзывов на сайт ${reviews.length} — файл не тронут`);
}

const data = {
  url: ORG_URL,
  checkedAt: new Date().toISOString().slice(0, 10),
  rating,
  ratings,
  reviewsCount,
  reviews,
};

// через временный файл: сайт не прочитает наполовину записанный JSON
fs.mkdirSync(path.dirname(OUT), {recursive: true});
fs.writeFileSync(`${OUT}.tmp`, JSON.stringify(data, null, 2) + "\n");
fs.renameSync(`${OUT}.tmp`, OUT);
console.log(`${new Date().toISOString()} Рейтинг ${rating}, оценок ${ratings}, отзывов ${reviewsCount}; на сайт — ${reviews.length} отзывов → ${path.relative(ROOT, OUT)}`);
