"use client";

import {useRouter} from "next/navigation";
import {useState} from "react";

type Mode = "topic" | "url" | "text";

const TOPIC_EXAMPLES = [
    "Почему потеет фара изнутри и как это исправить",
    "Bi-Led модули или светодиодные лампы: что выбрать для галогеновой фары",
    "Сколько служит полировка фар и как продлить результат",
    "Трещина на корпусе фары: ремонт или замена",
];

export const requestJob = async (payload: Record<string, unknown>): Promise<{id?: number; error?: string}> => {
    const response = await fetch("/admin/api/jobs", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
    });
    return (await response.json().catch(() => ({error: `Сервер ответил ${response.status}`}))) as {id?: number; error?: string};
};

export const NewArticleForm = ({aiReady}: {aiReady: boolean}) => {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>("topic");
    const [topic, setTopic] = useState("");
    const [keyword, setKeyword] = useState("");
    const [notes, setNotes] = useState("");
    const [sourceUrl, setSourceUrl] = useState("");
    const [sourceText, setSourceText] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const ready =
        aiReady &&
        (mode === "topic" ? topic.trim() : mode === "url" ? sourceUrl.trim() : sourceText.trim().length >= 500);

    const submit = async () => {
        setBusy(true);
        setError("");
        const result = await requestJob({
            kind: "generate",
            topic,
            keyword,
            notes,
            ...(mode === "url" ? {sourceUrl} : {}),
            ...(mode === "text" ? {sourceText} : {}),
        }).catch((reason: Error) => ({error: reason.message, id: undefined}));
        if (result.id) {
            router.push(`/admin/jobs/${result.id}`);
            return;
        }
        setError(result.error ?? "Не получилось запустить задачу");
        setBusy(false);
    };

    return (
        <section className="a-card">
            <div className="a-tabs" role="tablist">
                {([
                    ["topic", "По теме"],
                    ["url", "По ссылке на статью конкурента"],
                    ["text", "По тексту конкурента"],
                ] as const).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={mode === value}
                        className={`a-tab ${mode === value ? "a-tab-active" : ""}`}
                        onClick={() => setMode(value)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {mode === "url" && (
                <label className="a-field">
                    <span className="a-label">Ссылка на статью конкурента</span>
                    <input className="a-input" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" />
                    <span className="a-hint">
                        Сервер скачает страницу, нейросеть выделит из неё саму статью и напишет на её основе новую — со своей структурой,
                        под нашу мастерскую и без дословных совпадений. Если сайт не пускает ботов, используйте вкладку «По тексту».
                    </span>
                </label>
            )}
            {mode === "text" && (
                <label className="a-field">
                    <span className="a-label">Текст статьи конкурента</span>
                    <textarea className="a-textarea" rows={12} value={sourceText} onChange={(event) => setSourceText(event.target.value)} maxLength={40000} />
                    <span className="a-hint">Скопируйте со страницы только саму статью, без меню и подвала. {sourceText.length.toLocaleString("ru-RU")} знаков.</span>
                </label>
            )}

            <label className="a-field">
                <span className="a-label">{mode === "topic" ? "Тема" : "Тема (необязательно — возьмём из статьи конкурента)"}</span>
                <input className="a-input" value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={500} placeholder={TOPIC_EXAMPLES[0]} />
            </label>
            {mode === "topic" && (
                <div className="a-row" style={{marginBottom: 14}}>
                    {TOPIC_EXAMPLES.map((example) => (
                        <button key={example} type="button" className="a-badge" style={{border: 0, cursor: "pointer"}} onClick={() => setTopic(example)}>
                            {example}
                        </button>
                    ))}
                </div>
            )}

            <label className="a-field">
                <span className="a-label">Главный поисковый запрос</span>
                <input className="a-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} maxLength={200} placeholder="потеет фара изнутри" />
                <span className="a-hint">Необязательно. Как люди ищут эту тему в Яндексе.</span>
            </label>

            <label className="a-field">
                <span className="a-label">Нюансы</span>
                <textarea className="a-textarea" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={4000} />
                <span className="a-hint">Что обязательно раскрыть, для каких машин, какой случай из практики мастерской упомянуть.</span>
            </label>

            {!aiReady && <p className="a-error">Не задан API-ключ нейросети — укажите его в разделе <a href="/admin/settings">«Настройки»</a>.</p>}
            {error && <p className="a-error" role="alert">{error}</p>}

            <button type="button" className="a-btn a-btn-primary" onClick={submit} disabled={!ready || busy}>
                {busy ? <><span className="a-spin" /> Запускаем…</> : "Написать статью"}
            </button>
            <p className="a-note">
                Дальше всё идёт само: черновик → проверка качества SEO-редактором и правки → проверка уникальности и
                переписывание совпадающих мест. Обычно 5–15 минут, с text.ru — дольше. Вкладку можно закрыть: задача
                продолжится на сервере, результат появится черновиком в списке статей.
            </p>
        </section>
    );
};
