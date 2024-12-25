'use client'

import React from "react";
import CircleChart from "@/components/_HelperComponents/CircleChart/CircleChart";
import './styles.css';
import {Button, Card, Table} from "antd";

const dataSource = [
    // {
    //     key: '1',
    //     index: 1,
    //     client: "Волк Д. И.",
    //     auto: "BMW e39",
    // },
    // {
    //     key: '2',
    //     index: 2,
    //     client: "Иванова В. А.",
    //     auto: "Audi A5",
    // },
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
];

const NewYearSale = () => {
    const currentValue = 10;

    const leadHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
    }

    return (
        <div className="circle-chart-page-wrapper" style={{textAlign: "center", paddingTop: 100}}>
            <h1 className="circle-chart-head-text">Новогодняя скидка 25% на установку билед модулей 🎁</h1>

            <div className="circle-chart-description">Успей забронировать себе новогоднюю цену 🙃</div>
            <div className="circle-chart-table-title">Осталось записей:</div>

            <CircleChart value={currentValue}/>

            {
                dataSource.length
                    ? (<div className="circle-chart-table-title">Уже успели забронировать:</div>)
                    : null
            }

            {
                dataSource.length
                    ? (
                        <Card className="circle-chart-table-wrapper">
                            <Table
                                dataSource={dataSource}
                                columns={columns}
                                className="circle-chart-table"
                                pagination={false}
                            />
                        </Card>
                    )
                    : null
            }

            <Button
                type="primary"
                size="large"
                style={{ marginTop: 50 }}
                onClick={(e) => leadHandler(e)}
            >
                Записаться 🎁
            </Button>
        </div>
    );
}

export default NewYearSale;