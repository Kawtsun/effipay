import DialogScrollArea from './dialog-scroll-area';
import { formatFullName } from '../utils/formatFullName';
// Use the same formatting as employee-view-dialog
function formatWithCommas(value: string | number): string {
    let num = 0;
    if (value === null || value === undefined || value === '') {
        num = 0;
    } else {
        num = typeof value === 'number' ? value : Number(value);
        if (isNaN(num)) num = 0;
    }
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatTime12Hour(time?: string): string {
    if (!time) return '-';
    const parts = time.split(':');
    if (parts.length < 2) return '-';
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return '-';
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Employees } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { MonthPicker } from "./ui/month-picker";
import { useState, useEffect, useRef } from "react";
import { useEmployeePayroll } from "@/hooks/useEmployeePayroll";
import { toast } from "sonner";
import { Skeleton } from "./ui/skeleton";
import { RolesBadges } from "./roles-badges";

interface PayrollData {
    id: number;
    employee_id: number;
    month: string;
    payroll_date: string;
    base_salary: number;
    college_rate?: number;
    honorarium?: number;
    overtime?: number;
    sss: number;
    philhealth: number;
    pag_ibig: number;
    withholding_tax: number;
    tardiness?: number;
    undertime?: number;
    absences?: number;
    gross_pay: number;
    sss_salary_loan?: number;
    sss_calamity_loan?: number;
    pagibig_multi_loan?: number;
    pagibig_calamity_loan?: number;
    peraa_con?: number;
    tuition?: number;
    china_bank?: number;
    tea?: number;
    salary_loan?: number;
    calamity_loan?: number;
    multipurpose_loan?: number;
    total_deductions: number;
    net_pay: number;
    rate_per_hour?: number;
}

interface MonthlyPayrollData {
    payrolls: PayrollData[];
    month: string;
}

interface Props {
    employee: Employees | null;
    onClose: () => void;
    activeRoles?: string[];
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium break-words">{value}</p>
        </div>
    );
}

