"use client";

import {useRouter} from "next/navigation";
import {useState, useTransition} from "react";
import {
    changePasswordAction,
    checkAiAction,
    saveConfigAction,
    savePromptAction,
    saveShopLinksAction,
    type ActionResult,
} from "@/app/admin/actions";
import type {ConfigName, ConfigSource} from "@/lib/config";
import type {PromptKey} from "@/lib/article-ai";

const Result = ({result}: {result: ActionResult | null}) =>
    result ? (result.ok ? <p className="a-success">{result.message}</p> : <p className="a-error" role="alert">{result.error}</p>) : null;

export const PromptForm = ({promptKey, title, value, fallback}: {promptKey: PromptKey; title: string; value: string; fallback: string}) => {
    const [text, setText] = useState(value);
    const [result, setResult] = useState<ActionResult | null>(null);
    const [pending, startTransition] = useTransition();

    return (
        <section className="a-card">
            <h2 className="a-h2">{title}</h2>
            <textarea className="a-textarea a-mono" rows={14} value={text} onChange={(event) => setText(event.target.value)} />
            <div className="a-row" style={{marginTop: 8}}>
                <button type="button" className="a-btn a-btn-primary" disabled={pending}
                        onClick={() => startTransition(async () => setResult(await savePromptAction(promptKey, text)))}>
                    Сохранить
                </button>
                <button type="button" className="a-btn" disabled={pending}
                        onClick={() => {
                            setText(fallback);
                            startTransition(async () => setResult(await savePromptAction(promptKey, "")));
                        }}>
                    Вернуть по умолчанию
                </button>
            </div>
            <Result result={result} />
        </section>
    );
};

export const ShopLinksForm = ({value}: {value: string}) => {
    const [text, setText] = useState(value);
    const [result, setResult] = useState<ActionResult | null>(null);
    const [pending, startTransition] = useTransition();

    return (
        <section className="a-card">
            <h2 className="a-h2">Ссылки на магазин VDF.BY</h2>
            <p className="a-note">
                Нейросеть может сослаться на магазин 1–2 раза за статью — только по этим адресам и только там, где читателю
                нужно что-то купить. По строке на ссылку: «https://vdf.by/catalog/bi-led-moduli/ | Bi-LED модули». Пустой список —
                ссылок на магазин не будет.
            </p>
            <textarea className="a-textarea a-mono" rows={7} value={text} onChange={(event) => setText(event.target.value)} />
            <button type="button" className="a-btn a-btn-primary" style={{marginTop: 8}} disabled={pending}
                    onClick={() => startTransition(async () => setResult(await saveShopLinksAction(text)))}>
                Сохранить
            </button>
            <Result result={result} />
        </section>
    );
};

export const AiCheckButton = () => {
    const [result, setResult] = useState<ActionResult | null>(null);
    const [pending, startTransition] = useTransition();
    return (
        <>
            <button type="button" className="a-btn" disabled={pending}
                    onClick={() => startTransition(async () => setResult(await checkAiAction()))}>
                {pending ? <span className="a-spin" /> : null} Проверить связь с нейросетью
            </button>
            <Result result={result} />
        </>
    );
};

export interface ConfigFieldView {
    name: ConfigName;
    label: string;
    hint: string;
    type: "secret" | "text" | "number";
    /** Значение, сохранённое в админке; у ключей всегда пусто */
    value: string;
    /** Что действует, если поле пустое: значение из .env или по умолчанию (ключи — замаскированы) */
    placeholder: string;
    source: ConfigSource;
}

const SOURCE_LABELS: Record<ConfigSource, string> = {
    admin: "задано здесь",
    env: "из .env сервера",
    default: "по умолчанию",
};

export const ConfigForm = ({title, note, fields}: {title: string; note?: string; fields: ConfigFieldView[]}) => {
    const router = useRouter();
    const [values, setValues] = useState<Record<string, string>>(
        Object.fromEntries(fields.map((field) => [field.name, field.value])),
    );
    const [clear, setClear] = useState<Record<string, boolean>>({});
    const [result, setResult] = useState<ActionResult | null>(null);
    const [pending, startTransition] = useTransition();

    const save = () =>
        startTransition(async () => {
            const saved = await saveConfigAction(
                fields.map((field) => ({name: field.name, value: values[field.name] ?? "", clear: clear[field.name]})),
            );
            setResult(saved);
            if (saved.ok) {
                // Введённый ключ в поле не держим: он сохранён, показывать его незачем
                setValues((current) => Object.fromEntries(
                    Object.entries(current).map(([name, value]) => [name, fields.find((field) => field.name === name)?.type === "secret" ? "" : value]),
                ));
                setClear({});
                router.refresh();
            }
        });

    return (
        <section className="a-card">
            <h2 className="a-h2">{title}</h2>
            {note && <p className="a-note">{note}</p>}
            {fields.map((field) => (
                <label key={field.name} className="a-field">
                    <span className="a-label">
                        {field.label} <span className="a-badge">{SOURCE_LABELS[field.source]}</span>
                    </span>
                    <input
                        className={`a-input ${field.type === "text" ? "" : "a-mono"}`}
                        type={field.type === "secret" ? "password" : "text"}
                        inputMode={field.type === "number" ? "decimal" : undefined}
                        autoComplete="off"
                        value={values[field.name] ?? ""}
                        placeholder={field.type === "secret" && field.placeholder ? `${field.placeholder} — введите новый, чтобы заменить` : field.placeholder}
                        onChange={(event) => setValues((current) => ({...current, [field.name]: event.target.value}))}
                    />
                    <span className="a-hint">{field.hint}</span>
                    {field.type === "secret" && field.source === "admin" && (
                        <span className="a-hint">
                            <input
                                type="checkbox"
                                checked={Boolean(clear[field.name])}
                                onChange={(event) => setClear((current) => ({...current, [field.name]: event.target.checked}))}
                            />{" "}
                            удалить ключ из админки (снова действует .env)
                        </span>
                    )}
                </label>
            ))}
            <p className="a-note">Пустое поле — действует значение из .env сервера или по умолчанию (оно показано серым).</p>
            <button type="button" className="a-btn a-btn-primary" disabled={pending} onClick={save}>
                {pending ? <span className="a-spin" /> : null} Сохранить
            </button>
            <Result result={result} />
        </section>
    );
};

export const PasswordForm = () => {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [repeat, setRepeat] = useState("");
    const [result, setResult] = useState<ActionResult | null>(null);
    const [pending, startTransition] = useTransition();

    const save = () =>
        startTransition(async () => {
            const saved = await changePasswordAction(current, next, repeat);
            setResult(saved);
            if (saved.ok) {
                setCurrent("");
                setNext("");
                setRepeat("");
            }
        });

    return (
        <section className="a-card">
            <h2 className="a-h2">Пароль входа</h2>
            <div className="a-grid2">
                <label className="a-field">
                    <span className="a-label">Текущий пароль</span>
                    <input className="a-input" type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} />
                </label>
                <span />
                <label className="a-field">
                    <span className="a-label">Новый пароль</span>
                    <input className="a-input" type="password" autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} />
                    <span className="a-hint">Не короче 9 символов, не только цифры.</span>
                </label>
                <label className="a-field">
                    <span className="a-label">Ещё раз</span>
                    <input className="a-input" type="password" autoComplete="new-password" value={repeat} onChange={(event) => setRepeat(event.target.value)} />
                </label>
            </div>
            <button type="button" className="a-btn a-btn-primary" disabled={pending || !current || !next} onClick={save}>
                Сменить пароль
            </button>
            <Result result={result} />
        </section>
    );
};
