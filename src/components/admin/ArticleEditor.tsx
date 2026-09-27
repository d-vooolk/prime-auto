"use client";

import {useRouter} from "next/navigation";
import {useState, useTransition} from "react";
import {
    deleteArticleAction,
    saveArticleAction,
    setStatusAction,
    type ActionResult,
    type ArticleForm,
} from "@/app/admin/actions";
import {requestJob} from "@/components/admin/NewArticleForm";

interface ArticleEditorProps {
    id: number;
    published: boolean;
    initial: ArticleForm;
    aiReady: boolean;
}

const relatedToText = (links: ArticleForm["related"]) => links.map((link) => `${link.title} | ${link.href}`).join("\n");

const textToRelated = (text: string): ArticleForm["related"] =>
    text
        .split("\n")
        .map((line) => {
            const [title = "", href = ""] = line.split("|").map((part) => part.trim());
            return {title, href};
        })
        .filter((link) => link.title && link.href);

const Counter = ({value, min, max}: {value: string; min?: number; max: number}) => {
    const length = value.trim().length;
    const bad = length > max || (min !== undefined && length < min);
    return (
        <span className="a-hint" style={bad ? {color: "var(--a-warn)"} : undefined}>
            {length} знаков, нужно {min !== undefined ? `${min}–${max}` : `до ${max}`}
        </span>
    );
};

