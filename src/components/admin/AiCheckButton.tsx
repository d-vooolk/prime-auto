"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {startAiCheckAction, type ActionResult} from "@/app/admin/actions";

/** «Проверить ответы нейросетей»: запускает фоновую проверку и обновляет страницу */
const AiCheckButton = ({running}: {running: boolean}) => {
    const [result, setResult] = useState<ActionResult | null>(null);
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    return (
        <div className="a-row" style={{gap: 10, flexWrap: "wrap"}}>
            <button type="button" className="a-btn a-btn-primary" disabled={pending || running}
                    onClick={() => startTransition(async () => {
                        setResult(await startAiCheckAction());
                        router.refresh();
                    })}>
                {pending ? <span className="a-spin" /> : null} Проверить ответы нейросетей
            </button>
            {running && <button type="button" className="a-btn" onClick={() => router.refresh()}>Обновить ход проверки</button>}
            {result && (result.ok ? <span className="a-success">{result.message}</span> : <span className="a-error" role="alert">{result.error}</span>)}
        </div>
    );
};

export default AiCheckButton;
