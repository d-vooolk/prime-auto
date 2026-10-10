/** 172 → «172 оценки», 109 → «109 отзывов». Без зависимостей — годится и для клиентских компонентов */
export const plural = (n: number, forms: [string, string, string]) => {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} ${forms[0]}`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${forms[1]}`;
    return `${n} ${forms[2]}`;
};
