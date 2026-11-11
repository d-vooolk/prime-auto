import fs from "node:fs";
import path from "node:path";
import {
    formatMoney,
    getExecutor,
    itemsSum,
    proposalTotal,
    type Executor,
    type Proposal,
    type ProposalData,
} from "./proposals";
import {UPLOADS_DIR, UPLOADS_URL} from "./uploads";

/**
 * HTML коммерческого предложения — один и тот же для предпросмотра в
 * админке и для печати в PDF (src/lib/proposal-pdf.ts).
 *
 * Документ самодостаточный: стили, шрифт, логотипы и фото вшиты в него как
 * data:-адреса, поэтому Chromium печатает его из временного файла без
 * обращений к сайту и без куки админки.
 *
 * Страницы обложки и реквизитов фиксированы, а середина — сколько выйдет:
 * работ может быть 3, а может быть 25. Блоки (вступление, строки таблицы,
 * преимущества, стоимость) раскладывает по листам A4 скрипт в конце
 * документа: кладёт блок на страницу и, если он не влез, переносит на новую.
 * Считать высоты на сервере нельзя — их знает только браузер со шрифтом.
 */

const ASSETS = path.join(process.cwd(), "assets", "proposal");
const PUBLIC = path.join(process.cwd(), "public");

const MIME: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
};

const dataUrl = (file: string): string =>
    `data:${MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream"};base64,${fs.readFileSync(file).toString("base64")}`;

/* Фото обложки: загруженное в админке (/uploads/…) или стандартное */
const coverFile = (cover: string): string => {
    if (cover.startsWith(`${UPLOADS_URL}/`)) {
        const file = path.resolve(UPLOADS_DIR, cover.slice(UPLOADS_URL.length + 1));
        if (file.startsWith(path.resolve(UPLOADS_DIR) + path.sep) && fs.existsSync(file)) return file;
    }
    return path.join(ASSETS, "cover.jpg");
};

