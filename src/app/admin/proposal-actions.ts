"use server";

import {redirect} from "next/navigation";
import {requireAdmin} from "@/lib/auth";
import {
    cleanProposalData,
    createProposal,
    defaultProposalData,
    deleteProposal,
    getProposal,
    saveExecutor,
    updateProposal,
} from "@/lib/proposals";
import type {ActionResult} from "@/app/admin/actions";

/* Как и в actions.ts: каждое действие начинается с requireAdmin() */

export const createProposalAction = async (): Promise<void> => {
    await requireAdmin();
    const id = createProposal(defaultProposalData());
    redirect(`/admin/kp/${id}`);
};

export const saveProposalAction = async (id: number, input: unknown): Promise<ActionResult> => {
    await requireAdmin();
    if (!getProposal(id)) return {ok: false, error: "КП не найдено — возможно, его удалили"};
    const data = cleanProposalData(input);
    if (!data.items.length) return {ok: false, error: "Добавьте хотя бы одну работу"};
    updateProposal(id, data);
    return {ok: true, message: "Сохранено"};
};

/* Копия для нового клиента: работы, цены и тексты те же, заказчик пустой, номер и дата новые */
export const copyProposalAction = async (id: number): Promise<void> => {
    await requireAdmin();
    const source = getProposal(id);
    if (!source) redirect("/admin/kp");
    const fresh = defaultProposalData();
    const copy = createProposal({
        ...source.data,
        date: fresh.date,
        clientName: "",
        clientAddress: "",
        clientUnp: "",
        greeting: "",
    });
    redirect(`/admin/kp/${copy}`);
};

export const deleteProposalAction = async (id: number): Promise<void> => {
    await requireAdmin();
    deleteProposal(id);
    redirect("/admin/kp");
};

export const saveExecutorAction = async (input: unknown): Promise<ActionResult> => {
    await requireAdmin();
    saveExecutor(input);
    return {ok: true, message: "Реквизиты сохранены — они попадут во все КП, в том числе в уже созданные"};
};
