/*
  Очередь статей (src/lib/article-jobs.ts) двигается сама, когда задача
  заканчивается. После перезапуска сервера её некому толкнуть — раз в минуту
  проверяем, нет ли тем в очереди и свободного места.
*/
export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
    const {pumpQueue} = await import("@/lib/article-jobs");
    setInterval(() => {
        try {
            pumpQueue();
        } catch (error) {
            console.error("[jobs] очередь", error);
        }
    }, 60_000).unref();
}