export default function ReportViewDialog({ employee, onClose, activeRoles }: Props) {
    // Debug: log the employee object to verify values
    console.log('Employee object in dialog:', employee);
    const [monthlyPayrollData, setMonthlyPayrollData] = useState<MonthlyPayrollData | null>(null);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [pendingMonth, setPendingMonth] = useState('');
    // Use payroll summary from timekeeping
    const { summary: timekeepingSummary } = useEmployeePayroll(employee?.id ?? null, pendingMonth);
    // Use payroll data for all payroll fields if available, else fallback to employee/timekeeping
    // Use the payroll with the latest payroll_date for the selected month
    let selectedPayroll: PayrollData | null = null;
    // Only show/calculate salary/contributions if payroll data exists for the month
    const hasPayroll = !!(monthlyPayrollData && monthlyPayrollData.payrolls && monthlyPayrollData.payrolls.length > 0);
    if (hasPayroll) {
        selectedPayroll = monthlyPayrollData!.payrolls.reduce((latest, curr) => {
            return new Date(curr.payroll_date) > new Date(latest.payroll_date) ? curr : latest;
        }, monthlyPayrollData!.payrolls[0]);
    }
    // Determine if this payroll is for a college instructor by checking employee.roles (case-insensitive)
    const isCollegeInstructorPayroll = employee && typeof employee.roles === 'string' && employee.roles.toLowerCase().includes('college instructor');
    const sss = hasPayroll ? Number(selectedPayroll?.sss) : null;
    const philhealth = hasPayroll ? Number(selectedPayroll?.philhealth) : null;
    const pag_ibig = hasPayroll ? Number(selectedPayroll?.pag_ibig) : null;
    const withholding_tax = hasPayroll ? Number(selectedPayroll?.withholding_tax) : null;
    const salary_loan = hasPayroll ? Number(selectedPayroll?.salary_loan ?? 0) : null;
    const peraa_con = hasPayroll ? Number(selectedPayroll?.peraa_con ?? 0) : null;
    const china_bank = hasPayroll ? Number(selectedPayroll?.china_bank ?? 0) : null;
    const tea = hasPayroll ? Number(selectedPayroll?.tea ?? 0) : null;
    const calamity_loan = hasPayroll ? Number(selectedPayroll?.calamity_loan ?? 0) : null;
    const multipurpose_loan = hasPayroll ? Number(selectedPayroll?.multipurpose_loan ?? 0) : null;
    function safeNumber(val: unknown, fallback = null) {
        return typeof val === 'number' && isFinite(val) ? val : fallback;
    }
    const totalDeductions = hasPayroll
        ? [sss, philhealth, pag_ibig, withholding_tax, salary_loan, peraa_con, china_bank, tea, calamity_loan, multipurpose_loan].reduce((sum: number, val) => sum + (typeof val === 'number' && isFinite(val) ? val : 0), 0)
        : null;
    const grossPay = hasPayroll ? safeNumber(Number(selectedPayroll?.gross_pay), null) : null;
    const netPay = hasPayroll ? safeNumber(Number(selectedPayroll?.net_pay), null) : null;
    const perPayroll = hasPayroll && netPay != null ? safeNumber(netPay / 2, null) : null;
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [loadingPayroll, setLoadingPayroll] = useState(false);
    const [minLoading, setMinLoading] = useState(false);
    const minLoadingTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (employee) {
            fetchAvailableMonths();
        }
        // eslint-disable-next-line
    }, [employee]);

    useEffect(() => {
        if (employee && pendingMonth) {
            fetchMonthlyPayrollData();
        } else {
            setMonthlyPayrollData(null);
        }
        // eslint-disable-next-line
    }, [employee, pendingMonth]);

    // Fetch merged months from backend (payroll + timekeeping)
    const fetchAvailableMonths = async () => {
        try {
            const response = await fetch('/payroll/all-available-months');
            const result = await response.json();
            if (result.success) {
                setAvailableMonths(result.months);
                if (result.months.length > 0 && !selectedMonth) {
                    setSelectedMonth(result.months[0]);
                    setPendingMonth(result.months[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching available months:', error);
        }
    };

    const fetchMonthlyPayrollData = async () => {
        if (!employee || !pendingMonth) return;
        setLoadingPayroll(true);
        setMinLoading(true);
        if (minLoadingTimeout.current) clearTimeout(minLoadingTimeout.current);
        minLoadingTimeout.current = setTimeout(() => setMinLoading(false), 400);
        try {
            const response = await fetch(route('payroll.employee.monthly', {
                employee_id: employee.id,
                month: pendingMonth,
            }));
            const result = await response.json();
            if (result.success) {
                setMonthlyPayrollData(result);
            } else {
                setMonthlyPayrollData(null);
                toast.error('No payroll data found for this month');
            }
        } catch (error) {
            console.error('Error fetching monthly payroll data:', error);
            setMonthlyPayrollData(null);
        } finally {
            setTimeout(() => setLoadingPayroll(false), 100);
        }
    };

    const handleMonthChange = (month: string) => {
        if (month !== selectedMonth) {
            setSelectedMonth(month);
            setPendingMonth(month);
        }
    };

    return (
        <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {!!employee && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <DialogContent className="max-w-6xl w-full px-8 py-4 sm:px-12 sm:py-6 z-[100] max-h-[90vh] flex flex-col min-h-0">
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle className="text-2xl font-bold mb-2">Employee Payroll Report</DialogTitle>
                            </DialogHeader>
                            <DialogScrollArea>
                                <div className="space-y-8 text-base">
                                    <div className="border-b pb-6 mb-2">
                                        <h3 className="text-2xl font-extrabold mb-1">#{employee.id} - {formatFullName(employee.last_name, employee.first_name, employee.middle_name)}</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-10 items-start mb-6">
                                        <div>
                                            <h4 className="font-semibold text-base mb-4 border-b pb-2">General Information</h4>
                                            <div className="space-y-2 text-sm">
                                                <Info label="Status" value={employee.employee_status} />
                                                <Info label="Type" value={employee.employee_type} />
                                                <Info label="Schedule" value={(() => {
                                                    if (employee.work_start_time && employee.work_end_time) {
                                                        const [startHour, startMinute] = employee.work_start_time.split(':').map(Number);
                                                        const [endHour, endMinute] = employee.work_end_time.split(':').map(Number);
                                                        const startMinutes = startHour * 60 + startMinute;
                                                        const endMinutes = endHour * 60 + endMinute;
                                                        let actualWorkMinutes = endMinutes - startMinutes;
                                                        if (actualWorkMinutes <= 0) actualWorkMinutes += 24 * 60;
                                                        const totalMinutes = Math.max(1, actualWorkMinutes - 60); // minus 1 hour for break
                                                        const hours = Math.floor(totalMinutes / 60);
                                                        const minutes = totalMinutes % 60;
                                                        const durationText = minutes === 0 ? `${hours} hours` : `${hours} hours and ${minutes} minutes`;
                                                        return `${formatTime12Hour(employee.work_start_time)} - ${formatTime12Hour(employee.work_end_time)} (${durationText})`;
                                                    }
                                                    return '-';
                                                })()} />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-base mb-4 border-b pb-2">Roles & Responsibilities</h4>
                                            <div className="flex flex-wrap gap-2 max-w-full px-2 py-2 break-words whitespace-pre-line min-h-[2.5rem] text-sm">
                                                <RolesBadges roles={employee.roles} activeRoles={activeRoles} employee={employee} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-lg">Salary & Contributions</h4>
                                            <MonthPicker
                                                value={selectedMonth}
                                                onValueChange={handleMonthChange}
                                                placeholder="Select month"
                                                className="w-46 min-w-0 px-2 py-1 text-sm"
                                                availableMonths={availableMonths}
                                            />
                                        </div>
                                        <AnimatePresence mode="wait">
                                            {(loadingPayroll || minLoading) ? (
                                                <motion.div
                                                    key="skeleton"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div className="grid grid-cols-4 gap-6 mb-6 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
                                                        {[
                                                            { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', labelW: 'w-24' },
                                                            { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', labelW: 'w-24' },
                                                            { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', labelW: 'w-24' },
                                                            { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', labelW: 'w-24' },
                                                            { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', labelW: 'w-24' },
                                                            { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', labelW: 'w-36' },
                                                            { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', labelW: 'w-20' },
                                                            { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', labelW: 'w-28', extra: true },
                                                        ].map((card, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`${card.bg} p-5 rounded-2xl border ${card.border} flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm min-h-[120px] h-full`}
                                                            >
                                                                <Skeleton className={`h-3 ${card.labelW} mb-2`} />
                                                                <Skeleton className={`h-8 w-32${card.extra ? ' mb-3' : ''}`} />
                                                                {card.extra && (
                                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                                        <Skeleton className="h-3 w-10 rounded-full" />
                                                                        <Skeleton className="h-3 w-2 rounded-full" />
                                                                        <Skeleton className="h-3 w-10 rounded-full" />
                                                                        <Skeleton className="h-3 w-2 rounded-full" />
                                                                        <Skeleton className="h-3 w-10 rounded-full" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* Detailed Breakdown Skeleton */}
                                                    <div className="grid grid-cols-3 gap-10 max-[900px]:grid-cols-1">
                                                        {/* Earnings */}
                                                        <div>
                                                            <Skeleton className="h-6 w-36 mb-4" />
                                                            <div className="space-y-3 text-sm">
                                                                <div>
                                                                    <Skeleton className="h-3 w-28 mb-1" />
                                                                    <Skeleton className="h-4 w-40" />
                                                                </div>
                                                                <div>
                                                                    <Skeleton className="h-3 w-26 mb-1" />
                                                                    <Skeleton className="h-4 w-36" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Deductions */}
                                                        <div>
                                                            <Skeleton className="h-6 w-24 mb-4" />
                                                            <div className="space-y-3 text-sm">
                                                                <div>
                                                                    <Skeleton className="h-3 w-12 mb-1" />
                                                                    <Skeleton className="h-4 w-32" />
                                                                </div>
                                                                <div>
                                                                    <Skeleton className="h-3 w-20 mb-1" />
                                                                    <Skeleton className="h-4 w-36" />
                                                                </div>
                                                                <div>
                                                                    <Skeleton className="h-3 w-16 mb-1" />
                                                                    <Skeleton className="h-4 w-32" />
                                                                </div>
                                                                <div>
                                                                    <Skeleton className="h-3 w-32 mb-1" />
                                                                    <Skeleton className="h-4 w-40" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Loans and Other Deductions Skeleton */}
                                                        <div>
                                                            <Skeleton className="h-6 w-32 mb-4" />
                                                            <div className="space-y-3 text-sm mb-8">
                                                                <Skeleton className="h-3 w-32 mb-1" />
                                                                <Skeleton className="h-4 w-32" />
                                                                <Skeleton className="h-3 w-32 mb-1" />
                                                                <Skeleton className="h-4 w-32" />
                                                                <Skeleton className="h-3 w-40 mb-1" />
                                                                <Skeleton className="h-4 w-40" />
                                                                <Skeleton className="h-3 w-40 mb-1" />
                                                                <Skeleton className="h-4 w-40" />
                                                                <Skeleton className="h-3 w-32 mb-1" />
                                                                <Skeleton className="h-4 w-32" />
                                                            </div>
                                                            <Skeleton className="h-6 w-32 mb-4" />
                                                            <div className="space-y-3 text-sm">
                                                                <Skeleton className="h-3 w-32 mb-1" />
                                                                <Skeleton className="h-4 w-32" />
                                                                <Skeleton className="h-3 w-32 mb-1" />
                                                                <Skeleton className="h-4 w-32" />
                                                                <Skeleton className="h-3 w-32 mb-1" />
                                                                <Skeleton className="h-4 w-32" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="content"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                >
                                                    {/* Summary Cards: 4 timekeeping (amounts) + 4 report cards */}
                                                    <div className="grid grid-cols-4 gap-6 mb-6 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
                                                        {/* Tardiness Amount */}
                                                        <motion.div
                                                            className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-2xl border border-orange-200 dark:border-orange-800 flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm min-h-[120px] h-full"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            whileHover={{ scale: 1.02 }}
                                                            transition={{ duration: 0.3, delay: 0.05 }}
                                                        >
                                                            <div className="text-xs text-orange-600 font-medium mb-2">Tardiness</div>
                                                            <div className="text-xl font-bold text-orange-700 dark:text-orange-300 break-words whitespace-nowrap">
                                                                {hasPayroll && selectedPayroll ? (() => {
                                                                    const tardiness = Number(selectedPayroll.tardiness) || 0;
                                                                    const rate = isCollegeInstructorPayroll ? (selectedPayroll.college_rate ?? 0) : (selectedPayroll.rate_per_hour ?? 0);
                                                                    return `₱${(tardiness * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                                                })() : '-'}
                                                            </div>
                                                        </motion.div>
                                                        {/* Undertime Amount */}
                                                        <motion.div
                                                            className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-200 dark:border-red-800 flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm min-h-[120px] h-full"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            whileHover={{ scale: 1.02 }}
                                                            transition={{ duration: 0.3, delay: 0.1 }}
                                                        >
                                                            <div className="text-xs text-red-600 font-medium mb-2">Undertime</div>
                                                            <div className="text-xl font-bold text-red-700 dark:text-red-300 break-words whitespace-nowrap">
                                                                {hasPayroll && selectedPayroll ? (() => {
                                                                    const undertime = Number(selectedPayroll.undertime) || 0;
                                                                    const rate = isCollegeInstructorPayroll ? (selectedPayroll.college_rate ?? 0) : (selectedPayroll.rate_per_hour ?? 0);
                                                                    return `₱${(undertime * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                                                })() : '-'}
                                                            </div>
                                                        </motion.div>
                                                        {/* Overtime Amount */}
                                                        <motion.div
                                                            className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-200 dark:border-blue-800 flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm min-h-[120px] h-full"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            whileHover={{ scale: 1.02 }}
                                                            transition={{ duration: 0.3, delay: 0.15 }}
                                                        >
                                                            <div className="text-xs text-blue-600 font-medium mb-2">Overtime</div>
                                                            <div className="text-xl font-bold text-blue-700 dark:text-blue-300 break-words whitespace-nowrap">
                                                                {hasPayroll && selectedPayroll ? (() => {
                                                                    const overtime = Number(selectedPayroll.overtime) || 0;
                                                                    const rate = isCollegeInstructorPayroll ? (selectedPayroll.college_rate ?? 0) : (selectedPayroll.rate_per_hour ?? 0);
                                                                    return `₱${(overtime * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                                                })() : '-'}
                                                            </div>
                                                        </motion.div>
                                                        {/* Absences Amount */}
                                                        <motion.div
                                                            className="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm min-h-[120px] h-full"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            whileHover={{ scale: 1.02 }}
                                                            transition={{ duration: 0.3, delay: 0.2 }}
                                                        >
                                                            <div className="text-xs text-gray-600 font-medium mb-2">Absences</div>
                                                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words whitespace-nowrap">
                                                                {hasPayroll && selectedPayroll ? (() => {
                                                                    const absences = Number(selectedPayroll.absences) || 0;
                                                                    const rate = isCollegeInstructorPayroll ? (selectedPayroll.college_rate ?? 0) : (selectedPayroll.rate_per_hour ?? 0);
                                                                    return `₱${(absences * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                                                })() : '-'}
                                                            </div>
                                                        </motion.div>
                                                        {/* Gross Pay */}
                                                        <motion.div
                                                            className="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm min-h-[120px] h-full"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            whileHover={{ scale: 1.02 }}
                                                            transition={{ duration: 0.3, delay: 0.25 }}
                                                        >
                                                            <div className="text-xs text-gray-600 font-medium mb-2">Gross Pay</div>
                                                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words whitespace-nowrap">{hasPayroll && selectedPayroll ? `₱${formatWithCommas(selectedPayroll.gross_pay)}` : '-'}</div>
                                                        </motion.div>
                                                        {/* Deductions */}
                                                        <motion.div
                                                            className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-2xl border border-orange-200 dark:border-orange-800 flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm min-h-[120px] h-full"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            whileHover={{ scale: 1.02 }}
                                                            transition={{ duration: 0.3, delay: 0.2 }}
                                                        >
                                                            <div className="text-xs text-orange-600 font-medium mb-2">Total Deductions</div>
                                                            <div className="text-xl font-bold text-orange-700 dark:text-orange-300 break-words whitespace-nowrap">{hasPayroll && selectedPayroll ? `₱${formatWithCommas(selectedPayroll.total_deductions)}` : '-'}</div>
                                                        </motion.div>
                                                        {/* Net Pay */}
                                                        <motion.div
                                                            className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-200 dark:border-green-800 flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm min-h-[120px] h-full"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            whileHover={{ scale: 1.02 }}
                                                            transition={{ duration: 0.3, delay: 0.3 }}
                                                        >
                                                            <div className="text-xs text-green-600 font-medium mb-2">Net Pay</div>
                                                            <div className="text-xl font-bold text-green-700 dark:text-green-300 break-words whitespace-nowrap">{hasPayroll && selectedPayroll ? `₱${formatWithCommas(selectedPayroll.net_pay)}` : '-'}</div>
                                                        </motion.div>
                                                        {/* Per Payroll */}
                                                        <motion.div
                                                            className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-200 dark:border-blue-800 flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm min-h-[120px] h-full"
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            whileHover={{ scale: 1.02 }}
                                                            transition={{ duration: 0.3, delay: 0.4 }}
                                                        >
                                                            <div className="text-xs text-blue-600 font-medium mb-2">Per Payroll</div>
                                                            <div className="text-xl font-bold text-blue-700 dark:text-blue-300 break-words whitespace-nowrap">{hasPayroll && typeof perPayroll === 'number' ? `₱${perPayroll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</div>
                                                            <div className="flex flex-wrap gap-1 mt-2 overflow-x-auto max-w-full text-xs">
                                                                {hasPayroll
                                                                    ? monthlyPayrollData.payrolls.map((payroll, index) => (
                                                                        <div key={payroll.id} className="flex items-center gap-1 whitespace-nowrap">
                                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                            {new Date(payroll.payroll_date).toLocaleDateString('en-US', {
                                                                                month: 'short',
                                                                                day: 'numeric'
                                                                            })}
                                                                            {index < monthlyPayrollData.payrolls.length - 1 && <span className="text-blue-400">•</span>}
                                                                        </div>
                                                                    ))
                                                                    : <span className="text-blue-300">No payrolls</span>
                                                                }
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                    {/* Detailed Breakdown and Totals remain as before */}
                                                    <motion.div
                                                        className="grid grid-cols-1 gap-3 max-[900px]:grid-cols-1"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ duration: 0.3, delay: 0.5 }}
                                                    >
                                                        {/* Salary & Contributions Section - Three Columns */}
                                                        <div className="pt-2">
                                                            <div className="grid grid-cols-3 gap-3 items-start w-full"> {/* Three columns layout */}
                                                                {/* Income & Benefits */}
                                                                <div className="px-8 min-h-[200px] flex flex-col justify-start">
                                                                    <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Income & Benefits</h5>
                                                                    <div className="space-y-3 text-sm">
                                                                        {isCollegeInstructorPayroll ? (
                                                                            <Info label="Rate Per Hour" value={hasPayroll && selectedPayroll && selectedPayroll.college_rate !== undefined && selectedPayroll.college_rate !== null ? `₱${formatWithCommas(selectedPayroll.college_rate)}` : '-'} />
                                                                        ) : (
                                                                            <Info label="Monthly Salary" value={hasPayroll && selectedPayroll && selectedPayroll.base_salary !== null && selectedPayroll.base_salary !== undefined ? `₱${formatWithCommas(selectedPayroll.base_salary)}` : '-'} />
                                                                        )}
                                                                        <Info label="Honorarium" value={hasPayroll && selectedPayroll && selectedPayroll.honorarium !== null && selectedPayroll.honorarium !== undefined ? `₱${formatWithCommas(selectedPayroll.honorarium)}` : '-'} />
                                                                    </div>
                                                                </div>
                                                                {/* Deductions (center column) */}
                                                                <div className="px-8 min-h-[200px] flex flex-col justify-start col-start-2 col-end-3">
                                                                    <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Deductions</h5>
                                                                    <div className="space-y-3 text-sm">
                                                                        <Info label="SSS" value={hasPayroll && selectedPayroll && selectedPayroll.sss !== null && selectedPayroll.sss !== undefined ? `₱${formatWithCommas(selectedPayroll.sss)}` : '-'} />
                                                                        <Info label="PhilHealth" value={hasPayroll && selectedPayroll && selectedPayroll.philhealth !== null && selectedPayroll.philhealth !== undefined ? `₱${formatWithCommas(selectedPayroll.philhealth)}` : '-'} />
                                                                        <Info label="Pag-IBIG" value={hasPayroll && selectedPayroll && selectedPayroll.pag_ibig !== null && selectedPayroll.pag_ibig !== undefined ? `₱${formatWithCommas(selectedPayroll.pag_ibig)}` : '-'} />
                                                                        <Info label="Withholding Tax" value={hasPayroll && selectedPayroll && selectedPayroll.withholding_tax !== null && selectedPayroll.withholding_tax !== undefined ? `₱${formatWithCommas(selectedPayroll.withholding_tax)}` : '-'} />
                                                                    </div>
                                                                </div>
                                                                {/* Loans and Other Deductions (right column) - match image labels and order */}
                                                                <div className="px-8 min-h-[200px] flex flex-col justify-start col-start-3 col-end-4">
                                                                    <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Loans</h5>
                                                                    <div className="space-y-3 text-sm mb-8">
                                                                        <Info label="SSS Salary Loan" value={hasPayroll && selectedPayroll && selectedPayroll.sss_salary_loan !== null && selectedPayroll.sss_salary_loan !== undefined ? `₱${formatWithCommas(selectedPayroll.sss_salary_loan)}` : '-'} />
                                                                        <Info label="SSS Calamity Loan" value={hasPayroll && selectedPayroll && selectedPayroll.sss_calamity_loan !== null && selectedPayroll.sss_calamity_loan !== undefined ? `₱${formatWithCommas(selectedPayroll.sss_calamity_loan)}` : '-'} />
                                                                        <Info label="Pag-IBIG Multi Purpose Loan" value={hasPayroll && selectedPayroll && selectedPayroll.pagibig_multi_loan !== null && selectedPayroll.pagibig_multi_loan !== undefined ? `₱${formatWithCommas(selectedPayroll.pagibig_multi_loan)}` : '-'} />
                                                                        <Info label="Pag-IBIG Calamity Loan" value={hasPayroll && selectedPayroll && selectedPayroll.pagibig_calamity_loan !== null && selectedPayroll.pagibig_calamity_loan !== undefined ? `₱${formatWithCommas(selectedPayroll.pagibig_calamity_loan)}` : '-'} />
                                                                        <Info label="PERAA Con." value={hasPayroll && selectedPayroll && selectedPayroll.peraa_con !== null && selectedPayroll.peraa_con !== undefined ? `₱${formatWithCommas(selectedPayroll.peraa_con)}` : '-'} />
                                                                    </div>
                                                                    <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Other Deductions</h5>
                                                                    <div className="space-y-3 text-sm">
                                                                        <Info label="Tuition" value={hasPayroll && selectedPayroll && selectedPayroll.tuition !== null && selectedPayroll.tuition !== undefined ? `₱${formatWithCommas(selectedPayroll.tuition)}` : '-'} />
                                                                        <Info label="China Bank" value={hasPayroll && selectedPayroll && selectedPayroll.china_bank !== null && selectedPayroll.china_bank !== undefined ? `₱${formatWithCommas(selectedPayroll.china_bank)}` : '-'} />
                                                                        <Info label="TEA" value={hasPayroll && selectedPayroll && selectedPayroll.tea !== null && selectedPayroll.tea !== undefined ? `₱${formatWithCommas(selectedPayroll.tea)}` : '-'} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </DialogScrollArea>
                            <DialogFooter className="flex-shrink-0">
                                <Button onClick={onClose}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Dialog>
    );
}