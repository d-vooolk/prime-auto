'use client'

import React, {useCallback, useEffect, useRef, useState} from "react";
import {formBlockText} from "@/components/FormBlock/FormBlock.jsx";
import {sendLeadToBot} from "@/app/api/tg-bot/leads";

const PHONE_MASK = '+375 (00) 000-00-00';
const PHONE_PLACEHOLDER = '+375 (__) ___-__-__';

const Form = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        message: '',
        agreement: true,
    });
    const [status, setStatus] = useState('');

    const formRef = useRef(null);
    const phoneRef = useRef(null);
    const maskRef = useRef(null);
    const isMaskRequested = useRef(false);

    /*
      imask — отдельный чанк на 60 КБ. Форма лежит в самом низу страницы, поэтому
      библиотека подтягивается, когда блок подъезжает к экрану (или сразу при фокусе
      на поле, если пользователь добрался туда быстрее). До этого поле работает как
      обычный tel-input, значение всё равно уходит в состояние через onChange.
    */
    const ensureMask = useCallback(() => {
        if (isMaskRequested.current || !phoneRef.current) {
            return;
        }
        isMaskRequested.current = true;

        import('imask')
            .then(({default: IMask}) => {
                if (!phoneRef.current) {
                    return;
                }

                const mask = IMask(phoneRef.current, {
                    mask: PHONE_MASK,
                    definitions: {'0': /[0-9]/},
                });

                maskRef.current = mask;
                mask.on('accept', () => {
                    setFormData((prevData) => ({...prevData, phone: mask.value}));
                });
            })
            .catch(() => {
                isMaskRequested.current = false;
            });
    }, []);

    useEffect(() => {
        const node = formRef.current;

        if (!node) {
            return;
        }

        if (typeof IntersectionObserver === 'undefined') {
            ensureMask();
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    ensureMask();
                    observer.disconnect();
                }
            },
            {rootMargin: '200px 0px'},
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [ensureMask]);

    useEffect(() => () => maskRef.current?.destroy(), []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const resetPhoneField = () => {
        if (maskRef.current) {
            maskRef.current.value = '';
        } else if (phoneRef.current) {
            phoneRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Отправка...');
        try {
            const response = await sendLeadToBot(formData);

            if (response.success) {
                setStatus('Данные успешно отправлены!');
                resetPhoneField();
                setFormData({ name: '', phone: '', message: '', agreement: false });
            } else {
                setStatus('Ошибка при отправке данных.');
            }
        } catch (error) {
            console.error('Error:', error);
            setStatus('Ошибка при отправке данных.');
        }
    };

    return (
        <form
            ref={formRef}
            className="form-block-form"
            onSubmit={handleSubmit}
        >
            <input
                className="form-input"
                type="text"
                id="lead-name"
                aria-label="Ваше имя"
                placeholder="Представьтесь, пожалуйста"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
            />
            <input
                ref={phoneRef}
                className="form-input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                id="lead-phone"
                aria-label="Номер телефона"
                placeholder={PHONE_PLACEHOLDER}
                name="phone"
                defaultValue=""
                onFocus={ensureMask}
                onChange={handleChange}
                required
            />
            <textarea
                className="form-input"
                rows={5}
                id="lead-message"
                aria-label="Ваш комментарий"
                placeholder="Ваш комментарий"
                name="message"
                value={formData.message}
                onChange={handleChange}
            />

            <div className="form-confidence-wrapper">
                <div id="container" className="gd">
                    <div className="toggle-button-container">
                        <div className="toggle-button gd">
                            <div className="btn btn-pill" id="button-1">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    id="agreement-checkbox"
                                    name="agreement"
                                    checked={formData.agreement}
                                    onChange={handleChange}
                                    required
                                />
                                <div className="knob"></div>
                                <div className="btn-bg"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Переключатель нарисован через :before у .knob, поэтому у самого
                    input нет видимой подписи — привязываем к нему текст согласия. */}
                <label className="form-confidence-label" htmlFor="agreement-checkbox">
                    {formBlockText.confidence}
                </label>
            </div>

            <div className="form-block-button-wrapper">
                <button type="submit" className="form-get-lead-button">
                    <span>Отправить</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M7 7H17M17 7V17M17 7L7 17" stroke="currentColor" strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
            {status && <p aria-live="polite">{status}</p>}
        </form>
    )
};

export default Form;
