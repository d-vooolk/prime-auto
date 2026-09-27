import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp, {type Metadata} from "sharp";
import {imageSize} from "./article-body";
import {env} from "./env.mjs";

/**
 * Фотографии статей: обложки и картинки в тексте.
 *
 * Лежат в var/uploads — рядом с базой, вне репозитория и вне каталогов
 * сборки, поэтому переживают деплой и одинаково видны обоим процессам
 * blue-green. Раздаёт их src/app/uploads/[...path]/route.ts.
 *
 * Каждая картинка при загрузке пересобирается в WebP шириной до 1600 px:
 * фото с телефона весит 5–10 МБ, а статье хватает 150–300 КБ. Имя файла —
 * хеш содержимого плюс размеры: повторная загрузка того же фото не плодит
 * копий, а размеры страница берёт прямо из адреса и заранее резервирует
 * место под картинку — без скачка вёрстки.
 */

export const UPLOADS_DIR = env("UPLOADS_DIR", path.join(process.cwd(), "var", "uploads"));
export const UPLOADS_URL = "/uploads";

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_WIDTH = 1600;
const ACCEPTED = new Set(["jpeg", "png", "webp", "avif", "gif", "heif", "tiff"]);

export class UploadError extends Error {}

export interface SavedImage {
    url: string;
    width: number;
    height: number;
}

export const saveImage = async (input: Buffer): Promise<SavedImage> => {
    if (!input.length) throw new UploadError("Файл пустой");
    if (input.length > MAX_BYTES) throw new UploadError("Файл больше 25 МБ");

    let metadata: Metadata;
    try {
        metadata = await sharp(input).metadata();
    } catch {
        throw new UploadError("Это не картинка или формат не поддерживается — нужен JPG, PNG, WebP или HEIC");
    }
    if (!metadata.format || !ACCEPTED.has(metadata.format)) {
        throw new UploadError(`Формат ${metadata.format ?? "?"} не поддерживается — нужен JPG, PNG, WebP или HEIC`);
    }

    // rotate() без аргументов поворачивает по EXIF: иначе фото с телефона ложатся набок
    const {data, info} = await sharp(input)
        .rotate()
        .resize({width: MAX_WIDTH, withoutEnlargement: true})
        .webp({quality: 82})
        .toBuffer({resolveWithObject: true});

    const hash = crypto.createHash("sha256").update(data).digest("hex").slice(0, 16);
    const now = new Date();
    const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
    const name = `${hash}-${info.width}x${info.height}.webp`;
    const dir = path.join(UPLOADS_DIR, folder);
    fs.mkdirSync(dir, {recursive: true});
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) fs.writeFileSync(file, data);

    return {url: `${UPLOADS_URL}/${folder}/${name}`, width: info.width, height: info.height};
};

const SEGMENT = /^[a-z0-9-]+(?:\.webp)?$/i;

/** Файл по сегментам адреса или null. Любые «..» и посторонние символы отсекаются */
export const uploadFile = (segments: string[]): string | null => {
    if (!segments.length || segments.length > 4 || !segments.every((part) => SEGMENT.test(part))) return null;
    if (!segments[segments.length - 1].endsWith(".webp")) return null;
    const file = path.join(UPLOADS_DIR, ...segments);
    if (!file.startsWith(path.resolve(UPLOADS_DIR) + path.sep)) return null;
    return fs.existsSync(file) ? file : null;
};

export const isUploadUrl = (url: string): boolean => url.startsWith(`${UPLOADS_URL}/`) && imageSize(url) !== null;
