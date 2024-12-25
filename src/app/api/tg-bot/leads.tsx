import {SendLeadToBotParamsInterface} from "@/app/api/tg-bot/types";

export const sendLeadToBot = async (clientData: SendLeadToBotParamsInterface) => {
    try {
        const response = await fetch('https://prime-auto.by/send-application', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clientData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
    }
};