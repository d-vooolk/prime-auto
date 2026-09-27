import {getAdmin} from "@/lib/auth";
import {aiConfigured} from "@/lib/ai";
import {MAX_SOURCE} from "@/lib/article-ai";
import {getArticle} from "@/lib/articles";
import {JobError, startJob, type JobInput, type JobKind} from "@/lib/article-jobs";
import {assertPublicUrl, SourcePageError} from "@/lib/source-page";

export const dynamic = "force-dynamic";

const KINDS: JobKind[] = ["generate", "review", "unique"];

const text = (value: unknown, limit: number) => (typeof value === "string" ? value.trim().slice(0, limit) : "");
const reject = (error: string, status = 400) => Response.json({error}, {status});

/** Запуск задачи нейросети. В ответ — номер задачи, ход смотрится по GET /admin/api/jobs/<номер> */
export async function POST(request: Request) {
    if (!(await getAdmin())) return reject("Нужно войти заново", 401);
    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!payload) return reject("Неверный запрос");

    const kind = payload.kind as JobKind;
    if (!KINDS.includes(kind)) return reject("Неизвестная задача");
    if (kind !== "unique" && !aiConfigured()) return reject("Нейросеть не подключена: задайте API-ключ в разделе «Настройки»");

    const input: JobInput = {
        topic: text(payload.topic, 500),
        keyword: text(payload.keyword, 200),
        notes: text(payload.notes, 4000),
        sourceUrl: text(payload.sourceUrl, 2000) || undefined,
        sourceText: text(payload.sourceText, MAX_SOURCE) || undefined,
    };

    if (kind === "generate") {
        if (!input.topic && !input.sourceUrl && !input.sourceText) return reject("Напишите тему статьи или дайте статью конкурента");
        if (input.sourceText && input.sourceText.length < 500) return reject("Текст конкурента слишком короткий — нужно хотя бы 500 знаков");
        if (input.sourceUrl && !input.sourceText) {
            try {
                await assertPublicUrl(input.sourceUrl);
            } catch (error) {
                if (error instanceof SourcePageError) return reject(error.message);
                throw error;
            }
        }
    } else {
        const articleId = Number(payload.articleId);
        const article = Number.isInteger(articleId) ? getArticle(articleId) : null;
        if (!article) return reject("Статья не найдена");
        if (article.body.trim().length < 500) return reject("В статье почти нет текста — проверять нечего");
        input.articleId = articleId;
    }

    try {
        return Response.json({id: startJob(kind, input)});
    } catch (error) {
        if (error instanceof JobError) return reject(error.message, 409);
        throw error;
    }
}
