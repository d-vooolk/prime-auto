import {getDb, getSetting, setSetting} from "./db";

/**
 * Коммерческие предложения: раздел «КП» в админке.
 *
 * Админ заполняет форму — клиент, список работ с ценами, сроки, гарантии, —
 * а документ собирается из одной HTML-вёрстки (src/lib/proposal-html.ts):
 * она же показывается в предпросмотре и печатается в PDF через Chromium
 * (src/lib/proposal-pdf.ts). Реквизиты исполнителя общие для всех КП и живут
 * в настройках, а не в каждом документе.
 */

export interface ProposalItem {
    title: string;
    /** Цена в BYN; null — позиция без отдельной цены («входит в стоимость») */
    price: number | null;
}

export interface WarrantyItem {
    label: string;
    value: string;
    note: string;
}

export interface ProposalData {
    /** Дата документа, YYYY-MM-DD */
    date: string;
    clientName: string;
    clientAddress: string;
    clientUnp: string;
    /** Обращение целиком: «Уважаемый Олег Иванович!» */
    greeting: string;
    subject: string;
    vehicle: string;
    vehicleNote: string;
    /** Вводный абзац; {авто} заменяется на автомобиль */
    intro: string;
    itemsLead: string;
    items: ProposalItem[];
    /** Итог вручную (скидка, округление); null — сумма позиций */
    totalOverride: number | null;
    /** Показывать сумму по позициям и скидку, если итог задан вручную */
    showDiscount: boolean;
    totalNote: string;
    benefitsTitle: string;
    benefits: string[];
    termTitle: string;
    termValue: string;
    termNote: string;
    warrantyTitle: string;
    warranty: WarrantyItem[];
    closing: string;
    /** Фото обложки из /uploads; пусто — фото по умолчанию */
    cover: string;
}

export interface Proposal {
    id: number;
    number: number;
    createdAt: number;
    updatedAt: number;
    data: ProposalData;
}

export interface ProposalSummary {
    id: number;
    number: number;
    client: string;
    total: number;
    date: string;
    updatedAt: number;
}

export interface Executor {
    name: string;
    address: string;
    unp: string;
    phone: string;
    directorTitle: string;
    directorName: string;
    account: string;
    currency: string;
    bank: string;
    bic: string;
    vatNote: string;
}

export const DEFAULT_EXECUTOR: Executor = {
    name: "ООО «Первый Автосвет»",
    address: "220039, Республика Беларусь, г. Минск, Брилевский тупик, 5",
    unp: "193897412",
    phone: "+375 33 665 54 49",
    directorTitle: "Директор ООО «Первый Автосвет»",
    directorName: "Волк Дмитрий Иванович",
    account: "BY66ALFA30122H40890010270000",
    currency: "BYN",
    bank: "ЗАО «Альфа-Банк»",
    bic: "ALFABY2X",
    vatNote: "НДС не облагается.",
};

const EXECUTOR_KEY = "proposals:executor";

const today = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export const defaultProposalData = (): ProposalData => ({
    date: today(),
    clientName: "",
    clientAddress: "",
    clientUnp: "",
    greeting: "",
    subject: "На модернизацию автомобильной оптики",
    vehicle: "",
    vehicleNote: "",
    intro:
        "ООО «Первый Автосвет» предлагает комплексную модернизацию автомобильной оптики {авто}, направленную на повышение эффективности освещения, улучшение видимости в тёмное время суток и обновление внешнего вида автомобиля.",
    itemsLead: "В рамках выполнения работ предусматривается:",
    items: [{title: "", price: null}],
    totalOverride: null,
    showDiscount: false,
    totalNote: "В стоимость включены оборудование, комплектующие, расходные материалы и выполнение всех перечисленных работ.",
    benefitsTitle: "Преимущества двухчиповых Bi-LED-модулей",
    benefits: [
        "Яркий и широкий световой пучок ближнего света.",
        "Мощный направленный дальний свет.",
        "Улучшенное освещение дорожного полотна.",
        "Более комфортное и безопасное управление автомобилем в тёмное время суток.",
        "Повышение общей эффективности автомобильной оптики.",
    ],
    termTitle: "Срок выполнения работ",
    termValue: "",
    termNote: "с момента передачи автомобиля исполнителю.",
    warrantyTitle: "Гарантийные обязательства",
    warranty: [
        {label: "На выполненные работы", value: "1 год", note: ""},
        {label: "На Bi-LED-модули", value: "от 1 до 2 лет", note: "в зависимости от производителя и модели оборудования"},
    ],
    closing: "Благодарим за внимание к нашему предложению и будем рады сотрудничеству.",
    cover: "",
});

/* ------------------------------------------------------------------ */
/* Проверка ввода                                                      */
/* ------------------------------------------------------------------ */

const text = (value: unknown, limit: number): string => (typeof value === "string" ? value.trim().slice(0, limit) : "");

const money = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "") return null;
    const number = typeof value === "number" ? value : Number(String(value).replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) / 100 : null;
};

const list = <T>(value: unknown, limit: number, map: (entry: unknown) => T | null): T[] =>
    (Array.isArray(value) ? value : []).slice(0, limit).map(map).filter((entry): entry is T => entry !== null);

