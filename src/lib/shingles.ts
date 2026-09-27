/**
 * Шинглы — цепочки из пяти слов подряд. На них держатся все проверки
 * уникальности: совпадение одной цепочки бывает случайным («установка bi led
 * модулей в фары»), совпадение нескольких подряд — уже заимствование.
 */

export const SHINGLE = 5;

export const words = (text: string): string[] =>
    text
        .toLowerCase()
        .replace(/ё/g, "е")
        .split(/[^a-zа-я0-9]+/i)
        .filter(Boolean);

export const shingles = (text: string): string[] => {
    const list = words(text);
    const result: string[] = [];
    for (let index = 0; index + SHINGLE <= list.length; index += 1) {
        result.push(list.slice(index, index + SHINGLE).join(" "));
    }
    return result;
};
