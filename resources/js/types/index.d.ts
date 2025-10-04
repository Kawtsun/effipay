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
    id: number;
    last_name: string;
    first_name: string;
    middle_name: string;
    employee_type: string;
    employee_status: string;
    roles: string;
    base_salary: number;
    honorarium: number;
    college_rate?: number;
    overtime_pay: number;
    sss: number;
    philhealth: number;
    pag_ibig: number;
    college_program?: string;
    withholding_tax: number;
    work_hours_per_day: number;
    work_start_time: string;
    work_end_time: string;
        late_count?: number;
        early_count?: number;
        overtime_count?: number;
        overtime_count_weekdays?: number;
        overtime_count_weekends?: number;
        overtime_pay_total?: number;
        absences?: number;
    rate_per_day?: number;
    rate_per_hour?: number;
    gross_pay?: number;
    total_deductions?: number;
    net_pay?: number;
    per_payroll?: number;
    salary_loan?: number;
    peraa_con?: number;
    china_bank?: number;
    tea?: number;
    calamity_loan?: number;
    multipurpose_loan?: number;
    work_days?: WorkDayTime[];
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
    work_hours_per_day: number;
}
