import {lookup} from "node:dns/promises";
import net from "node:net";
import {AiError, complete} from "./ai";

/**
 * Загрузка статьи конкурента по ссылке.
 *
 * Код скачивания взят из vdf.by (импорт товара с сайта-донора) как есть:
 * он уже умеет кодировки, перенаправления и не ходит во внутреннюю сеть
 * сервера — ссылку вставляет человек, и без этой проверки через форму можно
 * было бы читать локальные сервисы.
 *
 * Что на странице статья, а что меню, подвал и «читайте также», решает
 * нейросеть по пронумерованным строкам: универсальные эвристики на чужой
 * вёрстке ошибаются чаще.
 */

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const MAX_LINES = 900;
const MAX_LINE_LENGTH = 2000;
const TIMEOUT_MS = 20000;
const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

export class SourcePageError extends Error {}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  laquo: "«",
  raquo: "»",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  bull: "•",
  middot: "·",
  deg: "°",
  times: "×",
  minus: "−",
  plusmn: "±",
  copy: "©",
  reg: "®",
  trade: "™",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  bdquo: "„",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : Number(body.slice(1));
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : entity;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
  });
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function isPrivateAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const lower = address.toLowerCase();
  if (lower.startsWith("::ffff:")) return isPrivateAddress(lower.slice(7));
  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe8") ||
    lower.startsWith("fe9") ||
    lower.startsWith("fea") ||
    lower.startsWith("feb")
  );
}

export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new SourcePageError("Это не похоже на ссылку — скопируйте адрес страницы целиком");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SourcePageError("Нужна ссылка, которая начинается с http:// или https://");
  }
  const addresses = await lookup(url.hostname, { all: true }).catch(() => {
    throw new SourcePageError(`Сайт ${url.hostname} не найден`);
  });
  if (addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new SourcePageError("Эта ссылка ведёт во внутреннюю сеть — такие адреса не загружаются");
  }
  return url;
}

function charsetOf(contentType: string, head: string): string {
  const fromHeader = contentType.match(/charset=["']?([\w-]+)/i)?.[1];
  if (fromHeader) return fromHeader;
  return head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ?? "utf-8";
}

function decodeBody(bytes: Uint8Array, contentType: string): string {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 4096));
  const charset = charsetOf(contentType, head);
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

async function download(raw: string): Promise<{ url: string; html: string }> {
  let url = await assertPublicUrl(raw);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "ru-RU,ru;q=0.9",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      const name = (error as Error).name;
      throw new SourcePageError(
        name === "TimeoutError"
          ? "Сайт не ответил за 20 секунд"
          : `Не удалось открыть страницу: ${(error as { cause?: Error }).cause?.message ?? (error as Error).message}`,
      );
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new SourcePageError("Сайт прислал пустое перенаправление");
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new SourcePageError(
        response.status === 403
          ? "Сайт не пустил сервер (403) — возможно, у него защита от ботов"
          : `Сайт ответил ошибкой ${response.status}`,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !/html|xml/i.test(contentType)) {
      await response.body?.cancel();
      throw new SourcePageError("По ссылке не страница, а файл — нужна ссылка на страницу статьи");
    }
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) {
      await response.body?.cancel();
      throw new SourcePageError("Страница слишком большая");
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) throw new SourcePageError("Страница слишком большая");
    return { url: url.toString(), html: decodeBody(bytes, contentType) };
  }

  throw new SourcePageError("Слишком много перенаправлений");
}

function metaContent(html: string, property: string): string {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  return decodeEntities(html.match(pattern)?.[1] ?? "").trim();
}

const BLOCK_TAGS =
  "address|article|aside|blockquote|br|dd|details|div|dl|dt|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|summary|table|tbody|td|tfoot|th|thead|tr|ul";

function visibleLines(html: string): string[] {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe|head)\b[\s\S]*?<\/\1>/gi, " ")
    // Заголовки и пункты списков помечаем разметкой статьи: нейросети проще
    // увидеть структуру исходника, чем угадывать её по голым строкам.
    .replace(/<h2\b[^>]*>/gi, "\n## ")
    .replace(/<h3\b[^>]*>/gi, "\n### ")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(new RegExp(`<\\/?(?:${BLOCK_TAGS})\\b[^>]*>`, "gi"), "\n")
    .replace(/<[^>]+>/g, " ");

  const lines: string[] = [];
  for (const raw of decodeEntities(text).split("\n")) {
    const line = raw.replace(/\s+/g, " ").replace(/ ([.,;:!?)»])/g, "$1").trim();
    if (!line || /^(?:#{2,3}|-)$/.test(line)) continue;
    if (lines[lines.length - 1] === line) continue;
    lines.push(line.slice(0, MAX_LINE_LENGTH));
    if (lines.length >= MAX_LINES) break;
  }
  return lines;
}

export interface SourceArticle {
    url: string;
    title: string;
    text: string;
}

const EXTRACT_PROMPT = `Ты разбираешь страницу со статьёй. Тебе дают заголовок страницы и пронумерованные строки её видимого текста.

Найди основной текст статьи: заголовки разделов, абзацы, списки и таблицы внутри статьи. К статье НЕ относятся: меню, хлебные крошки, шапка и подвал сайта, формы заявки, кнопки, баннеры и акции, блоки «читайте также» и «похожие статьи», комментарии, контакты, куки-уведомления.

Ничего не переписывай и не придумывай. Верни только JSON без пояснений и без Markdown:
{"title": "заголовок статьи", "ranges": [[первая_строка, последняя_строка]]}`;

const parseExtract = (text: string): {title?: unknown; ranges?: unknown} => {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new AiError("Нейросеть не разобрала страницу — вставьте текст статьи вручную");
    try {
        return JSON.parse(text.slice(start, end + 1)) as {title?: unknown; ranges?: unknown};
    } catch {
        throw new AiError("Нейросеть не разобрала страницу — вставьте текст статьи вручную");
    }
};

const linesFromRanges = (ranges: unknown, lines: string[]): string[] => {
    if (!Array.isArray(ranges)) return [];
    const picked = new Set<number>();
    for (const range of ranges) {
        const [from, to] = Array.isArray(range) ? range.map(Number) : [Number(range), Number(range)];
        if (!Number.isInteger(from) || !Number.isInteger(to)) continue;
        for (let index = Math.max(1, Math.min(from, to)); index <= Math.min(lines.length, Math.max(from, to)); index += 1) {
            picked.add(index);
        }
    }
    return [...picked].sort((a, b) => a - b).map((index) => lines[index - 1]);
};

export const fetchSourceArticle = async (raw: string): Promise<SourceArticle> => {
    const {url, html} = await download(raw);
    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
    const pageTitle =
        (h1 && stripTags(h1)) ||
        metaContent(html, "og:title") ||
        stripTags(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const lines = visibleLines(html);
    if (lines.length < 5) {
        throw new SourcePageError("На странице не нашлось текста — возможно, сайт собирает её скриптами. Вставьте текст статьи вручную");
    }

    const answer = parseExtract(
        await complete(
            EXTRACT_PROMPT,
            [`Заголовок страницы: ${pageTitle}`, "", "Строки страницы:", lines.map((line, index) => `${index + 1}| ${line}`).join("\n")].join("\n"),
            "extract",
        ),
    );
    const text = linesFromRanges(answer.ranges, lines).join("\n\n").trim();
    if (text.length < 500) {
        throw new SourcePageError("Не получилось выделить текст статьи на странице — вставьте его вручную");
    }
    const title = typeof answer.title === "string" && answer.title.trim() ? answer.title.trim() : pageTitle;
    return {url, title: title.slice(0, 300), text};
};

