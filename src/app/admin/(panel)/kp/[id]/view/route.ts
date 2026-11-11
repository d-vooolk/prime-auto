import {getAdmin} from "@/lib/auth";
import {renderProposalHtml} from "@/lib/proposal-html";
import {getProposal} from "@/lib/proposals";

export const dynamic = "force-dynamic";

/* Документ целиком, как он уйдёт в PDF, — для предпросмотра в iframe редактора */
export async function GET(_: Request, {params}: {params: Promise<{id: string}>}) {
    if (!(await getAdmin())) return new Response("Нужно войти заново", {status: 401});
    const proposal = getProposal(Number((await params).id));
    if (!proposal) return new Response("КП не найдено", {status: 404});
    return new Response(renderProposalHtml(proposal), {
        headers: {"Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store"},
    });
}
