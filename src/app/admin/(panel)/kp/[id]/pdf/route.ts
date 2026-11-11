import {getAdmin} from "@/lib/auth";
import {proposalFileName, renderProposalHtml} from "@/lib/proposal-html";
import {PdfError, renderPdf} from "@/lib/proposal-pdf";
import {getProposal} from "@/lib/proposals";

export const dynamic = "force-dynamic";

export async function GET(_: Request, {params}: {params: Promise<{id: string}>}) {
    if (!(await getAdmin())) return new Response("Нужно войти заново", {status: 401});
    const proposal = getProposal(Number((await params).id));
    if (!proposal) return new Response("КП не найдено", {status: 404});
    try {
        const pdf = await renderPdf(renderProposalHtml(proposal));
        const name = proposalFileName(proposal);
        return new Response(new Uint8Array(pdf), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="kp-${proposal.number}.pdf"; filename*=UTF-8''${encodeURIComponent(name)}`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        if (error instanceof PdfError) return new Response(error.message, {status: 500});
        console.error("[proposal-pdf]", error);
        return new Response("Не удалось собрать PDF, подробности в логе сервера", {status: 500});
    }
}
