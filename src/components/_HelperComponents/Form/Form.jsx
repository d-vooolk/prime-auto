'use client'

import React, {useCallback, useEffect, useId, useRef, useState} from "react";
import {formBlockText} from "@/components/FormBlock/FormBlock.jsx";
import {sendLeadToBot} from "@/app/api/tg-bot/leads";
import {GOALS, reachGoal} from "@/utils/analytics";
import {CONTACTS_DATA} from "@/constants/contactsData";
import {trackConversion} from "@/utils/conversions";
import {leadContext, shrinkImage} from "@/utils/leadContext";

const MAX_PHOTOS = 3;

const ERROR_TEXT = `Не получилось отправить заявку. Позвоните нам: ${CONTACTS_DATA.phone1} — или напишите в Telegram.`;

const PHONE_MASK = '+375 (00) 000-00-00';
const PHONE_PLACEHOLDER = '+375 (__) ___-__-__';

/*
  initialMessage — текст, которым заполняется комментарий (подбор «Что с фарой?»
  открывает попап с уже описанной проблемой). Фото фары сжимаются в браузере
  и уходят вместе с заявкой; к заявке добавляются страница и источник визита.
*/
const Form = ({initialMessage = ''}) => {
    // форм на странице может быть две (внизу и в попапе) — id полей должны различаться
    const uid = useId();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        message: initialMessage,
        agreement: true,
    });
    const [status, setStatus] = useState('');
    const [photos, setPhotos] = useState([]);

    const addPhotos = async (event) => {
        const files = [...(event.target.files ?? [])].slice(0, MAX_PHOTOS - photos.length);
        event.target.value = '';
        const shrunk = [];
        for (const file of files) {
            try {
                shrunk.push(await shrinkImage(file));
            } catch {
                /* не картинка — пропускаем */
            }
        }
        setPhotos((current) => [...current, ...shrunk].slice(0, MAX_PHOTOS));
    };

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
            const response = await sendLeadToBot({...formData, ...leadContext(), photos});

            if (response?.success) {
                reachGoal(GOALS.lead);
                trackConversion('lead');
                setStatus('Данные успешно отправлены!');
                resetPhoneField();
                setFormData({ name: '', phone: '', message: '', agreement: false });
                setPhotos([]);
            } else {
                setStatus(ERROR_TEXT);
            }
        } catch (error) {
            console.error('Error:', error);
            setStatus(ERROR_TEXT);
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
                id={`${uid}-name`}
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
                id={`${uid}-phone`}
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
                id={`${uid}-message`}
                aria-label="Ваш комментарий"
                placeholder="Ваш комментарий"
                name="message"
                value={formData.message}
                onChange={handleChange}
            />

            <div className="form-photos">
                <label className="form-photos-add" htmlFor={`${uid}-photos`} aria-disabled={photos.length >= MAX_PHOTOS}>
                    <span aria-hidden="true">📷</span>
                    {photos.length ? `Добавить ещё фото (${photos.length}/${MAX_PHOTOS})` : 'Прикрепить фото фары — оценим по фото'}
                </label>
                <input
                    id={`${uid}-photos`}
                    type="file"
                    accept="image/*"
                    multiple
                    className="form-photos-input"
                    onChange={addPhotos}
                    disabled={photos.length >= MAX_PHOTOS}
                />
                {photos.length > 0 && (
                    <ul className="form-photos-list">
                        {photos.map((src, index) => (
                            <li key={index}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt={`Фото ${index + 1}`} />
                                <button type="button" aria-label="Убрать фото" onClick={() => setPhotos((list) => list.filter((_, i) => i !== index))}>×</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="form-confidence-wrapper">
                <div className="gd">
                    <div className="toggle-button-container">
                        <div className="toggle-button gd">
                            <div className="btn btn-pill btn-toggle">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    id={`${uid}-agreement`}
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
                <label className="form-confidence-label" htmlFor={`${uid}-agreement`}>
                    {formBlockText.confidence}
                </label>
            </div>

            <div className="form-block-button-wrapper">
                <button type="submit" className="form-get-lead-button" disabled={status === 'Отправка...'}>
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
