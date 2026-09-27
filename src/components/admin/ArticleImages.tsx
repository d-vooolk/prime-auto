"use client";

import {useRef, useState} from "react";

/*
  Фото в статье: обложка и картинки в любом месте текста.

  Картинка в тексте — это строка ![описание](/uploads/…) отдельным абзацем.
  Вставить её можно кнопкой (в место курсора), вставкой из буфера (Ctrl+V
  скриншота или скопированного фото) и перетаскиванием файла в поле текста.
  После вставки выделяется слово «описание» — его сразу можно заменить: это
  alt картинки, его читают поисковики и незрячие.
*/

interface Uploaded {
    url: string;
    width: number;
    height: number;
}

const ALT_PLACEHOLDER = "опишите, что на фото";

export const uploadImage = async (file: File): Promise<Uploaded> => {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/admin/api/upload", {method: "POST", body: form});
    const data = (await response.json().catch(() => ({error: `Сервер ответил ${response.status}`}))) as Uploaded & {error?: string};
    if (!response.ok || data.error) throw new Error(data.error ?? "Не удалось загрузить фото");
    return data;
};

const imageFiles = (list: FileList | null | undefined): File[] =>
    [...(list ?? [])].filter((file) => file.type.startsWith("image/"));

export const CoverField = ({
    cover,
    alt,
    onChange,
}: {
    cover: string;
    alt: string;
    onChange: (cover: string, alt: string) => void;
}) => {
    const input = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const upload = async (file: File | undefined) => {
        if (!file) return;
        setBusy(true);
        setError("");
        try {
            onChange((await uploadImage(file)).url, alt);
        } catch (reason) {
            setError((reason as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="a-card">
            <h2 className="a-h2">Обложка</h2>
            <p className="a-note">Показывается в плитке в списке статей, вверху статьи и в превью ссылки в соцсетях и мессенджерах. Лучше горизонтальная, от 1200 px по ширине.</p>
            {cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt={alt} style={{display: "block", maxWidth: 420, width: "100%", borderRadius: 12, marginBottom: 12}} />
            )}
            <div className="a-row" style={{marginBottom: 12}}>
                <button type="button" className="a-btn" disabled={busy} onClick={() => input.current?.click()}>
                    {busy ? <span className="a-spin" /> : null} {cover ? "Заменить обложку" : "Загрузить обложку"}
                </button>
                {cover && (
                    <button type="button" className="a-btn a-btn-danger" onClick={() => onChange("", "")}>Убрать</button>
                )}
                <input ref={input} type="file" accept="image/*" hidden onChange={(event) => {
                    void upload(event.target.files?.[0]);
                    event.target.value = "";
                }} />
            </div>
            {cover && (
                <label className="a-field">
                    <span className="a-label">Что на обложке</span>
                    <input className="a-input" value={alt} maxLength={200} onChange={(event) => onChange(cover, event.target.value)} placeholder="Например: фара Audi A6 после установки Bi-Led модулей" />
                </label>
            )}
            {error && <p className="a-error" role="alert">{error}</p>}
        </section>
    );
};

export const BodyEditor = ({value, onChange}: {value: string; onChange: (value: string) => void}) => {
    const area = useRef<HTMLTextAreaElement>(null);
    const picker = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    /** Вставляет фото отдельными абзацами в место курсора и выделяет описание первого */
    const insert = async (files: File[]) => {
        if (!files.length) return;
        const textarea = area.current;
        const position = textarea ? textarea.selectionEnd : value.length;
        setBusy(true);
        setError("");
        try {
            const uploaded: Uploaded[] = [];
            for (const file of files) uploaded.push(await uploadImage(file));
            const before = value.slice(0, position).replace(/\s*$/, "");
            const after = value.slice(position).replace(/^\s*/, "");
            const block = uploaded.map((image) => `![${ALT_PLACEHOLDER}](${image.url})`).join("\n\n");
            const head = before ? `${before}\n\n` : "";
            const next = `${head}${block}${after ? `\n\n${after}` : "\n"}`;
            onChange(next);
            requestAnimationFrame(() => {
                if (!textarea) return;
                const start = head.length + 2;
                textarea.focus();
                textarea.setSelectionRange(start, start + ALT_PLACEHOLDER.length);
            });
        } catch (reason) {
            setError((reason as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="a-card">
            <div className="a-row" style={{justifyContent: "space-between", marginBottom: 8}}>
                <span className="a-label" style={{margin: 0}}>Текст статьи</span>
                <div className="a-row">
                    <button type="button" className="a-btn" disabled={busy} onClick={() => picker.current?.click()}
                            title="Фото встанет туда, где сейчас курсор">
                        {busy ? <span className="a-spin" /> : null} Вставить фото
                    </button>
                    <input ref={picker} type="file" accept="image/*" multiple hidden onChange={(event) => {
                        void insert(imageFiles(event.target.files));
                        event.target.value = "";
                    }} />
                </div>
            </div>
            <textarea
                ref={area}
                className="a-textarea a-mono"
                rows={32}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onPaste={(event) => {
                    const files = imageFiles(event.clipboardData?.files);
                    if (files.length) {
                        event.preventDefault();
                        void insert(files);
                    }
                }}
                onDragOver={(event) => {
                    if ([...event.dataTransfer.items].some((item) => item.type.startsWith("image/"))) event.preventDefault();
                }}
                onDrop={(event) => {
                    const files = imageFiles(event.dataTransfer?.files);
                    if (!files.length) return;
                    event.preventDefault();
                    // курсор ставим туда, куда бросили файл, — фото встанет именно там
                    const textarea = area.current;
                    const caret = (document as Document & {caretPositionFromPoint?: (x: number, y: number) => {offset: number} | null})
                        .caretPositionFromPoint?.(event.clientX, event.clientY);
                    if (textarea && caret) textarea.setSelectionRange(caret.offset, caret.offset);
                    void insert(files);
                }}
            />
            <span className="a-hint">
                ## раздел, ### подраздел, пустая строка между абзацами, - список, 1. шаги, | таблица |, &gt; совет,
                **жирный**, [ссылка](/uslugi/remont-far). Фото — кнопкой, Ctrl+V или перетаскиванием файла в текст;
                подпись под фото: ![описание](/uploads/… &quot;подпись&quot;). {value.length.toLocaleString("ru-RU")} знаков с разметкой.
            </span>
            {busy && <p className="a-note">Загружаем и сжимаем фото…</p>}
            {error && <p className="a-error" role="alert">{error}</p>}
        </section>
    );
};
