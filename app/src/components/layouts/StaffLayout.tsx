"use client"

import { ReactNode } from "react"
import { Breadcrumb } from "./Breadcrumb"
import { Sidebar } from "./Sidebar"

interface StaffLayoutProps {
    children: ReactNode
    role?: string
}

export const StaffLayout = ({ children, role = "staff" }: StaffLayoutProps) => {
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar role={role} />
            <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                    <Breadcrumb />
                    {children}
                </div>
            </div>
        </div>
    )
}
