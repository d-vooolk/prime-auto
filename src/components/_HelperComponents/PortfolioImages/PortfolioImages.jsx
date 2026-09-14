import React from "react";
import Image from "next/image";
import './styles.css';

/*
  Раньше у всех восьми фотографий был один alt — «примеры работ», а файлы
  назывались 1.webp … 8.webp. Для мастерской, которая продаёт видимый результат,
  поиск по картинкам — живой канал заявок, и он не работал вообще: описать снимок
  поисковику было нечем.

  Описания взяты с самих фотографий — на каждой подписаны марка, модель и
  перечень выполненных работ, так что alt не выдуман, а соответствует кадру.
*/
const works = [
    {file: '1.webp', alt: 'Фара BMW E60 после установки Bi-Led модулей: новые стёкла, маркеры и ресницы'},
    {file: '2.webp', alt: 'Фара Jaguar XE после установки Bi-Led модулей, замены стёкол и оклейки плёнкой'},
    {file: '3.webp', alt: 'Фара BMW X5 E70 после установки Bi-Led модулей, замены стёкол и оклейки плёнкой'},
    {file: '4.webp', alt: 'Фара Audi A8 D3 после установки Bi-Led модулей, замены стёкол и оклейки плёнкой'},
    {file: '5.webp', alt: 'Mercedes SLK после установки Bi-Led модулей и замены стёкол фар'},
    {file: '6.webp', alt: 'Фара Dodge Challenger после установки Bi-Led модулей с подсветкой колец'},
    {file: '7.webp', alt: 'Фара BMW X1 после установки Bi-Led модулей, замены стёкол и оклейки плёнкой'},
    {file: '8.webp', alt: 'Фара BMW G30 после полировки и оклейки защитной плёнкой'},
];

const PortfolioImages = () => {
    return (
        <div className="portfolio-images-wrapper">
            {
                works.map((work) => (
                    <div className="portfolio-image-wrapper" key={work.file}>
                        <Image
                            src={`/images/portfolio/${work.file}`}
                            alt={work.alt}
                            width={250}
                            height={250}
                            className="portfolio-image"
                        />
                    </div>
                ))
            }
        </div>
    )
}

export default PortfolioImages;
