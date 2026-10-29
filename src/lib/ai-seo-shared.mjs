/**
 * Общее для AI-SEO: админки (src/lib/ai-seo.ts) и сборщика по cron
 * (scripts/ai-seo-collect.mjs). На чистом JavaScript — скрипту TypeScript
 * недоступен.
 */

/**
 * ИИ-боты. kind:
 *   answer — страницу открыли во время ответа живому человеку (самый ценный
 *            сигнал: нейросеть взяла нас в ответ);
 *   search — индексация для поиска внутри нейросети;
 *   train  — сбор текстов для обучения;
 *   other  — прочий сбор (исследования, проверки).
 * ips — официальный список адресов. Где его нет, бот засчитывается, только
 * если с того же IP не было сканирования (.env, .git и т. п.): под ИИ-ботов
 * массово маскируются сканеры уязвимостей — в октябре 2026 это 70–100%
 * «заходов» ChatGPT-User, Claude-User, Perplexity-User.
 */
export const AI_BOTS = [
  {id: 'ChatGPT-User', owner: 'ChatGPT', kind: 'answer', ips: ['https://openai.com/chatgpt-user.json']},
  {id: 'OAI-SearchBot', owner: 'ChatGPT', kind: 'search', ips: ['https://openai.com/searchbot.json']},
  {id: 'GPTBot', owner: 'ChatGPT', kind: 'train', ips: ['https://openai.com/gptbot.json']},
  {id: 'Perplexity-User', owner: 'Perplexity', kind: 'answer', ips: ['https://www.perplexity.com/perplexity-user.json']},
  {id: 'PerplexityBot', owner: 'Perplexity', kind: 'search', ips: ['https://www.perplexity.com/perplexitybot.json']},
  {id: 'Claude-User', owner: 'Claude', kind: 'answer'},
  {id: 'Claude-SearchBot', owner: 'Claude', kind: 'search'},
  {id: 'ClaudeBot', owner: 'Claude', kind: 'train'},
  {id: 'DuckAssistBot', owner: 'DuckDuckGo', kind: 'answer'},
  {id: 'MistralAI-User', owner: 'Mistral', kind: 'answer'},
  {id: 'YandexAdditional', owner: 'Яндекс (Нейро)', kind: 'search'},
  {id: 'GoogleOther', owner: 'Google', kind: 'other', ips: ['https://developers.google.com/static/search/apis/ipranges/googlebot.json', 'https://developers.google.com/static/search/apis/ipranges/special-crawlers.json']},
  {id: 'bingbot', owner: 'Bing (Copilot, ChatGPT)', kind: 'search', ips: ['https://www.bing.com/toolbox/bingbot.json']},
  {id: 'Applebot', owner: 'Apple', kind: 'search'},
  {id: 'meta-externalagent', owner: 'Meta AI', kind: 'train'},
  {id: 'Amazonbot', owner: 'Amazon', kind: 'train'},
  {id: 'Bytespider', owner: 'ByteDance', kind: 'train'},
  {id: 'CCBot', owner: 'Common Crawl', kind: 'train'},
  {id: 'DeepSeekBot', owner: 'DeepSeek', kind: 'train'},
];

/** Что запрашивают сканеры уязвимостей — по этому IP отбрасываем целиком */
export const SCANNER_PATH = /\.env|\.git|\/@fs|\.\.[/;%]|wp-|\.php|\.aws|credentials|\.ya?ml$|\.toml$|\.key$|\/proc\/|phpmyadmin|\.boto|\.profile|\.bash|\.idea|__vite|\/userfiles|\/api\/system|\/actuator|\/cgi-bin|\/vendor\/|\.json$/i;

/**
 * Страницы сайта. До 29.10.2026 лог был общий с соседними сайтами сервера
 * (crm, zapis) — берём только адреса prime-auto.by; «/» у них общий, поэтому
 * главная в те дни может быть чуть завышена.
 */
export const SITE_PATH = /^\/($|uslugi|stati|price|otzyvy|raboty|contacts|confidence-policy|robots\.txt$|sitemap\.xml$|llms\.txt$)/;

/** Статика: считаем только страницы */
export const STATIC_PATH = /^\/_next\/|^\/uploads\/|\.(png|jpe?g|webp|avif|svg|ico|css|js|map|woff2?)$/i;

/**
 * Переходы из нейросетей: по адресу, с которого пришли, или по utm_source
 * (ChatGPT ставит utm_source=chatgpt.com, а referrer часто срезает).
 */
export const AI_REFERRER = /(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com|perplexity\.ai|gemini\.google\.com|bard\.google\.com|copilot\.microsoft\.com|claude\.ai|chat\.deepseek\.com|deepseek\.com|grok\.com|x\.ai|you\.com|phind\.com|chat\.mistral\.ai|alice\.yandex\.ru|com\.yandex\.aliceapp|giga\.chat|gigachat\.ru|meta\.ai)$/i;

/** Вопрос, на который нейросеть ответит сама: «как / почему / можно ли…» и длинные запросы */
export const QUESTION_QUERY = /^(как|почему|что|чем|зачем|можно|нужно|надо|сколько|какие|какой|какая|какую|когда|где|стоит ли|отчего|нормально ли|законно|разрешено|пройд|прохо|если)\b|\?/i;

export const isQuestion = (query) => QUESTION_QUERY.test(query) || query.trim().split(/\s+/).length >= 5;

/** Брендовые запросы — по ним сайт и так первый, в «вопросы» не берём */
export const BRAND_QUERY = /прайм|prime|праим|primeauto|брилевск/i;

const LOG_LINE = /^(\S+) \S+ \S+ \[(\d{2})\/(\w{3})\/(\d{4}):[^\]]+\] "(\S+) (\S+)[^"]*" (\d{3}) \S+ "[^"]*" "([^"]*)"/;
const MONTHS = {Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'};

/**
 * Строка combined-лога nginx → {ip, day, path, status, ua} или null.
 * Время в логе — уже по Минску (+0300), день берём как есть.
 */
export function parseLogLine(line) {
  const m = LOG_LINE.exec(line);
  if (!m) return null;
  const [, ip, dd, mon, yyyy, , rawPath, status, ua] = m;
  return {ip, day: `${yyyy}-${MONTHS[mon] ?? '01'}-${dd}`, path: rawPath.split('?')[0], status: Number(status), ua};
}

export const botOf = (ua) => {
  const lower = ua.toLowerCase();
  return AI_BOTS.find((bot) => lower.includes(bot.id.toLowerCase())) ?? null;
};
