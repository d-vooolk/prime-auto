export const METRIKA_ID = 103843698;

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

/* До загрузки tag.js вызов ложится в очередь заглушки ym и уходит после init */
export const reachGoal = (goal) => {
    if (typeof window === 'undefined' || typeof window.ym !== 'function') {
        return;
    }
    window.ym(METRIKA_ID, 'reachGoal', goal);
};

export const goalForLink = (href) => LINK_GOALS.find(([pattern]) => pattern.test(href))?.[1] ?? null;
