import {getAdmin} from "@/lib/auth";
import {saveImage, UploadError} from "@/lib/uploads";

export const dynamic = "force-dynamic";

/** Загрузка фото для статьи: обложки или картинки в тексте. В ответ — адрес и размеры */
export async function POST(request: Request) {
    if (!(await getAdmin())) return Response.json({error: "Нужно войти заново"}, {status: 401});
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return Response.json({error: "Файл не передан"}, {status: 400});
    try {
        return Response.json(await saveImage(Buffer.from(await file.arrayBuffer())));
    } catch (error) {
        if (error instanceof UploadError) return Response.json({error: error.message}, {status: 400});
        console.error("[upload]", error);
        return Response.json({error: "Не удалось сохранить фото, подробности в логе сервера"}, {status: 500});
    }
}
