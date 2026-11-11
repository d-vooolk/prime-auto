"use client";

import {useRef, useState, useTransition} from "react";
import type {ActionResult} from "@/app/admin/actions";
import {deleteProposalAction, saveExecutorAction, saveProposalAction} from "@/app/admin/proposal-actions";
import type {Executor, ProposalData, WarrantyItem} from "@/lib/proposals";

const Result = ({result}: {result: ActionResult | null}) =>
    result ? (result.ok ? <p className="a-success">{result.message}</p> : <p className="a-error" role="alert">{result.error}</p>) : null;

/* Цены в форме — строки: «1 900,50» должно спокойно набираться с пробелами и запятой */
interface ItemForm {
    title: string;
    price: string;
}

type Form = Omit<ProposalData, "items" | "totalOverride"> & {items: ItemForm[]; totalOverride: string};

const priceText = (value: number | null): string => (value === null ? "" : String(value).replace(".", ","));

const parsePrice = (value: string): number | null => {
    const number = Number(value.replace(/\s/g, "").replace(",", "."));
    return value.trim() && Number.isFinite(number) && number >= 0 ? number : null;
};

const money = (value: number): string =>
    value.toLocaleString("ru-RU", {minimumFractionDigits: 2, maximumFractionDigits: 2});

const toForm = (data: ProposalData): Form => ({
    ...data,
    items: data.items.map((item) => ({title: item.title, price: priceText(item.price)})),
    totalOverride: priceText(data.totalOverride),
});

const fromForm = (form: Form) => ({
    ...form,
    items: form.items.map((item) => ({title: item.title, price: parsePrice(item.price)})),
    totalOverride: parsePrice(form.totalOverride),
});

const move = <T,>(list: T[], index: number, shift: number): T[] => {
    const target = index + shift;
    if (target < 0 || target >= list.length) return list;
    const copy = [...list];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    return copy;
};

const Field = ({label, hint, children}: {label: string; hint?: string; children: React.ReactNode}) => (
    <label className="a-field">
        <span className="a-label">{label}</span>
        {children}
        {hint ? <span className="a-hint">{hint}</span> : null}
    </label>
);

