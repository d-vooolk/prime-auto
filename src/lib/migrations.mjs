/**
 * Схема базы и её миграции.
 *
 * Файл на чистом JavaScript: его используют и приложение (src/lib/db.ts), и
 * консольный scripts/admin.mjs, которому TypeScript недоступен.
 *
 * Версия схемы хранится в PRAGMA user_version. Каждая миграция — один шаг
 * массива, выполняется ровно один раз и в транзакции. Порядок не меняем,
 * старые шаги не правим: на сервере база уже прошла через них.
 */

const MIGRATIONS = [
    // 1 — админка, статьи, задачи нейросети и журнал её запросов
    `
    CREATE TABLE users (
        id            INTEGER PRIMARY KEY,
        login         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    INTEGER NOT NULL,
        last_login_at INTEGER
    );

    CREATE TABLE sessions (
        token_hash TEXT PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        user_agent TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    CREATE TABLE articles (
        id               INTEGER PRIMARY KEY,
        slug             TEXT NOT NULL UNIQUE,
        status           TEXT NOT NULL DEFAULT 'draft',
        title            TEXT NOT NULL,
        meta_title       TEXT NOT NULL DEFAULT '',
        meta_description TEXT NOT NULL DEFAULT '',
        excerpt          TEXT NOT NULL DEFAULT '',
        body             TEXT NOT NULL DEFAULT '',
        faq              TEXT NOT NULL DEFAULT '[]',
        related          TEXT NOT NULL DEFAULT '[]',
        topic            TEXT NOT NULL DEFAULT '',
        keyword          TEXT NOT NULL DEFAULT '',
        notes            TEXT NOT NULL DEFAULT '',
        source_url       TEXT NOT NULL DEFAULT '',
        source_text      TEXT NOT NULL DEFAULT '',
        review           TEXT,
        uniqueness       TEXT,
        created_at       INTEGER NOT NULL,
        updated_at       INTEGER NOT NULL,
        published_at     INTEGER
    );
    CREATE INDEX articles_status ON articles (status, published_at);

    CREATE TABLE jobs (
        id         INTEGER PRIMARY KEY,
        kind       TEXT NOT NULL,
        status     TEXT NOT NULL,
        input      TEXT NOT NULL,
        step       TEXT NOT NULL DEFAULT '',
        log        TEXT NOT NULL DEFAULT '[]',
        preview    TEXT NOT NULL DEFAULT '',
        error      TEXT NOT NULL DEFAULT '',
        article_id INTEGER,
        revalidate TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    );
    CREATE INDEX jobs_created ON jobs (created_at);

    CREATE TABLE ai_requests (
        id             INTEGER PRIMARY KEY,
        created_at     INTEGER NOT NULL,
        task           TEXT NOT NULL,
        model          TEXT NOT NULL DEFAULT '',
        provider       TEXT NOT NULL DEFAULT '',
        duration_ms    INTEGER NOT NULL,
        first_token_ms INTEGER,
        tokens_in      INTEGER,
        tokens_out     INTEGER,
        cost           REAL,
        ok             INTEGER NOT NULL,
        error          TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX ai_requests_created ON ai_requests (created_at);
    `,
    // 2 — обложка статьи (адрес картинки из /uploads) и заголовок статьи конкурента:
    //     по нему проверяется, что наш заголовок не повторяет чужой
    `
    ALTER TABLE articles ADD COLUMN cover TEXT NOT NULL DEFAULT '';
    ALTER TABLE articles ADD COLUMN cover_alt TEXT NOT NULL DEFAULT '';
    ALTER TABLE articles ADD COLUMN source_title TEXT NOT NULL DEFAULT '';
    `,
    // 3 — рубрика статьи (slug из src/constants/articleCategories.ts); пусто —
    //     рубрика определяется по заголовку
    `
    ALTER TABLE articles ADD COLUMN category TEXT NOT NULL DEFAULT '';
    `,
];

/**
 * @param {import('better-sqlite3').Database} db
 */
export function migrate(db) {
    // IMMEDIATE: на сборке страницы рендерят несколько воркеров сразу, и каждый
    // открывает базу. Без блокировки двое прочитали бы одну и ту же версию и
    // полезли создавать одни и те же таблицы.
    const run = db.transaction(() => {
        const version = db.pragma('user_version', {simple: true});
        for (let index = version; index < MIGRATIONS.length; index += 1) {
            db.exec(MIGRATIONS[index]);
        }
        if (version < MIGRATIONS.length) db.pragma(`user_version = ${MIGRATIONS.length}`);
    });
    run.immediate();
}

/**
 * Открыть базу с теми же настройками, что в приложении.
 *
 * @param {typeof import('better-sqlite3')} Database
 * @param {string} file
 */
export function openDatabase(Database, file) {
    const db = new Database(file);
    // WAL: читатели не блокируют писателя — сохранение статьи в админке не
    // подвешивает отрисовку страницы, которую в этот момент открыл посетитель.
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');
    migrate(db);
    return db;
}
