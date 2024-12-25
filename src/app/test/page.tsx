'use client'

import React from 'react';
import {Button} from "antd";

const testHandler = async () => {
    try {
        const response = await fetch('https://prime-auto.by/send-application', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Test User',
                message: 'Hello, world!',
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Fetch error:', error);
    }
};

const TestPage = () => {
    return (
        <Button
            onClick={() => testHandler()}
            style={{ margin: "100px auto 100px" }}
        >
            SEND TEST RESPONSE
        </Button>
    )
}

export default TestPage;