import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
    createServer((req, res) => {
        const parsedUrl = parse(req.url, true);

        if (req.url.startsWith('/_next/')) {
            return handle(req, res, parsedUrl)
        }

        handle(req, res, parsedUrl);
    }).listen(port, '0.0.0.0', () => {
        console.log(
            `> Server listening at http://0.0.0.0:${port} as ${
                dev ? 'development' : process.env.NODE_ENV
            }`
        )
    })
});
