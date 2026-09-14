import Image from "next/image";
import './styles.css';

const ListComponent = ({list, className, wrapperClassname}) => {
    return (
        <div className={`${wrapperClassname} list-wrapper`}>
            {
                list?.map((item, index) => (
                    <div className="item-wrapper" key={`${item}-${index + Math.random() * Math.random()}`}>
                        {/*
                          Маркер списка — декорация. Раньше у него был alt «Пункт», и на
                          главной 24 иконки подряд сообщали скринридеру и поисковику одно
                          и то же слово. Пустой alt — штатный способ сказать «изображение
                          не несёт смысла, пропусти его».
                        */}
                        <Image
                            src="/icons/plus.svg"
                            alt=""
                            aria-hidden="true"
                            width={20.58}
                            height={24.06}
                        />
                        <span className={className}>{item}</span>
                    </div>
                ))
            }
        </div>
    )
}

export default ListComponent;