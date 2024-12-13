import React from 'react';
import Image from "next/image";
import './styles.css';

const formBlockText = {
    title: 'ОСТАВЛЯЙТЕ ЗАЯВКУ ПРЯМО СЕЙЧАС',
    description: 'Оставьте свои данные и наш специалист свяжется с вами. Мы решим вашу проблему быстро и качественно!',
    confidence: 'Я даю согласие на обработку моих персональных данных и соглашаюсь с политикой конфиденциальности',
}

const FormBlock = () => {
    return (
        <div className="form-block-wrapper">
            <h3 className="form-block-title">{ formBlockText.title }</h3>
            <div className="form-block-description">{ formBlockText.description }</div>

            <div className="form-block-form-wrapper">
                <form className="form-block-form">
                    <input className="form-input" type="text" placeholder="Представьтесь, пожалуйста"/>
                    <input className="form-input" type="tel" placeholder="+375 (99) 999-99-99" required/>
                    <textarea className="form-input" rows={5} placeholder="Ваш комментарий"/>

                    <div className="form-confidence-wrapper">
                        <input className="form-block-confidence-checkbox" type="checkbox"/>
                        <div>{formBlockText.confidence}</div>
                    </div>

                    {/*<input className="form-block-form-submit" type="submit" value="Отправить"/>*/}
                    <div className="form-block-button-wrapper">
                        <button className="form-get-lead-button">
                            <span>Отправить</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 7H17M17 7V17M17 7L7 17" stroke="currentColor" strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </form>
            </div>

            <Image src="/images/zeekr-blue.png" alt="автомобиль" width={1214} height={490}/>
        </div>
    )
}

export default FormBlock;