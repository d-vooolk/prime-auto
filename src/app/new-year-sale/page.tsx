'use client'

import React from "react";
import CircleChart from "@/components/_HelperComponents/CircleChart/CircleChart";
import './styles.css';
import {Card, Table} from "antd";
import {Snowfall} from "react-snowfall";
import FormBlock from "@/components/FormBlock/FormBlock";

const dataSource: any[] = [
    {
        key: '1',
        index: 1,
        client: "Виктор",
        auto: "Volkswagen Passat B6",
        module: "Vision Ultimate",
    },
    {
        key: '2',
        index: 2,
        client: "Артём",
        auto: "Renault Laguna 3",
        module: "Vision Ultimate",
    },
    {
        key: '3',
        index: 3,
        client: "Владислав",
        auto: "Lexus LS 430 3",
        module: "Vision Advance",
    },
    {
        key: '4',
        index: 4,
        client: "Алексей",
        auto: "Audi A6C6",
        module: "Sanvi F50",
    },
    {
        key: '5',
        index: 5,
        client: "Антон",
        auto: "BMW e70",
        module: "Sanvi F50",
    },
    {
        key: '6',
        index: 6,
        client: "Марина",
        auto: "Audi A5",
        module: "Vision Advance",
    },
    {
        key: '7',
        index: 7,
        client: "Максим",
        auto: "Audi A4B6",
        module: "Vision Ultimate",
    },
    {
        key: '8',
        index: 8,
        client: "Юрий",
        auto: "Mazda 6",
        module: "Sanvi F50",
    },
    {
        key: '9',
        index: 9,
        client: "Артём",
        auto: "Renault Megane 3",
        module: "Sanvi F50",
    },
];

const columns = [
    {
        title: '#',
        dataIndex: 'index',
        key: 'index',
    },
    {
        title: 'Клиент',
        dataIndex: 'client',
        key: 'client',
    },
    {
        title: 'Авто',
        dataIndex: 'auto',
        key: 'auto',
    },
    {
        title: 'Модуль',
        dataIndex: 'module',
        key: 'module',
    },
];

const NewYearSale = () => {
    return (
        <div className="circle-chart-page-wrapper" style={{textAlign: "center"}}>
            <Snowfall/>
            <div style={{ paddingTop: "100px" }}></div>
            <h1 className="circle-chart-head-text">Новогодняя скидка 25% на установку билед модулей 🎁</h1>

            <div className="circle-chart-description">Успей забронировать себе праздничную цену 🙃</div>
            <div className="circle-chart-table-title">Осталось записей:</div>

            <CircleChart value={dataSource.length}/>

            {
                dataSource.length
                    ? (
                        <>
                            <div className="circle-chart-table-title">Уже успели забронировать:</div>
                            <Card className="circle-chart-table-wrapper">
                                <Table
                                    dataSource={dataSource}
                                    columns={columns}
                                    className="circle-chart-table"
                                    pagination={false}
                                    style={{ width: "100%" }}
                                />
                            </Card>
                        </>
                    )
                    : null
            }


            <FormBlock />
        </div>
    );
}

export default NewYearSale;