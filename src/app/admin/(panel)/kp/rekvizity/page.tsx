import Link from "next/link";
import {getExecutor} from "@/lib/proposals";
import {ExecutorForm} from "@/components/admin/ProposalEditor";

export const dynamic = "force-dynamic";

const ExecutorPage = () => (
    <>
        <p className="a-note"><Link href="/admin/kp">← Все КП</Link></p>
        <h1 className="a-h1">Реквизиты исполнителя</h1>
        <p className="a-note">
            Последняя страница каждого КП: компания, подписант, банк. Общие для всех документов — правка здесь меняет и уже
            созданные КП при следующем скачивании.
        </p>
        <ExecutorForm initial={getExecutor()} />
    </>
);

export default ExecutorPage;
