import Image from "next/image";
import {Alts} from "@/meta/alts";
import './styles.css';

const ListComponent = ({list, className}) => {
    return (
        <div className="list-wrapper">
            {
                list?.map((item, index) => (
                    <div className="item-wrapper" key={`${item}-${index + Math.random() * Math.random()}`}>
                        <Image
                            src="icons/plus.svg"
                            alt={Alts.welcomeBlock.plus}
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