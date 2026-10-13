import {SendLeadToBotParamsInterface} from "@/app/api/tg-bot/types";

/*
  /api/lead сайта сам ждёт CRM не дольше 20 секунд, но если завис он сам или nginx,
  форма висела бы в «Отправка...» вечно. Через 35 секунд обрываем запрос и показываем ошибку с телефоном.
*/
const TIMEOUT_MS = 35000;

/** Заявка — в раздел «Заявки» CRM (через /api/lead сайта: ключ CRM живёт на сервере). В Telegram не уходит */
export const sendLeadToCrm = async (clientData: SendLeadToBotParamsInterface) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch('/api/lead', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(clientData),
            signal: controller.signal,
        });
        return response.ok ? await response.json() : {success: false};
    } catch (error) {
        console.error('CRM lead error:', error);
        return {success: false};
    } finally {
        clearTimeout(timer);
    }
};

export const sendLead = (clientData: SendLeadToBotParamsInterface): Promise<boolean> =>
    sendLeadToCrm(clientData).then((r) => Boolean(r?.success));
