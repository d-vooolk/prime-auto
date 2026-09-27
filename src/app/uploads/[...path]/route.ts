import fs from "node:fs";
import {uploadFile} from "@/lib/uploads";

/*
  Раздача загруженных фото. Файлы лежат вне public/ — Next отдаёт из public
  только то, что было там на момент сборки, а фото добавляются в админке
  после неё. Имя файла — хеш содержимого, поэтому кешировать можно навсегда.
*/
export async function GET(_: Request, {params}: {params: Promise<{path: string[]}>}) {
    const file = uploadFile((await params).path);
    if (!file) return new Response("Not found", {status: 404});
    return new Response(fs.readFileSync(file), {
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    });
}
