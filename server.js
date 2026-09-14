import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

const port = parseInt(process.env.PORT || "3000", 10);
// В blue-green процессы слушают только 127.0.0.1 — наружу их публикует nginx.
const host = process.env.HOST || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer((req, res) => {
        const parsedUrl = parse(req.url, true);

        handle(req, res, parsedUrl);
    }).listen(port, host, () => {
        console.log(
            `> Server listening at http://${host}:${port} as ${
                dev ? "development" : "production"
            }`
        );
    });
});
