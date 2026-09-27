"use client";

import Link from "next/link";
import {useEffect, useState} from "react";

export interface JobState {
    id: number;
    kind: "generate" | "review" | "unique";
    status: "running" | "done" | "error";
    step: string;
    log: {at: number; text: string}[];
    preview: string;
    error: string;
    articleId: number | null;
    input: {topic?: string; sourceUrl?: string};
}

const POLL_MS = 2000;

const time = (ms: number) => new Date(ms).toLocaleTimeString("ru-RU", {hour: "2-digit", minute: "2-digit", second: "2-digit"});

export const JobView = ({initial, title}: {initial: JobState; title: string}) => {
    const [job, setJob] = useState(initial);
    const [lost, setLost] = useState("");

    // Один запрос при открытии и для завершённой задачи: если она поменяла
    // опубликованную статью, именно этот запрос обновит страницы на сайте.
    useEffect(() => {
        if (initial.status !== "running") void fetch(`/admin/api/jobs/${initial.id}`, {cache: "no-store"});
    }, [initial.id, initial.status]);

    useEffect(() => {
        if (job.status !== "running") return;
        const timer = setTimeout(async () => {
            try {
                const response = await fetch(`/admin/api/jobs/${job.id}`, {cache: "no-store"});
                const data = (await response.json()) as JobState & {error?: string};
                if (!response.ok) {
                    setLost(data.error ?? `Сервер ответил ${response.status}`);
                    return;
                }
                setLost("");
                setJob(data);
            } catch {
                setLost("Нет связи с сервером — пробуем ещё раз");
                setJob((value) => ({...value}));
            }
        }, POLL_MS);
        return () => clearTimeout(timer);
    }, [job]);

    return (
        <>
            <h1 className="a-h1">{title}{job.input.topic ? `: ${job.input.topic}` : ""}</h1>
            <section className="a-card">
                <div className="a-row" style={{marginBottom: 12}}>
                    {job.status === "running" && <span className="a-spin" />}
                    <strong>
                        {job.status === "running" ? job.step : job.status === "done" ? "Готово" : "Ошибка"}
                    </strong>
                </div>
                {job.status === "error" && <p className="a-error" role="alert">{job.error}</p>}
                {lost && <p className="a-note">{lost}</p>}
                {job.articleId && (
                    <p>
                        <Link href={`/admin/articles/${job.articleId}`} className={`a-btn ${job.status === "running" ? "" : "a-btn-primary"}`}>
                            Открыть статью
                        </Link>
                    </p>
                )}
                <ol className="a-log">
                    {job.log.map((entry, index) => (
                        <li key={index}><time>{time(entry.at)}</time>{entry.text}</li>
                    ))}
                </ol>
                {job.status === "running" && job.preview && <pre className="a-preview">{job.preview}</pre>}
            </section>
            {job.status === "running" && (
                <p className="a-note">Страницу можно закрыть — задача продолжится на сервере.</p>
            )}
        </>
    );
};
