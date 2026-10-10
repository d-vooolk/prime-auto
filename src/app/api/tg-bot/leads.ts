import {SendLeadToBotParamsInterface} from "@/app/api/tg-bot/types";

/*
  Бот (отдельный сервис на сервере) сам ждёт Telegram не дольше ~30 секунд,
  но если завис он сам или nginx, форма висела бы в «Отправка...» вечно.
  Через 35 секунд обрываем запрос и показываем ошибку с телефоном.
*/
const TIMEOUT_MS = 35000;

export const sendLeadToBot = async (clientData: SendLeadToBotParamsInterface) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch('https://prime-auto.by/send-application', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clientData),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return {success: false};
    } finally {
        clearTimeout(timer);
    }
};
