import { formatFullName } from '../utils/formatFullName';

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
} from "@/components/ui/dialog"
import DialogScrollArea from './dialog-scroll-area';

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./ui/button"
import { RolesBadges, getCollegeProgramLabel } from "./roles-badges"
import { MonthPicker } from "./ui/month-picker"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Skeleton } from "./ui/skeleton"


interface PayrollData {
    id: number
    employee_id: number
    month: string
    payroll_date: string
    base_salary: number
    sss: number
    philhealth: number
    pag_ibig: number
    withholding_tax: number
    gross_pay: number
    total_deductions: number
    net_pay: number
}

interface MonthlyPayrollData {
    payrolls: PayrollData[]
    month: string
}

interface Employees {
    overtime_pay: number;
    id: number;
    last_name: string;
    first_name: string;
    middle_name: string;
    employee_type: string;
    employee_status: string;
    roles: string;
    base_salary: number;
    sss: number;
    philhealth: number;
    pag_ibig: number;
    withholding_tax: number;
    work_hours_per_day: number;
    work_start_time: string;
    work_end_time: string;
    sss_salary_loan?: number;
    sss_calamity_loan?: number;
    pagibig_multi_loan?: number;
    pagibig_calamity_loan?: number;
    peraa_con?: number;
    tuition?: number;
    china_bank?: number;
    tea?: number;
    honorarium: number;
    college_program?: string;
}

interface Props {
    employee: Employees | null;
    onClose: () => void;
    activeRoles?: string[];
    showPayroll?: boolean;
}

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

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium break-words">{value}</p>
        </div>
    )
}




