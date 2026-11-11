import {execFile} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {env} from "./env.mjs";

/**
 * Печать HTML коммерческого предложения в PDF через headless Chromium.
 *
 * Браузер — тот же движок, что в предпросмотре, поэтому PDF совпадает с
 * тем, что админ видит на экране: шрифт вшит, текст остаётся текстом.
 * Chromium ставится в образ (Dockerfile); на Mac для разработки берётся
 * установленный Google Chrome. Путь можно задать явно: CHROMIUM_PATH.
 *
 * Печать идёт строго по одной: Chromium съедает 200–300 МБ, а у контейнера
 * потолок 1 ГБ (docker-compose.yml). Два КП, нажатые одновременно, просто
 * подождут друг друга несколько секунд.
 */

const CANDIDATES = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

export class PdfError extends Error {}

const browserPath = (): string => {
    const configured = env("CHROMIUM_PATH", "");
    const found = [configured, ...CANDIDATES].find((candidate) => candidate && fs.existsSync(candidate));
    if (!found) throw new PdfError("Не найден Chromium — PDF собрать нечем. Нужен пакет chromium в образе или CHROMIUM_PATH");
    return found;
};

let queue: Promise<unknown> = Promise.resolve();

const print = async (html: string): Promise<Buffer> => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "proposal-"));
    try {
        const source = path.join(dir, "index.html");
        const output = path.join(dir, "out.pdf");
        fs.writeFileSync(source, html);
        await new Promise<void>((resolve, reject) => {
            execFile(
                browserPath(),
                [
                    "--headless=new",
                    "--no-sandbox",
                    "--disable-gpu",
                    "--disable-dev-shm-usage",
                    "--disable-extensions",
                    "--no-first-run",
                    "--no-pdf-header-footer",
                    `--user-data-dir=${path.join(dir, "profile")}`,
                    "--virtual-time-budget=15000",
                    `--print-to-pdf=${output}`,
                    `file://${source}`,
                ],
                {timeout: 90_000},
                (error, _stdout, stderr) => {
                    if (error) {
                        console.error("[proposal-pdf]", error.message, stderr.slice(-2000));
                        reject(new PdfError("Chromium не смог напечатать PDF, подробности в логе сервера"));
                    } else {
                        resolve();
                    }
                },
            );
        });
        if (!fs.existsSync(output)) throw new PdfError("Chromium завершился, но PDF не появился — подробности в логе сервера");
        return fs.readFileSync(output);
    } finally {
        fs.rmSync(dir, {recursive: true, force: true});
    }
};

export const renderPdf = (html: string): Promise<Buffer> => {
    const job = queue.then(() => print(html));
    queue = job.catch(() => undefined);
    return job;
};
