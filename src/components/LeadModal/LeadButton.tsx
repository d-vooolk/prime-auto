'use client'

import React from "react";
import {openLeadModal} from "./LeadModal";

/** Кнопка, открывающая попап заявки. Внешний вид — через className */
const LeadButton = ({className, children, message}: {className?: string; children: React.ReactNode; message?: string}) => (
    <button type="button" className={className} onClick={() => openLeadModal(message)}>
        {children}
    </button>
);

export default LeadButton;