const record = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

/** Приводит присланное из формы к ProposalData: обрезает, выкидывает пустые строки списков */
export const cleanProposalData = (input: unknown): ProposalData => {
    const raw = record(input);
    const date = text(raw.date, 10);
    return {
        date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today(),
        clientName: text(raw.clientName, 300),
        clientAddress: text(raw.clientAddress, 500),
        clientUnp: text(raw.clientUnp, 30),
        greeting: text(raw.greeting, 200),
        subject: text(raw.subject, 300),
        vehicle: text(raw.vehicle, 200),
        vehicleNote: text(raw.vehicleNote, 200),
        intro: text(raw.intro, 2000),
        itemsLead: text(raw.itemsLead, 300),
        items: list(raw.items, 60, (entry) => {
            const item = record(entry);
            const title = text(item.title, 500);
            return title ? {title, price: money(item.price)} : null;
        }),
        totalOverride: money(raw.totalOverride),
        showDiscount: raw.showDiscount === true,
        totalNote: text(raw.totalNote, 600),
        benefitsTitle: text(raw.benefitsTitle, 200),
        benefits: list(raw.benefits, 10, (entry) => text(entry, 300) || null),
        termTitle: text(raw.termTitle, 200),
        termValue: text(raw.termValue, 200),
        termNote: text(raw.termNote, 300),
        warrantyTitle: text(raw.warrantyTitle, 200),
        warranty: list(raw.warranty, 6, (entry) => {
            const item = record(entry);
            const label = text(item.label, 200);
            const value = text(item.value, 100);
            return label || value ? {label, value, note: text(item.note, 300)} : null;
        }),
        closing: text(raw.closing, 600),
        cover: text(raw.cover, 300),
    };
};

/* ------------------------------------------------------------------ */
/* Суммы                                                               */
/* ------------------------------------------------------------------ */

export const itemsSum = (data: ProposalData): number =>
    Math.round(data.items.reduce((sum, item) => sum + (item.price ?? 0), 0) * 100) / 100;

export const proposalTotal = (data: ProposalData): number => data.totalOverride ?? itemsSum(data);

/** «3 500,00» — как в банковских документах: пробел между тысячами, запятая перед копейками */
export const formatMoney = (value: number): string => {
    const [whole, cents] = value.toFixed(2).split(".");
    return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${cents}`;
};

/* ------------------------------------------------------------------ */
/* Хранение                                                            */
/* ------------------------------------------------------------------ */

interface ProposalRow {
    id: number;
    number: number;
    client: string;
    total: number;
    data: string;
    created_at: number;
    updated_at: number;
}

const parseData = (json: string): ProposalData => ({...defaultProposalData(), ...cleanProposalData(JSON.parse(json))});

const toProposal = (row: ProposalRow): Proposal => ({
    id: row.id,
    number: row.number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    data: parseData(row.data),
});

export const listProposals = (): ProposalSummary[] =>
    (getDb().prepare("SELECT id, number, client, total, data, updated_at FROM proposals ORDER BY number DESC").all() as ProposalRow[])
        .map((row) => ({
            id: row.id,
            number: row.number,
            client: row.client,
            total: row.total,
            date: parseData(row.data).date,
            updatedAt: row.updated_at,
        }));

export const getProposal = (id: number): Proposal | null => {
    const row = getDb().prepare("SELECT * FROM proposals WHERE id = ?").get(id) as ProposalRow | undefined;
    return row ? toProposal(row) : null;
};

const nextNumber = (): number =>
    ((getDb().prepare("SELECT MAX(number) AS last FROM proposals").get() as {last: number | null}).last ?? 0) + 1;

export const createProposal = (data: ProposalData): number => {
    const now = Date.now();
    return Number(
        getDb()
            .prepare("INSERT INTO proposals (number, client, total, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
            .run(nextNumber(), data.clientName, proposalTotal(data), JSON.stringify(data), now, now).lastInsertRowid,
    );
};

export const updateProposal = (id: number, data: ProposalData): void => {
    getDb()
        .prepare("UPDATE proposals SET client = ?, total = ?, data = ?, updated_at = ? WHERE id = ?")
        .run(data.clientName, proposalTotal(data), JSON.stringify(data), Date.now(), id);
};

export const deleteProposal = (id: number): void => {
    getDb().prepare("DELETE FROM proposals WHERE id = ?").run(id);
};

/* ------------------------------------------------------------------ */
/* Реквизиты исполнителя                                               */
/* ------------------------------------------------------------------ */

export const getExecutor = (): Executor => {
    try {
        return {...DEFAULT_EXECUTOR, ...JSON.parse(getSetting(EXECUTOR_KEY) ?? "{}")};
    } catch {
        return DEFAULT_EXECUTOR;
    }
};

export const saveExecutor = (input: unknown): Executor => {
    const raw = record(input);
    const executor = Object.fromEntries(
        (Object.keys(DEFAULT_EXECUTOR) as (keyof Executor)[]).map((key) => [key, text(raw[key], 300)]),
    ) as unknown as Executor;
    setSetting(EXECUTOR_KEY, JSON.stringify(executor));
    return executor;
};
