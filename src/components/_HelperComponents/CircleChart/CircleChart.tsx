import React from "react";
import "./styles.css";

type CircleChartProps = {
    value: number;
};

const CircleChart: React.FC<CircleChartProps> = ({ value }) => {
    const maxValue = 10;
    const normalizedValue = Math.min(Math.max(value, 0), maxValue);
    const percentage = (normalizedValue / maxValue) * 100;
    const strokeDasharray = `${percentage} ${100 - percentage}`;

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <svg
                width="300"
                height="300"
                viewBox="0 0 36 36"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Фон кольца */}
                <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#e6e6e6"
                    strokeWidth="2"
                />
                {/* Заполненная часть */}
                <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#A2DB00FF"
                    strokeWidth="4"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset="25"
                />
                {/* Число в центре */}
                <text
                    x="18"
                    y="20.5"
                    fill="#333"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="circle-text"
                >
                    {normalizedValue}
                </text>
            </svg>
        </div>
    );
};

export default CircleChart;
