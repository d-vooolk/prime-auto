import Link from "next/link";
import {copyProposalAction, createProposalAction} from "@/app/admin/proposal-actions";
import {formatMoney, listProposals} from "@/lib/proposals";
import {formatDateTime} from "@/components/admin/badges";

export const dynamic = "force-dynamic";

const formatDate = (iso: string) => iso.split("-").reverse().join(".");

const ProposalsPage = () => {
    const proposals = listProposals();

    return (
        <>
            <div className="a-row" style={{justifyContent: "space-between", marginBottom: 16}}>
                <h1 className="a-h1" style={{margin: 0}}>Коммерческие предложения</h1>
                <div className="a-row">
                    <Link href="/admin/kp/rekvizity" className="a-btn">Реквизиты исполнителя</Link>
                    <form action={createProposalAction}>
                        <button className="a-btn a-btn-primary">Новое КП</button>
                    </form>
                </div>
            </div>

            <section className="a-card">
                {proposals.length ? (
                    <table className="a-table">
                        <thead>
                        <tr>
                            <th>№</th>
                            <th>Заказчик</th>
                            <th>Сумма, BYN</th>
                            <th>Дата КП</th>
                            <th>Изменено</th>
                            <th />
                        </tr>
                        </thead>
                        <tbody>
                        {proposals.map((proposal) => (
                            <tr key={proposal.id}>
                                <td>{proposal.number}</td>
                                <td><Link href={`/admin/kp/${proposal.id}`}>{proposal.client || "Без заказчика"}</Link></td>
                                <td style={{whiteSpace: "nowrap"}}>{formatMoney(proposal.total)}</td>
                                <td>{formatDate(proposal.date)}</td>
                                <td className="a-note">{formatDateTime(proposal.updatedAt)}</td>
                                <td>
                                    <div className="a-row" style={{flexWrap: "nowrap"}}>
                                        <a className="a-btn" href={`/admin/kp/${proposal.id}/pdf`}>PDF</a>
                                        <form action={copyProposalAction.bind(null, proposal.id)}>
                                            <button className="a-btn" title="Новое КП с теми же работами и ценами">Копия</button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="a-note">
                        КП пока нет. «Новое КП» откроет форму: заказчик, работы с ценами, сроки, гарантии — документ соберётся
                        в фирменном стиле, PDF скачивается одной кнопкой.
                    </p>
                )}
            </section>
        </>
    );
};

export default ProposalsPage;
