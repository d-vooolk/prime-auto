#!/usr/bin/env node
/*
  Видео-кейсы из шортсов YouTube-канала @prime-auto-minsk:
  node scripts/video-cases.mjs

  Берёт список из scripts/video-cases.source.json (что за машина и что
  сделали — из названия и описания ролика), докачивает с YouTube дату
  публикации и длительность, скачивает вертикальную обложку и сохраняет её
  в public/images/works/video/<videoId>.webp, результат пишет в
  src/constants/cases-video.json. Новый ролик — добавить строку в source и
  запустить скрипт ещё раз (уже скачанное не перекачивается).
*/
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "scripts", "video-cases.source.json");
const OUT = path.join(ROOT, "src", "constants", "cases-video.json");
const IMAGES = path.join(ROOT, "public", "images", "works", "video");

const pick = (text, re) => (text.match(re) || [])[1];

const meta = async (videoId) => {
    const html = await (await fetch(`https://www.youtube.com/shorts/${videoId}`, {
        headers: {"user-agent": "Mozilla/5.0", "accept-language": "ru"},
    })).text();
    const uploadDate = pick(html, /"publishDate":"([^"]+)"/) || pick(html, /"uploadDate":"([^"]+)"/);
    const seconds = Number(pick(html, /"lengthSeconds":"(\d+)"/) || 0);
    if (!uploadDate || !seconds) throw new Error(`${videoId}: нет даты или длительности`);
    return {uploadDate, seconds};
};

const thumbnail = async (videoId) => {
    const file = path.join(IMAGES, `${videoId}.webp`);
    if (!fs.existsSync(file)) {
        // oardefault — вертикальный кадр шортса; если его нет, обычная обложка
        let response = await fetch(`https://i.ytimg.com/vi/${videoId}/oardefault.jpg`);
        if (!response.ok) response = await fetch(`https://i.ytimg.com/vi/${videoId}/hq720.jpg`);
        if (!response.ok) throw new Error(`${videoId}: обложка ${response.status}`);
        await sharp(Buffer.from(await response.arrayBuffer()))
            .resize({width: 720, withoutEnlargement: true})
            .webp({quality: 78})
            .toFile(file);
    }
    const {width, height} = await sharp(file).metadata();
    return {src: `/images/works/video/${videoId}.webp`, w: width, h: height};
};

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : [];
const known = new Map(previous.map((item) => [item.videoId, item]));
fs.mkdirSync(IMAGES, {recursive: true});

const result = [];
for (const item of JSON.parse(fs.readFileSync(SOURCE, "utf8"))) {
    const old = known.get(item.videoId);
    const {uploadDate, seconds} = old?.uploadDate ? old : await meta(item.videoId);
    const thumb = await thumbnail(item.videoId);
    result.push({...item, uploadDate, seconds, thumb});
    console.log(`${item.videoId} ${uploadDate.slice(0, 10)} ${seconds}s ${item.car}`);
}
fs.writeFileSync(OUT, `${JSON.stringify(result, null, 1)}\n`);
console.log(`${result.length} роликов → ${path.relative(ROOT, OUT)}`);
