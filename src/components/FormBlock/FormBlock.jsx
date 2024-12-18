import React from 'react';
import Image from "next/image";
import './styles.css';
import Form from "../_HelperComponents/Form/Form.jsx";

export const formBlockText = {
    title: 'ОСТАВЛЯЙТЕ ЗАЯВКУ ПРЯМО СЕЙЧАС',
    description: 'Оставьте свои данные и наш специалист свяжется с вами. Мы решим вашу проблему быстро и качественно!',
    confidence: 'Я даю согласие на обработку моих персональных данных и соглашаюсь с политикой конфиденциальности',
}

const FormBlock = () => {
    return (
        <div className="form-block-wrapper" id="leadForm">
            <h3 className="form-block-title">{ formBlockText.title }</h3>
            <div className="form-block-description">{ formBlockText.description }</div>

            <div className="form-block-form-wrapper">
                <Form />
            </div>

            <Image
                src="/images/zeekr-blue.png"
                alt="автомобиль"
                width={1214}
                height={490}
                className="form-block-car-image"
            />
        </div>
    )
}

export default FormBlock;