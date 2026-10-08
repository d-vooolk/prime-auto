/*
  Сбор поисковой статистики prime-auto.by: Search Console, Яндекс.Вебмастер,
  Яндекс.Метрика. Перенесено с vdf.by (src/lib/seo-collect.mjs) — при
  изменениях там стоит переносить и сюда. Описание — docs/seo.md.
*/
import crypto from "node:crypto";
import fs from "node:fs";

const DAY_MS = 24 * 60 * 60 * 1000;
const GSC_LAG_DAYS = 3;
const HISTORY_DAYS = 90;

export const DEFAULT_SEO_SOURCES = {
  gscSite: "sc-domain:prime-auto.by",
  yandexHost: "https:prime-auto.by:443",
  metrikaCounter: "103843698",
};

export function isoDay(time) {
  return new Date(time).toISOString().slice(0, 10);
}

export function periods(days, lagDays) {
  const end = Date.now() - lagDays * DAY_MS;
  const start = end - (days - 1) * DAY_MS;
  const previousEnd = start - DAY_MS;
  const previousStart = previousEnd - (days - 1) * DAY_MS;
  return {
    current: { from: isoDay(start), to: isoDay(end) },
    previous: { from: isoDay(previousStart), to: isoDay(previousEnd) },
  };
}

async function requestJson(url, init = {}, timeout = 60000) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeout) });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text.slice(0, 500) };
  }
  if (!response.ok) {
    const message = body.error?.message ?? body.error_message ?? body.message ?? text.slice(0, 300);
    throw new Error(`${response.status} ${url.split("?")[0]}: ${message}`);
  }
  return body;
}