export const ArticleEditor = ({id, published, initial, aiReady}: ArticleEditorProps) => {
    const router = useRouter();
    const [form, setForm] = useState(initial);
    const [related, setRelated] = useState(relatedToText(initial.related));
    const [result, setResult] = useState<ActionResult | null>(null);
    const [dirty, setDirty] = useState(false);
    const [pending, startTransition] = useTransition();

    const set = <K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) => {
        setForm((current) => ({...current, [key]: value}));
        setDirty(true);
    };

    const save = async (): Promise<boolean> => {
        const saved = await saveArticleAction(id, {...form, related: textToRelated(related)});
        setResult(saved);
        if (saved.ok) {
            setDirty(false);
            if (saved.slug) setForm((current) => ({...current, slug: saved.slug!}));
        }
        return saved.ok;
    };

    const run = (task: () => Promise<void>) => startTransition(task);

    const onSave = () => run(async () => {
        if (await save()) router.refresh();
    });

    const onStatus = () => run(async () => {
        if (dirty && !(await save())) return;
        setResult(await setStatusAction(id, !published));
        router.refresh();
    });

    const onJob = (kind: "review" | "unique") => run(async () => {
        if (dirty && !(await save())) return;
        const started = await requestJob({kind, articleId: id});
        if (started.id) router.push(`/admin/jobs/${started.id}`);
        else setResult({ok: false, error: started.error ?? "Не получилось запустить проверку"});
    });

    const onDelete = () => {
        if (!confirm("Удалить статью безвозвратно?")) return;
        run(() => deleteArticleAction(id));
    };

    const updateFaq = (index: number, key: "q" | "a", value: string) =>
        set("faq", form.faq.map((item, position) => (position === index ? {...item, [key]: value} : item)));

    return (
        <>
            <section className="a-card">
                <div className="a-row">
                    <button type="button" className="a-btn a-btn-primary" onClick={onSave} disabled={pending}>
                        {pending ? <span className="a-spin" /> : null} Сохранить
                    </button>
                    <button type="button" className="a-btn" onClick={onStatus} disabled={pending}>
                        {published ? "Снять с публикации" : "Опубликовать"}
                    </button>
                    <a className="a-btn" href={published ? `/stati/${form.slug}` : `/admin/articles/${id}/preview`} target="_blank" rel="noreferrer">
                        {published ? "Открыть на сайте ↗" : "Предпросмотр ↗"}
                    </a>
                    <span style={{flex: 1}} />
                    <button type="button" className="a-btn" onClick={() => onJob("review")} disabled={pending || !aiReady}
                            title="Нейросеть-редактор оценит статью, исправит недочёты, затем проверка уникальности">
                        Проверить и улучшить
                    </button>
                    <button type="button" className="a-btn" onClick={() => onJob("unique")} disabled={pending}>
                        Проверить уникальность
                    </button>
                </div>
                {dirty && <p className="a-note">Есть несохранённые изменения. Перед проверками статья сохранится сама.</p>}
                {result && (result.ok
                    ? <p className="a-success">{result.message}</p>
                    : <p className="a-error" role="alert">{result.error}</p>)}
            </section>

            <section className="a-card">
                <label className="a-field">
                    <span className="a-label">Заголовок (H1)</span>
                    <input className="a-input" value={form.title} onChange={(event) => set("title", event.target.value)} maxLength={200} />
                    <Counter value={form.title} max={70} />
                </label>
                <div className="a-grid2">
                    <label className="a-field">
                        <span className="a-label">Адрес</span>
                        <input className="a-input a-mono" value={form.slug} onChange={(event) => set("slug", event.target.value)} maxLength={100} />
                        <span className="a-hint">prime-auto.by/stati/{form.slug || "…"}. У опубликованной статьи адрес лучше не менять.</span>
                    </label>
                    <label className="a-field">
                        <span className="a-label">Главный поисковый запрос</span>
                        <input className="a-input" value={form.keyword} onChange={(event) => set("keyword", event.target.value)} maxLength={200} />
                    </label>
                </div>
                <label className="a-field">
                    <span className="a-label">SEO-заголовок (title)</span>
                    <input className="a-input" value={form.metaTitle} onChange={(event) => set("metaTitle", event.target.value)} maxLength={120} />
                    <Counter value={form.metaTitle} max={50} />
                    <span className="a-hint">На сайте к нему добавится « | Prime Auto».</span>
                </label>
                <label className="a-field">
                    <span className="a-label">SEO-описание (description)</span>
                    <textarea className="a-textarea" rows={2} value={form.metaDescription} onChange={(event) => set("metaDescription", event.target.value)} maxLength={300} />
                    <Counter value={form.metaDescription} min={140} max={160} />
                </label>
                <label className="a-field">
                    <span className="a-label">Аннотация</span>
                    <textarea className="a-textarea" rows={3} value={form.excerpt} onChange={(event) => set("excerpt", event.target.value)} maxLength={800} />
                    <span className="a-hint">Прямой ответ на главный вопрос. Показывается под заголовком и в списке статей.</span>
                </label>
            </section>

            <section className="a-card">
                <label className="a-field">
                    <span className="a-label">Текст статьи</span>
                    <textarea className="a-textarea a-mono" rows={32} value={form.body} onChange={(event) => set("body", event.target.value)} />
                    <span className="a-hint">
                        ## раздел, ### подраздел, пустая строка между абзацами, - список, 1. шаги, | таблица |, &gt; совет,
                        **жирный**, [ссылка](/uslugi/remont-far). {form.body.length.toLocaleString("ru-RU")} знаков с разметкой.
                    </span>
                </label>
            </section>

            <section className="a-card">
                <h2 className="a-h2">Вопросы и ответы</h2>
                <p className="a-note">Показываются в конце статьи и размечаются для поиска (FAQPage).</p>
                {form.faq.map((item, index) => (
                    <div key={index} className="a-field" style={{borderBottom: "1px solid var(--a-line)", paddingBottom: 12}}>
                        <input className="a-input" value={item.q} placeholder="Вопрос" onChange={(event) => updateFaq(index, "q", event.target.value)} style={{marginBottom: 6}} />
                        <textarea className="a-textarea" rows={2} value={item.a} placeholder="Ответ" onChange={(event) => updateFaq(index, "a", event.target.value)} />
                        <button type="button" className="a-btn a-btn-danger" style={{marginTop: 6}} onClick={() => set("faq", form.faq.filter((_, position) => position !== index))}>
                            Убрать вопрос
                        </button>
                    </div>
                ))}
                <button type="button" className="a-btn" onClick={() => set("faq", [...form.faq, {q: "", a: ""}])}>Добавить вопрос</button>
            </section>

            <section className="a-card">
                <label className="a-field">
                    <span className="a-label">Блок «По теме статьи»</span>
                    <textarea className="a-textarea a-mono" rows={4} value={related} onChange={(event) => { setRelated(event.target.value); setDirty(true); }} />
                    <span className="a-hint">По строке на ссылку: «Ремонт фар | /uslugi/remont-far». Только страницы этого сайта.</span>
                </label>
            </section>

            <section className="a-card">
                <button type="button" className="a-btn a-btn-danger" onClick={onDelete} disabled={pending}>Удалить статью</button>
            </section>
        </>
    );
};
