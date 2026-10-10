export const METRIKA_ID = 103843698;
/* GA4 — подключается напрямую (раньше через GTM) */
export const GA_ID = 'G-GLSYGY5T6Y';

/*
  Идентификаторы целей типа «JavaScript-событие». В счётчике цели заводятся
  вручную с теми же идентификаторами (Метрика → Цели), поэтому переименовывать
  их можно только вместе с целями.
*/
export const GOALS = {
    lead: 'lead_form',
    phone: 'click_phone',
    telegram: 'click_telegram',
    viber: 'click_viber',
    whatsapp: 'click_whatsapp',
    instagram: 'click_instagram',
};

const LINK_GOALS = [
    [/^tel:/i, GOALS.phone],
    [/^https?:\/\/t\.me\//i, GOALS.telegram],
    [/^viber:/i, GOALS.viber],
    [/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i, GOALS.whatsapp],
    [/^https?:\/\/(www\.)?instagram\.com\//i, GOALS.instagram],
];

/* События GA4 — те же имена, что были настроены в GTM, чтобы отчёты не разорвались */
const GA_EVENTS = {
    [GOALS.lead]: 'form_send',
    [GOALS.phone]: 'click_number',
    [GOALS.telegram]: 'click_messengers',
    [GOALS.viber]: 'click_messengers',
    [GOALS.whatsapp]: 'click_messengers',
    [GOALS.instagram]: 'click_social',
};

/* До загрузки tag.js вызов ложится в очередь заглушки ym и уходит после init; с gtag так же */
export const reachGoal = (goal) => {
    if (typeof window === 'undefined') {
        return;
    }
    if (typeof window.ym === 'function') {
        window.ym(METRIKA_ID, 'reachGoal', goal);
    }
    if (typeof window.gtag === 'function' && GA_EVENTS[goal]) {
        window.gtag('event', GA_EVENTS[goal], {event_label: goal});
    }
};

export const goalForLink = (href) => LINK_GOALS.find(([pattern]) => pattern.test(href))?.[1] ?? null;