async function section(task) {
  try {
    return { ok: true, data: await task() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function googleToken(keyFile) {
  const key = JSON.parse(fs.readFileSync(keyFile, "utf8"));
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(key.private_key, "base64url");
  const token = await requestJson("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  return token.access_token;
}

async function collectGoogle(keyFile, site) {
  const token = await googleToken(keyFile);
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}`;
  const month = periods(28, GSC_LAG_DAYS);
  const week = periods(7, GSC_LAG_DAYS);
  const history = periods(HISTORY_DAYS, GSC_LAG_DAYS).current;
  const query = (range, dimensions, rowLimit) =>
    requestJson(`${base}/searchAnalytics/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({ startDate: range.from, endDate: range.to, dimensions, rowLimit, dataState: "all" }),
    }).then((body) => body.rows ?? []);
  const total = (range) => query(range, [], 1).then((rows) => rows[0] ?? null);

  const [totals, previousTotals, weekTotals, previousWeekTotals, queries, previousQueries, pages, previousPages, devices, daily, sitemaps] =
    await Promise.all([
      total(month.current),
      total(month.previous),
      total(week.current),
      total(week.previous),
      query(month.current, ["query"], 1000),
      query(month.previous, ["query"], 1000),
      query(month.current, ["page"], 500),
      query(month.previous, ["page"], 500),
      query(month.current, ["device"], 10),
      query(history, ["date"], HISTORY_DAYS + 5),
      requestJson(`${base}/sitemaps`, { headers }).then((body) => body.sitemap ?? []),
    ]);

  return {
    dates: month,
    weekDates: week,
    totals,
    previousTotals,
    weekTotals,
    previousWeekTotals,
    queries,
    previousQueries,
    pages,
    previousPages,
    devices,
    daily,
    sitemaps,
  };
}

async function collectWebmaster(token, hostId) {
  const headers = { authorization: `OAuth ${token}` };
  const api = "https://api.webmaster.yandex.net/v4";
  const { user_id: userId } = await requestJson(`${api}/user`, { headers });
  const host = `${api}/user/${userId}/hosts/${encodeURIComponent(hostId)}`;
  const month = periods(28, 1);
  const history = periods(HISTORY_DAYS, 1).current;
  const indicators = ["TOTAL_SHOWS", "TOTAL_CLICKS", "AVG_SHOW_POSITION", "AVG_CLICK_POSITION"];
  const popular = (range) => {
    const params = new URLSearchParams({
      order_by: "TOTAL_SHOWS",
      device_type_indicator: "ALL",
      date_from: range.from,
      date_to: range.to,
      limit: "500",
    });
    for (const indicator of indicators) params.append("query_indicator", indicator);
    return requestJson(`${host}/search-queries/popular?${params}`, { headers }).then((body) => body.queries ?? []);
  };
  const queryHistoryParams = new URLSearchParams({
    device_type_indicator: "ALL",
    date_from: history.from,
    date_to: history.to,
  });
  for (const indicator of ["TOTAL_SHOWS", "TOTAL_CLICKS"]) queryHistoryParams.append("query_indicator", indicator);

  const optional = (promise, fallback) => promise.catch(() => fallback);

  const [summary, diagnostics, sitemaps, userSitemaps, queries, previousQueries, events, inSearch, queryHistory] =
    await Promise.all([
      requestJson(`${host}/summary`, { headers }),
      requestJson(`${host}/diagnostics`, { headers }).then((body) => body.problems ?? {}),
      requestJson(`${host}/sitemaps?limit=100`, { headers }).then((body) => body.sitemaps ?? []),
      optional(
        requestJson(`${host}/user-added-sitemaps?limit=100`, { headers }).then((body) => body.sitemaps ?? []),
        [],
      ),
      popular(month.current),
      popular(month.previous),
      optional(
        requestJson(`${host}/search-urls/events/samples?limit=100`, { headers }).then((body) => body.samples ?? []),
        [],
      ),
      optional(
        requestJson(
          `${host}/search-urls/in-search/history?${new URLSearchParams({ date_from: history.from, date_to: history.to })}`,
          { headers },
        ).then((body) => body.history ?? []),
        [],
      ),
      optional(
        requestJson(`${host}/search-queries/all/history?${queryHistoryParams}`, { headers }).then(
          (body) => body.indicators ?? {},
        ),
        {},
      ),
    ]);

  return { dates: month, summary, diagnostics, sitemaps, userSitemaps, queries, previousQueries, events, inSearch, queryHistory };
}

async function collectMetrika(token, counter) {
  const headers = { authorization: `OAuth ${token}` };
  const month = periods(28, 1);
  const history = periods(HISTORY_DAYS, 1).current;
  const stat = (range, params) =>
    requestJson(
      `https://api-metrika.yandex.net/stat/v1/data?${new URLSearchParams({
        ids: counter,
        date1: range.from,
        date2: range.to,
        accuracy: "full",
        limit: "100",
        lang: "ru",
        ...params,
      })}`,
      { headers },
    ).then((body) => ({ totals: body.totals ?? [], rows: body.data ?? [] }));

  const behaviour = "ym:s:visits,ym:s:users,ym:s:bounceRate,ym:s:pageDepth,ym:s:avgVisitDurationSeconds";
  const organic = "ym:s:lastTrafficSource=='organic'";
  const goals = await requestJson(`https://api-metrika.yandex.net/management/v1/counter/${counter}/goals`, {
    headers,
  }).then((body) => (body.goals ?? []).slice(0, 5).map((goal) => ({ id: goal.id, name: goal.name, type: goal.type })));
  const goalMetrics = goals.map((goal) => `ym:s:goal${goal.id}reaches`).join(",");

  const sources = await stat(month.current, { metrics: behaviour, dimensions: "ym:s:lastTrafficSource" });
  const previousSources = await stat(month.previous, { metrics: behaviour, dimensions: "ym:s:lastTrafficSource" });
  const engines = await stat(month.current, {
    metrics: behaviour,
    dimensions: "ym:s:lastSearchEngineRoot",
    filters: organic,
  });
  const previousEngines = await stat(month.previous, {
    metrics: behaviour,
    dimensions: "ym:s:lastSearchEngineRoot",
    filters: organic,
  });
  const landings = await stat(month.current, {
    metrics: behaviour,
    dimensions: "ym:s:startURL",
    filters: organic,
    sort: "-ym:s:visits",
  });
  const devices = await stat(month.current, { metrics: behaviour, dimensions: "ym:s:deviceCategory" });
  const goalsBySource = goalMetrics
    ? await stat(month.current, { metrics: `ym:s:visits,${goalMetrics}`, dimensions: "ym:s:lastTrafficSource" })
    : null;
  const daily = await stat(history, {
    metrics: "ym:s:visits",
    dimensions: "ym:s:date,ym:s:lastTrafficSource",
    sort: "ym:s:date",
    limit: "1000",
  });

  return { dates: month, goals, sources, previousSources, engines, previousEngines, landings, devices, goalsBySource, daily };
}

export async function collectSearch({ gscKeyFile, yandexTokenFile, gscSite, yandexHost, metrikaCounter } = {}) {
  const sources = {
    gscSite: gscSite || DEFAULT_SEO_SOURCES.gscSite,
    yandexHost: yandexHost || DEFAULT_SEO_SOURCES.yandexHost,
    metrikaCounter: metrikaCounter || DEFAULT_SEO_SOURCES.metrikaCounter,
  };
  const yandexToken = () => fs.readFileSync(yandexTokenFile, "utf8").trim();
  const [google, webmaster, metrika] = await Promise.all([
    section(() => collectGoogle(gscKeyFile, sources.gscSite)),
    section(() => collectWebmaster(yandexToken(), sources.yandexHost)),
    section(() => collectMetrika(yandexToken(), sources.metrikaCounter)),
  ]);
  return { collectedAt: Date.now(), sources, google, webmaster, metrika };
}
