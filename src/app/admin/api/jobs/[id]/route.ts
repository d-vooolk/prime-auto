import {getAdmin} from "@/lib/auth";
import {clearRevalidate, getJob} from "@/lib/article-jobs";
import {revalidateArticles} from "@/lib/revalidate";

export const dynamic = "force-dynamic";

/** Ход задачи. Если задача поменяла опубликованную статью — здесь же обновляются её страницы */
export async function GET(_: Request, {params}: {params: Promise<{id: string}>}) {
    if (!(await getAdmin())) return Response.json({error: "Нужно войти заново"}, {status: 401});
    const job = getJob(Number((await params).id));
    if (!job) return Response.json({error: "Задача не найдена"}, {status: 404});

    if (job.revalidate && job.status !== "running") {
        revalidateArticles(job.revalidate);
        clearRevalidate(job.id);
    }
    const {input, ...rest} = job;
    return Response.json({...rest, input: {topic: input.topic, sourceUrl: input.sourceUrl}});
}
