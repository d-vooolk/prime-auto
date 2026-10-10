/*
  Контекст заявки — чтобы мастер сразу видел, о чём разговор:
  с какой страницы отправлена заявка и откуда человек пришёл на сайт.
  Вход на сайт запоминает PageViewTracker (sessionStorage, только эта вкладка).
*/

export const ENTRY_STORAGE_KEY = "prime-entry";

export const rememberEntry = (referrer: string, utm: string) => {
    try {
        sessionStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify({referrer, utm}));
    } catch {
        /* приватный режим — без контекста */
    }
};

const describeSource = (referrer: string, utm: string): string => {
    if (utm) return `реклама/метка: ${utm}`;
    if (!referrer) return "прямой заход (набрал адрес, закладка или мессенджер)";
    let host = referrer;
    try {
        host = new URL(referrer).hostname.replace(/^www\./, "");
    } catch {
        /* оставим как есть */
    }
    if (/yandex|ya\.ru/.test(host)) return /maps/.test(referrer) ? "Яндекс Карты" : `поиск Яндекса (${host})`;
    if (/google/.test(host)) return /maps/.test(referrer) ? "Google Карты" : "поиск Google";
    if (/instagram/.test(host)) return "Instagram";
    return host;
};

export const leadContext = (): {page: string; source: string} => {
    if (typeof window === "undefined") return {page: "", source: ""};
    const title = document.title.replace(/\s*[|—-]\s*Prime Auto.*$/i, "").trim();
    let source = "";
    try {
        const entry = JSON.parse(sessionStorage.getItem(ENTRY_STORAGE_KEY) ?? "null");
        if (entry) source = describeSource(entry.referrer ?? "", entry.utm ?? "");
    } catch {
        source = "";
    }
    return {page: `${title} — ${window.location.pathname}`, source};
};

/** Сжать фото перед отправкой: до 1280 px по длинной стороне, JPEG ~200 КБ */
export const shrinkImage = (file: File, max = 1280): Promise<string> =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("не картинка"));
        };
        img.src = url;
    });
