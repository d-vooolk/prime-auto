// Серверная часть art.py: node scripts/.claude-art.mjs <cmd> [args] — запускается в контейнере tools
import fs from "node:fs";
import Database from "better-sqlite3";

const DB = process.env.DATABASE_PATH || "var/prime-auto.db";
const db = new Database(DB);
const [cmd, ...args] = process.argv.slice(2);
const FACTCHECK = "Проверка по фактам";

/** Повторная проверка по фактам: queued | running | done | error | null (не запускалась) */
function factcheck(id) {
    const queue = JSON.parse(db.prepare("SELECT value FROM settings WHERE key = 'article_queue'").get()?.value ?? "[]");
    if (queue.some((item) => item.articleId === id)) return "queued";
    const job = db.prepare("SELECT status FROM jobs WHERE article_id = ? AND kind = 'review' AND input LIKE ? ORDER BY id DESC LIMIT 1").get(id, `%${FACTCHECK}%`);
    return job?.status ?? null;
}

const FIELDS = ["title", "meta_title", "meta_description", "excerpt", "body", "faq", "cover", "cover_alt"];

if (cmd === "list") {
    // черновики, написанные очередью, с темой задания
    // все черновики, написанные нейросетью (у них есть задание в jobs)
    const rows = db.prepare(`SELECT a.id, a.status, a.title, a.notes, a.cover, j.input FROM articles a
        JOIN jobs j ON j.article_id = a.id AND j.kind = 'generate'
        WHERE a.status = 'draft' GROUP BY a.id ORDER BY a.id`).all();
    for (const r of rows) {
        const topic = r.input ? JSON.parse(r.input).topic : "";
        console.log(JSON.stringify({id: r.id, status: r.status, reviewed: /проверено Claude/.test(r.notes || ""), factcheck: factcheck(r.id), cover: !!r.cover, title: r.title, topic}));
    }
} else if (cmd === "factcheck") {
    // повторная проверка редактором-нейросетью уже с «Фактами» в задании: в очередь статей, сервер берёт по две
    const queue = JSON.parse(db.prepare("SELECT value FROM settings WHERE key = 'article_queue'").get()?.value ?? "[]");
    const added = [];
    for (const id of args[0].split(",").map(Number)) {
        const r = db.prepare("SELECT title, status, notes FROM articles WHERE id = ?").get(id);
        if (!r || r.status !== "draft" || /проверено Claude/.test(r.notes || "") || ["queued", "running", "done"].includes(factcheck(id))) continue;  // после error — можно ещё раз
        queue.push({topic: `${FACTCHECK}: ${r.title}`, articleId: id});
        added.push(id);
    }
    db.prepare("INSERT INTO settings (key, value) VALUES ('article_queue', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(queue));
    console.log("в очередь проверки:", added.length, added.join(","));
} else if (cmd === "dump") {
    // несколько статей разом, по строке JSON на статью
    for (const id of args[0].split(",").map(Number)) {
        const r = db.prepare(`SELECT id, slug, ${FIELDS.join(", ")}, notes FROM articles WHERE id = ?`).get(id);
        if (!r) continue;
        const j = db.prepare("SELECT input FROM jobs WHERE article_id = ? AND kind = 'generate' ORDER BY id LIMIT 1").get(id);
        r.faq = JSON.parse(r.faq || "[]");
        r.task = j ? JSON.parse(j.input) : null;
        console.log(JSON.stringify(r));
    }
} else if (cmd === "leokey") {
    // ключ Leonardo из «Настроек» админки — для leo.py, если на машине нет файла с ключом
    console.log(db.prepare("SELECT value FROM settings WHERE key = 'cfg:LEONARDO_API_KEY'").get()?.value ?? "");
} else if (cmd === "get") {
    const r = db.prepare(`SELECT id, slug, ${FIELDS.join(", ")}, notes FROM articles WHERE id = ?`).get(Number(args[0]));
    const j = db.prepare("SELECT input FROM jobs WHERE article_id = ? AND kind = 'generate' ORDER BY id LIMIT 1").get(Number(args[0]));
    r.faq = JSON.parse(r.faq || "[]");
    r.task = j ? JSON.parse(j.input) : null;
    process.stdout.write(JSON.stringify(r, null, 1));
} else if (cmd === "put") {
    const id = Number(args[0]);
    const data = JSON.parse(fs.readFileSync(args[1], "utf8"));
    // Git Bash превращает аргумент «/uploads/…» в «C:/Program Files/Git/uploads/…» — такие пути не пускаем
    const all = JSON.stringify(data);
    if (/[A-Z]:[\/]|Program Files/.test(all)) throw new Error("в статье локальный путь Windows вместо /uploads/… — исправь");
    if (data.cover && !/^\/uploads\//.test(data.cover)) throw new Error("cover должен начинаться с /uploads/");
    const backup = DB.replace(/\.db$/, "") + `-backup-${new Date().toISOString().slice(0, 10)}-review.db`;
    if (!fs.existsSync(backup)) await db.backup(backup);
    const cur = db.prepare("SELECT status, notes FROM articles WHERE id = ?").get(id);
    if (!cur) throw new Error("нет статьи " + id);
    if (cur.status !== "draft") throw new Error("статья уже не черновик: " + cur.status);
    const set = FIELDS.filter((f) => data[f] !== undefined);
    const values = set.map((f) => (f === "faq" ? JSON.stringify(data.faq) : data[f]));
    const notes = /проверено Claude/.test(cur.notes || "") ? cur.notes : `${cur.notes ? cur.notes + "\n" : ""}проверено Claude ${new Date().toISOString().slice(0, 10)}`;
    db.prepare(`UPDATE articles SET ${set.map((f) => `${f} = ?`).join(", ")}${set.length ? ", " : ""}notes = ?, updated_at = ? WHERE id = ?`)
        .run(...values, notes, Date.now(), id);
    console.log("updated", id, set.join(","));
} else if (cmd === "publish-queue") {
    // порядок публикации: ids через запятую; только проверенные черновики
    const ids = args[0].split(",").map(Number).filter((id) => {
        const r = db.prepare("SELECT status, notes FROM articles WHERE id = ?").get(id);
        return r && r.status === "draft" && /проверено Claude/.test(r.notes || "");
    });
    db.prepare("INSERT INTO settings (key, value) VALUES ('publish_queue', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(ids));
    console.log("publish_queue", ids.length, ids.join(","));
} else if (cmd === "published") {
    for (const r of db.prepare("SELECT slug, title FROM articles WHERE status = 'published' ORDER BY id").all()) console.log(`- /stati/${r.slug} — ${r.title}`);
} else if (cmd === "photos") {
    for (const x of JSON.parse(fs.readFileSync("var/uploads/library/index.json", "utf8"))) console.log(`- ${x.url} — ${x.car ?? ""} ${x.works ?? x.caption ?? ""}`.replace(/ +/g, " "));
} else if (cmd === "sync-queue") {
    // очередь публикации = то, что уже стоит (если ещё черновик) + все проверенные черновики, которых в ней нет (по id)
    const queued = JSON.parse(db.prepare("SELECT value FROM settings WHERE key = 'publish_queue'").get()?.value ?? "[]");
    const isReady = (id) => {
        const r = db.prepare("SELECT status, notes FROM articles WHERE id = ?").get(id);
        return r && r.status === "draft" && /проверено Claude/.test(r.notes || "");
    };
    const keep = queued.filter(isReady);
    const extra = db.prepare("SELECT id FROM articles WHERE status = 'draft' AND notes LIKE '%проверено Claude%' ORDER BY id").all()
        .map((r) => r.id).filter((id) => !keep.includes(id));
    const ids = [...keep, ...extra];
    db.prepare("INSERT INTO settings (key, value) VALUES ('publish_queue', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(ids));
    console.log("publish_queue", ids.length, ids.join(","));
} else {
    console.error("cmd: list | get <id> | dump <ids> | factcheck <ids> | leokey | put <id> <file> | published | photos | sync-queue | publish-queue <ids>");
    process.exit(1);
}
