import {aiConfigured, aiUsage} from "@/lib/ai";
import {DEFAULT_PROMPTS, getPrompt, getShopLinks, PROMPT_TITLES, type PromptKey} from "@/lib/article-ai";
import {
    adminConfigValue,
    CONFIG_FIELDS,
    configSource,
    fallbackConfigValue,
    getConfig,
    maskSecret,
    type ConfigField,
} from "@/lib/config";
import {formatShopLinks} from "@/lib/site-pages";
import {textruConfigured} from "@/lib/uniqueness";
import {
    AiCheckButton,
    ConfigForm,
    PasswordForm,
    PromptForm,
    ShopLinksForm,
    type ConfigFieldView,
} from "@/components/admin/SettingsForms";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

/* Ключи в браузер не отдаём: только маска с последними символами */
const toView = (field: ConfigField): ConfigFieldView => ({
    name: field.name,
    label: field.label,
    hint: field.hint,
    type: field.type,
    source: configSource(field.name),
    value: field.type === "secret" ? "" : adminConfigValue(field.name),
    placeholder: field.type === "secret" ? maskSecret(getConfig(field.name)) : fallbackConfigValue(field.name),
});

const fieldsOf = (group: ConfigField["group"]) => CONFIG_FIELDS.filter((field) => field.group === group).map(toView);

const SettingsPage = () => {
    const month = aiUsage(30 * DAY);

    return (
        <>
            <h1 className="a-h1">Настройки</h1>

            <section className="a-card">
                <h2 className="a-h2">Состояние</h2>
                <ul className="a-list">
                    <li>Нейросеть: {aiConfigured() ? "ключ задан" : <strong>ключ не задан — генерация выключена</strong>}</li>
                    <li>text.ru: {textruConfigured() ? "подключён" : "не подключён — уникальность проверяется только против текста конкурента"}</li>
                    <li>
                        За 30 дней: запросов к нейросети {month.requests}, с ошибкой {month.failed}
                        {month.cost ? `, потрачено $${month.cost.toFixed(2)}` : ""}
                    </li>
                </ul>
                <AiCheckButton />
            </section>

            <ConfigForm
                title="Нейросеть"
                note="Изменения действуют сразу, перезапуск не нужен. Задача, которая уже идёт, подхватит их со следующего шага."
                fields={fieldsOf("ai")}
            />
            <ConfigForm title="Проверка уникальности" fields={fieldsOf("unique")} />
            <ConfigForm title="Сайт" fields={fieldsOf("site")} />

            <ShopLinksForm value={formatShopLinks(getShopLinks())} />

            {(Object.keys(PROMPT_TITLES) as PromptKey[]).map((key) => (
                <PromptForm key={key} promptKey={key} title={PROMPT_TITLES[key]} value={getPrompt(key)} fallback={DEFAULT_PROMPTS[key]} />
            ))}

            <PasswordForm />
        </>
    );
};

export default SettingsPage;
