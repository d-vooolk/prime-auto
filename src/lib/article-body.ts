import {toSlug} from "./slug";

/**
 * Текст статьи — упрощённый Markdown, одинаковый у нейросети, в админке и
 * на сайте:
 *
 *   ## Заголовок раздела        ### Подзаголовок
 *   абзацы через пустую строку  **жирный**, [ссылка](/uslugi/remont-far)
 *   - пункт списка              1. шаг инструкции
 *   | таблица | ... |           > совет или предупреждение
 *
 * Полноценный Markdown-парсер здесь не нужен: разметку пишет нейросеть по
 * жёсткому шаблону, а всё, чего в шаблоне нет, должно показываться текстом,
 * а не превращаться в HTML.
 */

export type ArticleBlock =
    | {type: "h2" | "h3"; text: string; id: string}
    | {type: "p"; text: string}
    | {type: "tip"; text: string}
    | {type: "ul" | "ol"; items: string[]}
    | {type: "table"; head: string[]; rows: string[][]};

export type InlinePart =
    | {type: "text"; text: string}
    | {type: "bold"; text: string}
    | {type: "link"; text: string; href: string};

const HEADING_LINE = /^(#{2,3})\s+(.+)$/;
const LIST_ITEM = /^(?:[-*•]|\d+[.)])\s+(.+)$/;
const ORDERED_ITEM = /^\d+[.)]\s+/;
const TABLE_DIVIDER = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;
const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

const tableCells = (line: string): string[] =>
    line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());

const uniqueId = (text: string, taken: Set<string>): string => {
    const base = toSlug(text, 60) || "razdel";
    let id = base;
    for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
    taken.add(id);
    return id;
};

export const parseArticleBody = (body: string): ArticleBlock[] => {
    const lines = body.replace(/\r\n/g, "\n").split("\n");
    const blocks: ArticleBlock[] = [];
    const ids = new Set<string>();
    let paragraph: string[] = [];

    const flush = () => {
        if (paragraph.length) blocks.push({type: "p", text: paragraph.join(" ")});
        paragraph = [];
    };

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index].trim();
        if (!line) {
            flush();
            continue;
        }

        const heading = line.match(HEADING_LINE);
        if (heading) {
            flush();
            const text = heading[2].replace(/\*\*/g, "").trim();
            blocks.push({type: heading[1].length === 2 ? "h2" : "h3", text, id: uniqueId(text, ids)});
            continue;
        }

        if (line.startsWith(">")) {
            flush();
            const quote = [line.replace(/^>\s?/, "")];
            while (lines[index + 1]?.trim().startsWith(">")) {
                index += 1;
                quote.push(lines[index].trim().replace(/^>\s?/, ""));
            }
            blocks.push({type: "tip", text: quote.join(" ").trim()});
            continue;
        }

        if (line.startsWith("|") && TABLE_DIVIDER.test(lines[index + 1]?.trim() ?? "")) {
            flush();
            const head = tableCells(line);
            const rows: string[][] = [];
            index += 1;
            while (lines[index + 1]?.trim().startsWith("|")) {
                index += 1;
                rows.push(tableCells(lines[index]));
            }
            blocks.push({type: "table", head, rows});
            continue;
        }

        const item = line.match(LIST_ITEM);
        if (item) {
            flush();
            const ordered = ORDERED_ITEM.test(line);
            const items = [item[1]];
            while (lines[index + 1] !== undefined) {
                const nextLine = lines[index + 1].trim();
                const next = nextLine.match(LIST_ITEM);
                if (!next || ORDERED_ITEM.test(nextLine) !== ordered) break;
                index += 1;
                items.push(next[1]);
            }
            blocks.push({type: ordered ? "ol" : "ul", items});
            continue;
        }

        paragraph.push(line);
    }

    flush();
    return blocks;
};

export const parseInline = (text: string): InlinePart[] => {
    const parts: InlinePart[] = [];
    let cursor = 0;
    for (const match of text.matchAll(INLINE)) {
        const start = match.index ?? 0;
        if (start > cursor) parts.push({type: "text", text: text.slice(cursor, start)});
        if (match[1] !== undefined) parts.push({type: "bold", text: match[1]});
        else parts.push({type: "link", text: match[2], href: match[3]});
        cursor = start + match[0].length;
    }
    if (cursor < text.length) parts.push({type: "text", text: text.slice(cursor)});
    return parts;
};

export const inlineText = (text: string): string =>
    parseInline(text).map((part) => part.text).join("");

const blockTexts = (blocks: ArticleBlock[]): string[] =>
    blocks.flatMap((block) => {
        switch (block.type) {
            case "ul":
            case "ol":
                return block.items;
            case "table":
                return [...block.head, ...block.rows.flat()];
            default:
                return [block.text];
        }
    });

export const articlePlainText = (body: string): string =>
    blockTexts(parseArticleBody(body)).map(inlineText).join("\n");

export const articleLinks = (body: string): string[] =>
    blockTexts(parseArticleBody(body)).flatMap((text) =>
        parseInline(text).flatMap((part) => (part.type === "link" ? [part.href] : [])),
    );

export const readingMinutes = (body: string): number => {
    const words = articlePlainText(body).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 180));
};

/**
 * Куски текста между пустыми строками. На них режется статья, когда
 * нужно переписать только неуникальные места, не трогая остальное.
 */
export const bodyChunks = (body: string): string[] =>
    body.replace(/\r\n/g, "\n").split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean);