export const ProposalEditor = ({id, number, initial}: {id: number; number: number; initial: ProposalData}) => {
    const [form, setForm] = useState<Form>(() => toForm(initial));
    const [dirty, setDirty] = useState(false);
    const [result, setResult] = useState<ActionResult | null>(null);
    const [pending, startTransition] = useTransition();
    const [version, setVersion] = useState(0);
    const [uploading, setUploading] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    const set = <K extends keyof Form>(key: K, value: Form[K]) => {
        setForm((current) => ({...current, [key]: value}));
        setDirty(true);
    };

    const setItem = (index: number, key: keyof ItemForm, value: string) =>
        set("items", form.items.map((item, position) => (position === index ? {...item, [key]: value} : item)));
    const setWarranty = (index: number, key: keyof WarrantyItem, value: string) =>
        set("warranty", form.warranty.map((item, position) => (position === index ? {...item, [key]: value} : item)));

    const sum = form.items.reduce((total, item) => total + (parsePrice(item.price) ?? 0), 0);
    const override = parsePrice(form.totalOverride);
    const total = override ?? sum;
    const mismatch = override !== null && Math.abs(override - sum) >= 0.01;

    const save = (after?: () => void) =>
        startTransition(async () => {
            const saved = await saveProposalAction(id, fromForm(form));
            setResult(saved);
            if (saved.ok) {
                setDirty(false);
                setVersion((current) => current + 1);
                after?.();
            }
        });

    const uploadCover = async (file: File) => {
        setUploading(true);
        const body = new FormData();
        body.append("file", file);
        try {
            const response = await fetch("/admin/api/upload", {method: "POST", body});
            const json = (await response.json()) as {url?: string; error?: string};
            if (json.url) set("cover", json.url);
            else setResult({ok: false, error: json.error ?? "Не удалось загрузить фото"});
        } catch {
            setResult({ok: false, error: "Не удалось загрузить фото — проверьте соединение"});
        } finally {
            setUploading(false);
            if (fileInput.current) fileInput.current.value = "";
        }
    };

    return (
        <>
            <div className="a-card a-kp-bar">
                <div className="a-row">
                    <button type="button" className="a-btn a-btn-primary" disabled={pending} onClick={() => save()}>
                        {pending ? <span className="a-spin" /> : null} Сохранить
                    </button>
                    <button type="button" className="a-btn" disabled={pending}
                            onClick={() => (dirty ? save(() => window.location.assign(`/admin/kp/${id}/pdf`)) : window.location.assign(`/admin/kp/${id}/pdf`))}>
                        Скачать PDF
                    </button>
                    <a className="a-btn" href={`/admin/kp/${id}/view`} target="_blank" rel="noreferrer">Открыть документ</a>
                    <span className="a-note" style={{margin: 0}}>
                        Итого: <strong>{money(total)} BYN</strong>{dirty ? " · есть несохранённые изменения" : ""}
                    </span>
                </div>
                <Result result={result} />
            </div>

            <section className="a-card">
                <h2 className="a-h2">Заказчик</h2>
                <div className="a-grid2">
                    <Field label="Организация">
                        <input className="a-input" value={form.clientName} placeholder="КУП «Житковичский коммунальник»"
                               onChange={(event) => set("clientName", event.target.value)} />
                    </Field>
                    <Field label="УНП">
                        <input className="a-input" value={form.clientUnp} onChange={(event) => set("clientUnp", event.target.value)} />
                    </Field>
                </div>
                <Field label="Адрес" hint="Можно в две строки — перенос сохранится в документе">
                    <textarea className="a-textarea" rows={2} value={form.clientAddress}
                              placeholder={"247960, Республика Беларусь,\nг. Житковичи, ул. К. Маркса, 44а"}
                              onChange={(event) => set("clientAddress", event.target.value)} />
                </Field>
                <div className="a-grid2">
                    <Field label="Обращение" hint="Целиком, с восклицательным знаком">
                        <input className="a-input" value={form.greeting} placeholder="Уважаемый Олег Иванович!"
                               onChange={(event) => set("greeting", event.target.value)} />
                    </Field>
                    <Field label="Дата КП">
                        <input className="a-input" type="date" value={form.date} onChange={(event) => set("date", event.target.value)} />
                    </Field>
                </div>
            </section>

            <section className="a-card">
                <h2 className="a-h2">Предмет предложения</h2>
                <Field label="Подзаголовок на обложке">
                    <input className="a-input" value={form.subject} onChange={(event) => set("subject", event.target.value)} />
                </Field>
                <div className="a-grid2">
                    <Field label="Автомобиль" hint="Выделяется на обложке и стоит в шапке страниц">
                        <input className="a-input" value={form.vehicle} placeholder="Volkswagen Caravelle"
                               onChange={(event) => set("vehicle", event.target.value)} />
                    </Field>
                    <Field label="Уточнение">
                        <input className="a-input" value={form.vehicleNote} placeholder="2019 года выпуска"
                               onChange={(event) => set("vehicleNote", event.target.value)} />
                    </Field>
                </div>
                <Field label="Вступление" hint="{авто} подставит автомобиль с уточнением. Пустое поле — без вступления">
                    <textarea className="a-textarea" rows={4} value={form.intro} onChange={(event) => set("intro", event.target.value)} />
                </Field>
            </section>

            <section className="a-card">
                <h2 className="a-h2">Работы</h2>
                <Field label="Строка перед списком">
                    <input className="a-input" value={form.itemsLead} onChange={(event) => set("itemsLead", event.target.value)} />
                </Field>
                <table className="a-table a-kp-items">
                    <thead>
                    <tr>
                        <th>№</th>
                        <th>Работа</th>
                        <th>Цена, BYN</th>
                        <th />
                    </tr>
                    </thead>
                    <tbody>
                    {form.items.map((item, index) => (
                        <tr key={index}>
                            <td className="a-note">{index + 1}</td>
                            <td>
                                <textarea className="a-textarea" rows={1} value={item.title}
                                          onChange={(event) => setItem(index, "title", event.target.value)} />
                            </td>
                            <td>
                                <input className="a-input" inputMode="decimal" value={item.price} placeholder="входит"
                                       onChange={(event) => setItem(index, "price", event.target.value)} />
                            </td>
                            <td>
                                <div className="a-row" style={{flexWrap: "nowrap"}}>
                                    <button type="button" className="a-btn" title="Выше" disabled={index === 0}
                                            onClick={() => set("items", move(form.items, index, -1))}>↑</button>
                                    <button type="button" className="a-btn" title="Ниже" disabled={index === form.items.length - 1}
                                            onClick={() => set("items", move(form.items, index, 1))}>↓</button>
                                    <button type="button" className="a-btn a-btn-danger" title="Удалить"
                                            onClick={() => set("items", form.items.filter((_, position) => position !== index))}>✕</button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div className="a-row" style={{marginTop: 10, justifyContent: "space-between"}}>
                    <button type="button" className="a-btn" onClick={() => set("items", [...form.items, {title: "", price: ""}])}>
                        Добавить работу
                    </button>
                    <span>Сумма по позициям: <strong>{money(sum)} BYN</strong></span>
                </div>
                <p className="a-hint">Пустая цена — в документе будет «входит». Пустые строки работ при сохранении убираются.</p>
            </section>

            <section className="a-card">
                <h2 className="a-h2">Стоимость</h2>
                <div className="a-grid2">
                    <Field label="Итоговая сумма, BYN" hint="Пусто — сумма по позициям. Впишите своё число для скидки или округления">
                        <input className="a-input" inputMode="decimal" value={form.totalOverride} placeholder={money(sum)}
                               onChange={(event) => set("totalOverride", event.target.value)} />
                    </Field>
                    <Field label="Скидка в документе">
                        <label className="a-row" style={{fontWeight: 400}}>
                            <input type="checkbox" checked={form.showDiscount} onChange={(event) => set("showDiscount", event.target.checked)} />
                            Показать сумму по позициям и скидку
                        </label>
                    </Field>
                </div>
                {mismatch && !form.showDiscount ? (
                    <p className="a-error">
                        Итог {money(override!)} BYN не равен сумме цен {money(sum)} BYN. Строку «Итого по позициям» уберём, но цены
                        работ в таблице останутся — заказчик может их сложить. Включите «Показать скидку» или поправьте цены.
                    </p>
                ) : null}
                <Field label="Что входит в стоимость">
                    <textarea className="a-textarea" rows={2} value={form.totalNote} onChange={(event) => set("totalNote", event.target.value)} />
                </Field>
            </section>

            <section className="a-card">
                <h2 className="a-h2">Сроки и гарантия</h2>
                <div className="a-grid2">
                    <Field label="Срок" hint="Пусто — блока со сроком не будет">
                        <input className="a-input" value={form.termValue} placeholder="3 календарных дня"
                               onChange={(event) => set("termValue", event.target.value)} />
                    </Field>
                    <Field label="Пояснение к сроку">
                        <input className="a-input" value={form.termNote} onChange={(event) => set("termNote", event.target.value)} />
                    </Field>
                </div>
                <span className="a-label">Гарантии</span>
                {form.warranty.map((item, index) => (
                    <div key={index} className="a-kp-warranty">
                        <input className="a-input" value={item.label} placeholder="На выполненные работы"
                               onChange={(event) => setWarranty(index, "label", event.target.value)} />
                        <input className="a-input" value={item.value} placeholder="1 год"
                               onChange={(event) => setWarranty(index, "value", event.target.value)} />
                        <input className="a-input" value={item.note} placeholder="Пояснение (необязательно)"
                               onChange={(event) => setWarranty(index, "note", event.target.value)} />
                        <button type="button" className="a-btn a-btn-danger" title="Удалить"
                                onClick={() => set("warranty", form.warranty.filter((_, position) => position !== index))}>✕</button>
                    </div>
                ))}
                <button type="button" className="a-btn" onClick={() => set("warranty", [...form.warranty, {label: "", value: "", note: ""}])}>
                    Добавить гарантию
                </button>
            </section>

            <section className="a-card">
                <h2 className="a-h2">Преимущества</h2>
                <p className="a-note">Карточки с иконками между работами и стоимостью. Удалите все — блока не будет.</p>
                <Field label="Заголовок блока">
                    <input className="a-input" value={form.benefitsTitle} onChange={(event) => set("benefitsTitle", event.target.value)} />
                </Field>
                {form.benefits.map((benefit, index) => (
                    <div key={index} className="a-row" style={{marginBottom: 8, flexWrap: "nowrap"}}>
                        <input className="a-input" value={benefit}
                               onChange={(event) => set("benefits", form.benefits.map((entry, position) => (position === index ? event.target.value : entry)))} />
                        <button type="button" className="a-btn a-btn-danger" title="Удалить"
                                onClick={() => set("benefits", form.benefits.filter((_, position) => position !== index))}>✕</button>
                    </div>
                ))}
                {form.benefits.length < 10 ? (
                    <button type="button" className="a-btn" onClick={() => set("benefits", [...form.benefits, ""])}>Добавить пункт</button>
                ) : null}
            </section>

            <section className="a-card">
                <h2 className="a-h2">Обложка и завершение</h2>
                <div className="a-row" style={{marginBottom: 14}}>
                    {form.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.cover} alt="" style={{height: 72, borderRadius: 6}} />
                    ) : (
                        <span className="a-note" style={{margin: 0}}>Фото по умолчанию — Bi-LED-модули на верстаке</span>
                    )}
                    <input ref={fileInput} type="file" accept="image/*" hidden
                           onChange={(event) => event.target.files?.[0] && uploadCover(event.target.files[0])} />
                    <button type="button" className="a-btn" disabled={uploading} onClick={() => fileInput.current?.click()}>
                        {uploading ? <span className="a-spin" /> : null} Загрузить своё фото
                    </button>
                    {form.cover ? <button type="button" className="a-btn" onClick={() => set("cover", "")}>Вернуть стандартное</button> : null}
                </div>
                <Field label="Заключительная фраза на последней странице" hint="Пусто — без неё">
                    <input className="a-input" value={form.closing} onChange={(event) => set("closing", event.target.value)} />
                </Field>
            </section>

            <section className="a-card">
                <div className="a-row" style={{justifyContent: "space-between"}}>
                    <h2 className="a-h2" style={{margin: 0}}>Предпросмотр КП № {number}</h2>
                    <span className="a-note" style={{margin: 0}}>{dirty ? "Обновится после сохранения" : "Совпадает с PDF"}</span>
                </div>
                <iframe key={version} className="a-kp-preview" src={`/admin/kp/${id}/view`} title="Предпросмотр КП" />
            </section>
        </>
    );
};

const EXECUTOR_FIELDS: {key: keyof Executor; label: string; hint?: string}[] = [
    {key: "name", label: "Название"},
    {key: "address", label: "Адрес"},
    {key: "unp", label: "УНП"},
    {key: "phone", label: "Телефон"},
    {key: "directorTitle", label: "Должность подписанта", hint: "Как в строке подписи"},
    {key: "directorName", label: "ФИО подписанта"},
    {key: "account", label: "Расчётный счёт"},
    {key: "currency", label: "Валюта счёта"},
    {key: "bank", label: "Банк"},
    {key: "bic", label: "БИК"},
    {key: "vatNote", label: "Строка про НДС", hint: "Пусто — строки не будет"},
];

export const ExecutorForm = ({initial}: {initial: Executor}) => {
    const [form, setForm] = useState(initial);
    const [result, setResult] = useState<ActionResult | null>(null);
    const [pending, startTransition] = useTransition();

    return (
        <section className="a-card">
            <div className="a-grid2">
                {EXECUTOR_FIELDS.map((field) => (
                    <Field key={field.key} label={field.label} hint={field.hint}>
                        <input className="a-input" value={form[field.key]}
                               onChange={(event) => setForm((current) => ({...current, [field.key]: event.target.value}))} />
                    </Field>
                ))}
            </div>
            <button type="button" className="a-btn a-btn-primary" disabled={pending}
                    onClick={() => startTransition(async () => setResult(await saveExecutorAction(form)))}>
                Сохранить
            </button>
            <Result result={result} />
        </section>
    );
};

export const DeleteProposalButton = ({id, number}: {id: number; number: number}) => (
    <form action={deleteProposalAction.bind(null, id)}
          onSubmit={(event) => {
              if (!window.confirm(`Удалить КП № ${number}? Вернуть его будет нельзя.`)) event.preventDefault();
          }}>
        <button className="a-btn a-btn-danger">Удалить</button>
    </form>
);