const escape = (value: string): string =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/*
  Короткие предлоги и союзы не должны висеть в конце строки: «в / тёмное
  время» читается хуже, чем «в тёмное / время». Неразрывный пробел после них.
*/
const typo = (value: string): string =>
    escape(value).replace(/(^|[\s(«])((?:[а-яёА-ЯЁ]{1,2}|г\.|ул\.|д\.|№)) /g, "$1$2 ").replace(/(\d) (BYN|р\.|руб\.)/g, "$1 $2");

const lines = (value: string): string => value.split(/\r?\n/).map((line) => typo(line.trim())).filter(Boolean).join("<br>");

const formatDate = (iso: string): string => {
    const [year, month, day] = iso.split("-");
    return `${day}.${month}.${year}`;
};

const ICONS = [
    '<circle cx="11" cy="16" r="6"/><path d="M19 10h10M19 16h11M19 22h10"/>',
    '<path d="M4 16h4M10 16h18M23 11l5 5-5 5"/><circle cx="6" cy="16" r="2.4"/>',
    '<path d="M12 4 6 28M20 4l6 24M16 6v4M16 14v4M16 22v4"/>',
    '<path d="M16 4 6 8v7c0 6.5 4.3 11.2 10 13 5.7-1.8 10-6.5 10-13V8z"/><path d="m11.5 16 3.2 3.2 6-6.4"/>',
    '<path d="M5 22a11 11 0 1 1 22 0"/><path d="m16 22 6-7"/><circle cx="16" cy="22" r="1.6"/>',
    '<circle cx="16" cy="16" r="11"/><path d="M16 9v7l5 3"/>',
];

const sectionTitle = (number: string, title: string, dark = false, extra = ""): string =>
    `<div class="section-title${dark ? " section-title-dark" : ""}"><span class="num">${number}</span><h2>${typo(title)}${extra}</h2></div>`;

const pad = (value: number): string => String(value).padStart(2, "0");

interface Assets {
    css: string;
    font: string;
    darkLogo: string;
    lightLogo: string;
    cover: string;
}

const loadAssets = (data: ProposalData): Assets => ({
    css: fs.readFileSync(path.join(ASSETS, "proposal.css"), "utf8"),
    font: dataUrl(path.join(ASSETS, "Manrope.ttf")),
    darkLogo: dataUrl(path.join(PUBLIC, "dark-logo.svg")),
    lightLogo: dataUrl(path.join(PUBLIC, "logo.svg")),
    cover: dataUrl(coverFile(data.cover)),
});

const vehicleText = (data: ProposalData): string => [data.vehicle, data.vehicleNote].filter(Boolean).join(" ");

const renderCover = (proposal: Proposal, executor: Executor, assets: Assets): string => {
    const {data} = proposal;
    const client = data.clientName
        ? `<div class="cover-card">
             <div class="label">Заказчик</div>
             <div class="cover-card-name">${typo(data.clientName)}</div>
             ${data.clientAddress ? `<p>${lines(data.clientAddress)}</p>` : ""}
             ${data.clientUnp ? `<p class="muted-light">УНП ${escape(data.clientUnp)}</p>` : ""}
           </div>`
        : "";
    const addressee = data.greeting
        ? `<div class="cover-card"><div class="label">Адресат</div><div class="cover-card-greeting">${typo(data.greeting)}</div></div>`
        : "";
    const cards = [client, addressee].filter(Boolean);

    return `
<section class="page page-cover">
  <div class="cover-photo"><img src="${assets.cover}" alt=""></div>
  <div class="cover-shade"></div>
  <div class="band band-graphite cover-band-1"></div>
  <div class="band band-bronze cover-band-2"></div>
  <div class="band band-graphite-light cover-band-3"></div>
  <div class="edge-line"></div>
  <header class="cover-head">
    <img class="logo logo-cover" src="${assets.darkLogo}" alt="PRIME AUTO">
    <div class="cover-head-meta">
      <span>${typo(executor.name)}</span>
      <span>КП №&nbsp;${proposal.number} от&nbsp;${formatDate(data.date)}</span>
    </div>
  </header>
  <div class="cover-title">
    <div class="eyebrow">${typo(data.subject.replace(/^на\s+/i, "")) || "Коммерческое предложение"}</div>
    <h1>Коммерческое<br>предложение</h1>
    <div class="rule"></div>
    <p class="cover-sub">${typo(data.subject)}${data.vehicle ? `<br><strong>${typo(data.vehicle)}</strong>` : ""}${data.vehicleNote ? ` ${typo(data.vehicleNote)}` : ""}</p>
  </div>
  ${cards.length ? `<div class="cover-cards${cards.length === 1 ? " cover-cards-single" : ""}">${cards.join("")}</div>` : ""}
</section>`;
};

const renderFlowTemplate = (proposal: Proposal, executor: Executor, assets: Assets): string => `
<template id="flow-page">
  <section class="page page-light">
    <div class="edge-strip"></div>
    <div class="band band-graphite light-band-1"></div>
    <div class="band band-bronze light-band-2"></div>
    <header class="page-head">
      <img class="logo logo-small" src="${assets.lightLogo}" alt="PRIME AUTO">
      <div class="page-head-meta">КП №&nbsp;${proposal.number}${proposal.data.vehicle ? ` · ${typo(proposal.data.vehicle)}` : ""}</div>
    </header>
    <div class="flow"></div>
    <footer class="page-foot"><span>PRIME AUTO · ${typo(executor.name)}</span><span class="page-no"></span></footer>
  </section>
</template>`;

const renderBlocks = (data: ProposalData, executor: Executor): {html: string; continued: string; lastNumber: number} => {
    let section = 0;
    const next = () => pad(++section);
    const blocks: string[] = [];

    const intro = data.intro.replace(/\{авто\}/g, vehicleText(data)).replace(/\s+([,.])/g, "$1");
    if (data.greeting || intro) {
        blocks.push(`<div class="intro">${data.greeting ? `<p class="greeting">${typo(data.greeting)}</p>` : ""}${intro ? `<p>${typo(intro)}</p>` : ""}</div>`);
    }

    const sum = itemsSum(data);
    const total = proposalTotal(data);
    const overridden = data.totalOverride !== null && data.totalOverride !== sum;
    const hasPrices = data.items.some((item) => item.price !== null);
    const itemsNumber = next();
    const itemsHead = `<div class="items-head"><span>№</span><span>Наименование работ</span><span>${hasPrices ? "Стоимость, BYN" : ""}</span></div>`;
    let continued = "";

    if (data.items.length) {
        blocks.push(
            `<div class="keep">${sectionTitle(itemsNumber, "Предлагаемый комплекс работ")}${data.itemsLead ? `<p class="lead-small">${typo(data.itemsLead)}</p>` : ""}${itemsHead}</div>`,
        );
        continued = `<div class="keep">${sectionTitle(itemsNumber, "Предлагаемый комплекс работ", false, " <small>— продолжение</small>")}${itemsHead}</div>`;
        const showSum = hasPrices && (!overridden || data.showDiscount);
        data.items.forEach((item, index) => {
            const last = index === data.items.length - 1 && !showSum;
            const price = item.price === null
                ? hasPrices ? '<span class="cost-included">входит</span>' : ""
                : formatMoney(item.price);
            blocks.push(
                `<div class="item${last ? " item-last" : ""}" data-row><span class="n">${pad(index + 1)}</span><span>${typo(item.title)}</span><span class="cost">${price}</span></div>`,
            );
        });
        if (showSum) {
            blocks.push(`<div class="items-sum"><span class="title">Итого по позициям</span><span class="cost">${formatMoney(sum)}&nbsp;BYN</span></div>`);
        }
    }

    if (data.benefits.length) {
        const cols = data.benefits.length <= 5 ? data.benefits.length : Math.ceil(data.benefits.length / 2);
        blocks.push(`<div>${sectionTitle(next(), data.benefitsTitle || "Преимущества")}
  <div class="benefits" style="--cols:${cols}">${data.benefits
            .map((benefit, index) => `<div class="benefit"><svg viewBox="0 0 32 32">${ICONS[index % ICONS.length]}</svg><p>${typo(benefit)}</p></div>`)
            .join("")}</div></div>`);
    }

    const discount = overridden && data.showDiscount && data.totalOverride! < sum
        ? `<div class="price-breakdown"><div><span>Сумма по позициям</span><s>${formatMoney(sum)}&nbsp;BYN</s></div><div><span>Скидка</span><strong>−${formatMoney(sum - total)}&nbsp;BYN</strong></div></div>`
        : "";
    const plate = `<div class="price-plate">
    <div class="price-band"></div>
    ${sectionTitle(next(), "Стоимость комплекса работ", true)}
    ${discount}
    <div class="price">${formatMoney(total)}&nbsp;<span>BYN</span></div>
    <div class="rule-wide"></div>
    ${data.totalNote ? `<p>${typo(data.totalNote)}</p>` : ""}
    ${executor.vatNote ? `<p class="vat">${typo(executor.vatNote)}</p>` : ""}
  </div>`;

    const cards: string[] = [];
    if (data.termValue) {
        cards.push(`<div class="term-card">${sectionTitle(next(), data.termTitle || "Срок выполнения работ")}
      <div class="term-value">${typo(data.termValue)}</div>${data.termNote ? `<p>${typo(data.termNote)}</p>` : ""}</div>`);
    }
    if (data.warranty.length) {
        cards.push(`<div class="term-card">${sectionTitle(next(), data.warrantyTitle || "Гарантийные обязательства")}
      <ul class="warranty">${data.warranty
            .map((item) => `<li><span>${typo(item.label)}</span><strong>${typo(item.value)}</strong>${item.note ? `<em>${typo(item.note)}</em>` : ""}</li>`)
            .join("")}</ul></div>`);
    }
    blocks.push(`<div class="terms${cards.length ? "" : " terms-single"}">${plate}${cards.length ? `<div class="term-cards">${cards.join("")}</div>` : ""}</div>`);

    return {html: blocks.join("\n"), continued, lastNumber: section};
};

const renderFinal = (data: ProposalData, executor: Executor, assets: Assets, number: string, proposalNumber: number): string => {
    const fact = (label: string, value: string) => (value ? `<div><dt>${label}</dt><dd>${typo(value)}</dd></div>` : "");
    const bank = (label: string, value: string, mono = false) =>
        value ? `<div><dt>${label}</dt><dd${mono ? ' class="mono"' : ""}>${escape(value)}</dd></div>` : "";

    return `
<section class="page page-dark page-final">
  <div class="band band-graphite final-band-1"></div>
  <div class="band band-bronze final-band-2"></div>
  <div class="band band-graphite-light final-band-3"></div>
  <div class="edge-line"></div>
  <header class="page-head">
    <img class="logo logo-small" src="${assets.darkLogo}" alt="PRIME AUTO">
    <div class="page-head-meta">КП №&nbsp;${proposalNumber}${data.vehicle ? ` · ${typo(data.vehicle)}` : ""}</div>
  </header>
  <div class="final-body">
    ${sectionTitle(number, "Исполнитель", true)}
    <div class="executor-name">${typo(executor.name)}</div>
    <dl class="facts">
      ${fact("Адрес", executor.address)}
      ${fact("УНП", executor.unp)}
      ${fact("Телефон", executor.phone)}
    </dl>
    ${data.closing ? `<div class="closing"><div class="rule"></div><p>${typo(data.closing)}</p></div>` : '<div class="final-gap"></div>'}
    <div class="sign-card">
      <div>
        <div class="label label-dark">Подпись</div>
        <div class="sign-title">${typo(executor.directorTitle)}</div>
        <div class="sign-line"></div>
        <div class="sign-name">${typo(executor.directorName)}</div>
      </div>
      <div class="stamp-place"><span>М.&nbsp;П.</span></div>
    </div>
    <div class="bank-card">
      <div class="label label-dark">Банковские реквизиты</div>
      <div class="bank-company">${typo(executor.name)}</div>
      <dl class="bank">
        ${bank("УНП", executor.unp)}
        ${bank("Расчётный счёт", executor.account, true)}
        ${bank("Валюта счёта", executor.currency)}
        ${bank("Банк", executor.bank)}
        ${bank("БИК", executor.bic, true)}
      </dl>
      ${executor.vatNote ? `<p class="vat vat-dark">${typo(executor.vatNote)}</p>` : ""}
    </div>
  </div>
  <footer class="final-foot">
    <img class="logo logo-foot" src="${assets.darkLogo}" alt="PRIME AUTO">
    <div class="final-phone">${escape(executor.phone)}</div>
    <span class="page-no"></span>
  </footer>
</section>`;
};

/*
  Раскладка по страницам. Блок с классом keep (заголовок таблицы) не остаётся
  последним на листе — уезжает вместе со следующим. Если на новый лист
  переехала строка таблицы, перед ней повторяется шапка «— продолжение».
  В конце проставляются номера страниц и ставится флаг для печати.
*/
const PAGINATE = `
(() => {
  const run = () => {
    const blocks = [...document.getElementById("blocks").children];
    const template = document.getElementById("flow-page");
    const continued = document.getElementById("continued");
    const final = document.querySelector(".page-final");
    let flow;
    const newPage = () => {
      const page = template.content.firstElementChild.cloneNode(true);
      final.before(page);
      flow = page.querySelector(".flow");
    };
    const overflows = () => flow.lastElementChild.getBoundingClientRect().bottom > flow.getBoundingClientRect().bottom + 0.5;
    newPage();
    for (const block of blocks) {
      flow.append(block);
      if (!overflows()) continue;
      const carry = [block];
      while (carry[0].previousElementSibling && carry[0].previousElementSibling.classList.contains("keep")) {
        carry.unshift(carry[0].previousElementSibling);
      }
      if (carry.length === flow.children.length) continue;
      newPage();
      if (carry[0].hasAttribute("data-row") && continued.content.firstElementChild) {
        flow.append(continued.content.firstElementChild.cloneNode(true));
      }
      carry.forEach((item) => flow.append(item));
    }
    const pages = document.querySelectorAll(".page");
    const pad = (value) => String(value).padStart(2, "0");
    pages.forEach((page, index) => {
      const label = page.querySelector(".page-no");
      if (label) label.textContent = pad(index + 1) + " / " + pad(pages.length);
    });
    document.documentElement.dataset.ready = "1";
  };
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(run);
})();
`;

export const renderProposalHtml = (proposal: Proposal, executor: Executor = getExecutor()): string => {
    const assets = loadAssets(proposal.data);
    const blocks = renderBlocks(proposal.data, executor);
    const title = `КП № ${proposal.number}${proposal.data.clientName ? ` — ${proposal.data.clientName}` : ""}`;

    return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${escape(title)}</title>
<style>
@font-face { font-family: "Manrope"; src: url("${assets.font}") format("truetype"); font-weight: 200 800; }
${assets.css}
</style>
</head>
<body>
${renderCover(proposal, executor, assets)}
${renderFlowTemplate(proposal, executor, assets)}
<template id="continued">${blocks.continued}</template>
<div id="blocks" hidden>
${blocks.html}
</div>
${renderFinal(proposal.data, executor, assets, pad(blocks.lastNumber + 1), proposal.number)}
<script>${PAGINATE}</script>
</body>
</html>`;
};

/** Имя файла для скачивания: «КП_12_Житковичский_коммунальник.pdf» */
export const proposalFileName = (proposal: Proposal): string => {
    const client = proposal.data.clientName.replace(/[«»"'`]/g, "").replace(/[^0-9A-Za-zА-Яа-яЁё]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
    return `КП_${proposal.number}${client ? `_${client}` : ""}.pdf`;
};
