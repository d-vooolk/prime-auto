'use client'

import React from "react";
import {openLeadModal} from "./LeadModal";

/** Кнопка, открывающая попап заявки. Внешний вид — через className */
const LeadButton = ({className, children}: {className?: string; children: React.ReactNode}) => (
    <button type="button" className={className} onClick={openLeadModal}>
        {children}
    </button>
);

export default LeadButton;
