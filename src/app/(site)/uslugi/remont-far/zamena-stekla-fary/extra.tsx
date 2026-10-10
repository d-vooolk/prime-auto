import React from "react";
import ServiceExtra from "@/components/_HelperComponents/ServiceExtra/ServiceExtra";
import {LINKS} from "@/constants/links";
import {NAVIGATION_URL} from "@/constants/navigation";
import Link from "next/link";

/* Где взять стекло: подбор в мастерской или самому — в каталоге нашего магазина VDF.BY */
const ZamenaSteklaExtra = () => (
    <ServiceExtra
        columns={[
            {
                title: "Где взять стекло для фары",
                body: (
                    <>
                        <p>
                            Стекло подбираем сами под вашу фару — по марке, модели и году. Можно выбрать и заранее: стёкла
                            для фар большинства машин есть в каталоге нашего магазина{" "}
                            <a href={LINKS.vdfGlass} target="_blank" rel="noopener">VDF.BY — стёкла фар</a>.
                            Привезите стекло с собой или закажите — поставим в мастерской.
                        </p>
                    </>
                ),
            },
            {
                title: "Замена стекла или полировка",
                body: (
                    <p>
                        Если стекло просто помутнело и не сточено, хватит{" "}
                        <Link href={NAVIGATION_URL.polirovkaOkleyka}>полировки с оклейкой плёнкой</Link> — это дешевле и
                        быстрее. Замена нужна, когда в стекле сколы и трещины, оно разбито или уже сточено прошлыми
                        полировками. По фото подскажем, что подойдёт.
                    </p>
                ),
            },
        ]}
    />
);

export default ZamenaSteklaExtra;
