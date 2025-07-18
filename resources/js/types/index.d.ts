import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Employees {
    id: number,
    employee_name: string,
    employee_type: string,
    employee_status: string,
    base_salary: number,
    overtime_pay: number,
    sss: number,
    philhealth: number,
    pag_ibig: number,
    withholding_tax: number,
    employee_category: string,
}

export interface Salary {
    id: number;
    employee_type: string;
    base_salary: number;
    overtime_pay: number;
    sss: number;
    philhealth: number;
    pag_ibig: number;
    withholding_tax: number;
}
