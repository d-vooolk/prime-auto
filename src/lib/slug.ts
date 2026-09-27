/**
 * Перевод заголовка в адрес статьи: «Почему потеют фары» -> «pochemu-poteyut-fary».
 * Та же таблица, что у старых статей и у vdf.by: «щ» -> «sch», «й» -> «y»,
 * мягкий и твёрдый знаки выбрасываются.
 */

const MAP: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya", і: "i", ў: "u",
};

export const toSlug = (value: string, limit = 70): string =>
    String(value)
        .toLowerCase()
        .split("")
        .map((char) => (char in MAP ? MAP[char] : char))
        .join("")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, limit)
        .replace(/-+$/g, "");
