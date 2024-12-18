'use client'

import React, {useState} from "react";
import {formBlockText} from "../../FormBlock/FormBlock.jsx";

const Form = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        comment: '',
        agreement: true,
    });
    const [status, setStatus] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Отправка...');
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus('Данные успешно отправлены!');
                setFormData({ name: '', phone: '', comment: '', agreement: false });
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
            className="form-block-form"
            onSubmit={handleSubmit}
        >
            <input
                className="form-input"
                type="text"
                placeholder="Представьтесь, пожалуйста"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
            />
            <input
                className="form-input"
                type="tel"
                placeholder="+375 (99) 999-99-99"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
            />
            <textarea
                className="form-input"
                rows={5}
                placeholder="Ваш комментарий"
                name="comment"
                value={formData.comment}
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

                <div>{formBlockText.confidence}</div>
            </div>

            <div className="form-block-button-wrapper">
                <button type="submit" className="form-get-lead-button">
                    <span>Отправить</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 7H17M17 7V17M17 7L7 17" stroke="currentColor" strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
            {status && <p>{status}</p>}
        </form>
    )
};

export default Form;