export default function EmployeeViewDialog({ employee, onClose, activeRoles, showPayroll = false }: Props) {
    const [selectedMonth, setSelectedMonth] = useState('');
    const [pendingMonth, setPendingMonth] = useState(''); // for delayed update
    const [monthlyPayrollData, setMonthlyPayrollData] = useState<MonthlyPayrollData | null>(null);
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [loadingPayroll, setLoadingPayroll] = useState(false);
    const [minLoading, setMinLoading] = useState(false);
    const minLoadingTimeout = useRef<NodeJS.Timeout | null>(null);

    // Fetch available months when employee changes
    useEffect(() => {
        if (employee) {
            fetchAvailableMonths();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employee]);

    // Fetch monthly payroll data when month changes
    useEffect(() => {
        if (employee && pendingMonth) {
            fetchMonthlyPayrollData();
        } else {
            setMonthlyPayrollData(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employee, pendingMonth]);

    const fetchAvailableMonths = async () => {
        if (!employee) return;
        try {
            const response = await fetch(route('payroll.employee.months', { employee_id: employee.id }));
            const result = await response.json();
            if (result.success) {
                setAvailableMonths(result.months);
                // Auto-select the most recent month if available
                if (result.months.length > 0 && !selectedMonth) {
                    setSelectedMonth(result.months[0]);
                    setPendingMonth(result.months[0]); // trigger payroll fetch on first load
                }
            }
        } catch (error) {
            console.error('Error fetching available months:', error);
        }
    }

    const fetchMonthlyPayrollData = async () => {
        if (!employee || !pendingMonth) return;
        setLoadingPayroll(true);
        setMinLoading(true);
        if (minLoadingTimeout.current) clearTimeout(minLoadingTimeout.current);
        minLoadingTimeout.current = setTimeout(() => setMinLoading(false), 400);
        try {
            const response = await fetch(route('payroll.employee.monthly', {
                employee_id: employee.id,
                month: pendingMonth
            }));
            const result = await response.json();
            if (result.success) {
                setMonthlyPayrollData(result);
                // Do not update selectedMonth here; it's already set in handleMonthChange
            } else {
                setMonthlyPayrollData(null);
            }
        } catch (error) {
            console.error('Error fetching monthly payroll data:', error);
            setMonthlyPayrollData(null);
        } finally {
            setTimeout(() => setLoadingPayroll(false), 100); // allow animation to finish
        }
    }

    // When user picks a month, set both selectedMonth and pendingMonth
    const handleMonthChange = (month: string) => {
        if (month !== selectedMonth) {
            setSelectedMonth(month);
            setPendingMonth(month);
        }
    }

    return (
        <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {!!employee && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{
                            duration: 0.2,
                            ease: "easeOut"
                        }}
                    >
                        <DialogContent className="max-w-6xl w-full px-8 py-4 sm:px-12 sm:py-6 z-[100] max-h-[90vh] flex flex-col min-h-0">
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle className="text-2xl font-bold mb-2">Employee Details</DialogTitle>
                            </DialogHeader>
                            {/* Scrollable content area with shadcn ScrollArea */}
                            <DialogScrollArea>
                                {/* All scrollable content directly inside ScrollArea, no extra wrappers */}
                                {/* Employee Header */}
                                <div className="space-y-12 text-base">
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
                                            <div className="flex flex-wrap gap-3 max-w-full px-2 py-2 break-words whitespace-pre-line min-h-[2.5rem] text-sm">
                                                <RolesBadges roles={employee.roles} activeRoles={activeRoles} employee={employee} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
                                    <div className="pt-2">
                                        <h4 className="font-semibold text-lg mb-6">Salary & Contributions</h4>
                                        <div className="grid grid-cols-3 gap-3 items-start w-full">
                                            <div className="px-8 min-h-[200px] flex flex-col justify-start">
                                                <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Income & Benefits</h5>
                                                <div className="space-y-3 text-sm">
                                                    {employee.roles.split(',').includes('college instructor') ? (
                                                        <Info label="Rate Per Hour" value={`₱${formatWithCommas((employee as any).college_rate ?? 0)}`} />
                                                    ) : (
                                                        <Info label="Base Salary" value={`₱${formatWithCommas(employee.base_salary)}`} />
                                                    )}
                                                    <Info label="Honorarium" value={`₱${formatWithCommas(employee.honorarium ?? 0)}`} />
                                                </div>
                                            </div>
                                            <div className="px-8 min-h-[200px] flex flex-col justify-start col-start-2 col-end-3">
                                                <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Deductions</h5>
                                                <div className="space-y-3 text-sm">
                                                    <Info label="SSS" value={`₱${formatWithCommas(employee.sss)}`} />
                                                    <Info label="PhilHealth" value={`₱${formatWithCommas(employee.philhealth)}`} />
                                                    <Info label="Pag-IBIG" value={`₱${formatWithCommas(employee.pag_ibig)}`} />
                                                    <Info label="Withholding Tax" value={`₱${formatWithCommas(employee.withholding_tax)}`} />
                                                </div>
                                            </div>
                                            <div className="px-8 min-h-[200px] flex flex-col justify-start col-start-3 col-end-4">
                                                <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Loans</h5>
                                                <div className="space-y-3 text-sm mb-8">
                                                    <Info label="SSS Salary Loan" value={`₱${formatWithCommas(employee.sss_salary_loan ?? 0)}`} />
                                                    <Info label="SSS Calamity Loan" value={`₱${formatWithCommas(employee.sss_calamity_loan ?? 0)}`} />
                                                    <Info label="Pag-IBIG Multi Purpose Loan" value={`₱${formatWithCommas(employee.pagibig_multi_loan ?? 0)}`} />
                                                    <Info label="Pag-IBIG Calamity Loan" value={`₱${formatWithCommas(employee.pagibig_calamity_loan ?? 0)}`} />
                                                    <Info label="PERAA Con." value={`₱${formatWithCommas(employee.peraa_con ?? 0)}`} />
                                                </div>
                                                <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Other Deductions</h5>
                                                <div className="space-y-3 text-sm">
                                                    <Info label="Tuition" value={`₱${formatWithCommas(employee.tuition ?? 0)}`} />
                                                    <Info label="China Bank" value={`₱${formatWithCommas(employee.china_bank ?? 0)}`} />
                                                    <Info label="TEA" value={`₱${formatWithCommas(employee.tea ?? 0)}`} />
                                                </div>
                                            </div>
                                        </div>
                                        {showPayroll && (
                                            <>
                                                <div className="flex items-center justify-between mb-4">
                                                    <MonthPicker
                                                        value={selectedMonth}
                                                        onValueChange={handleMonthChange}
                                                        placeholder="Select month"
                                                        className="w-46 min-w-0 px-2 py-1 text-sm"
                                                        availableMonths={availableMonths}
                                                    />
                                                </div>
                                                {/* Payroll summary and breakdown (copied from original) */}
                                                {/* ...existing payroll summary and breakdown code here... */}
                                            </>
                                        )}
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
    )
}
