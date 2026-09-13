import type {BreadcrumbItem} from "@/utils/seo";

export interface ServicePageTitleContainerProps {
    headText: string;
    description: string;
    /** Короткий перечень того, что входит в услугу */
    list?: string[];
    /** Подпись последней «хлебной крошки», если её нет в справочнике путей */
    currentLabel?: string;
    /** Полный путь для микроразметки BreadcrumbList, включая текущую страницу */
    breadcrumbs?: BreadcrumbItem[];
}
