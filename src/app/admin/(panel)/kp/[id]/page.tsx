import Link from "next/link";
import {notFound} from "next/navigation";
import {copyProposalAction} from "@/app/admin/proposal-actions";
import {getProposal} from "@/lib/proposals";
import {DeleteProposalButton, ProposalEditor} from "@/components/admin/ProposalEditor";

export const dynamic = "force-dynamic";

const ProposalPage = async ({params}: {params: Promise<{id: string}>}) => {
    const proposal = getProposal(Number((await params).id));
    if (!proposal) notFound();

    return (
        <>
            <p className="a-note"><Link href="/admin/kp">← Все КП</Link></p>
            <div className="a-row" style={{justifyContent: "space-between", marginBottom: 16}}>
                <h1 className="a-h1" style={{margin: 0}}>
                    КП № {proposal.number}{proposal.data.clientName ? ` — ${proposal.data.clientName}` : ""}
                </h1>
                <div className="a-row">
                    <form action={copyProposalAction.bind(null, proposal.id)}>
                        <button className="a-btn" title="Новое КП с теми же работами и ценами">Сделать копию</button>
                    </form>
                    <DeleteProposalButton id={proposal.id} number={proposal.number} />
                </div>
            </div>
            <ProposalEditor id={proposal.id} number={proposal.number} initial={proposal.data} />
        </>
    );
};

export default ProposalPage;
