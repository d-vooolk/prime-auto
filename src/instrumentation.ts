/*
  Фоновые дела сервера раз в минуту:
  - очередь статей (src/lib/article-jobs.ts) двигается сама, когда задача
    заканчивается, но после перезапуска её некому толкнуть;
  - публикация по расписанию (src/lib/publish-schedule.ts) — одна статья в
    день в 9:00 по Минску.
*/
export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
    const {pumpQueue} = await import("@/lib/article-jobs");
    const {publishScheduled} = await import("@/lib/publish-schedule");
    setInterval(() => {
        for (const task of [pumpQueue, publishScheduled]) {
            try {
                task();
            } catch (error) {
                console.error("[background]", error);
            }
        }
    }, 60_000).unref();
}
