import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { calculateGrossPay } from "@/utils/salaryFormulas";
import { toast } from "sonner";
import { Employees } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { RolesBadges, getCollegeProgramLabel } from "./roles-badges";
import React, { useState, useEffect, useRef } from "react";
import { useEmployeePayroll } from "@/hooks/useEmployeePayroll";
import { MonthRangePicker } from "./ui/month-range-picker";
import { Skeleton } from "./ui/skeleton";
import { Fingerprint } from "lucide-react";

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

function formatNumberWithCommas(num: number | string): string {
    if (num === null || num === undefined) return '-';
    const n = typeof num === 'string' ? Number(num) : num;
    if (isNaN(n)) return '-';
    return n.toLocaleString('en-US');
}

function formatNumberWithCommasAndFixed(num: number | string, decimals = 2): string {
    if (num === null || num === undefined) return '-';
    const n = typeof num === 'string' ? Number(num) : num;
    if (isNaN(n)) return '-';
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
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

export default function TimeKeepingViewDialog({ employee, onClose, activeRoles }: Props) {
    // Month selector state
    const [selectedMonth, setSelectedMonth] = useState("");
    const [pendingMonth, setPendingMonth] = useState("");
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [loadingPayroll, setLoadingPayroll] = useState(false);
    const [minLoading, setMinLoading] = useState(false);
    const minLoadingTimeout = useRef<NodeJS.Timeout | null>(null);
    const { summary } = useEmployeePayroll(employee?.id ?? null, pendingMonth);
    const hasMonthData = !!summary && (
        summary.tardiness !== 0 ||
        summary.undertime !== 0 ||
        summary.overtime !== 0 ||
        summary.absences !== 0 ||
        summary.base_salary !== 0 ||
        summary.rate_per_day !== 0 ||
        summary.rate_per_hour !== 0 ||
        summary.overtime_pay_total !== 0
    );

    // Show toast if no data, but only once per employee+month
    const lastToastRef = useRef<{ emp: number|null, month: string } | null>(null);
    useEffect(() => {
        if (!loadingPayroll && !minLoading && employee && selectedMonth) {
            const empId = employee.id;
            if (!hasMonthData) {
                if (
                    !lastToastRef.current ||
                    lastToastRef.current.emp !== empId ||
                    lastToastRef.current.month !== selectedMonth
                ) {
                    toast.error("No timekeeping data found for this month.");
                    lastToastRef.current = { emp: empId, month: selectedMonth };
                }
            } else {
                // Reset lastToastRef if data is present
                lastToastRef.current = null;
            }
        }
    }, [loadingPayroll, minLoading, employee, selectedMonth, hasMonthData]);

    // Fetch merged months from backend (payroll + timekeeping)
    const fetchAvailableMonths = React.useCallback(async () => {
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
    }, [selectedMonth]);

    useEffect(() => {
        if (employee) {
            fetchAvailableMonths();
        }
    }, [employee, fetchAvailableMonths]);

    useEffect(() => {
        // summary is now handled by useEmployeePayroll
    }, [employee, pendingMonth]);

    useEffect(() => {
        if (employee) {
            setLoadingPayroll(true);
            setMinLoading(true);
            if (minLoadingTimeout.current) clearTimeout(minLoadingTimeout.current);
            minLoadingTimeout.current = setTimeout(() => setMinLoading(false), 400);
            // Simulate loading for payroll summary (useEmployeePayroll is async)
            setTimeout(() => setLoadingPayroll(false), 100);
        } else {
            setLoadingPayroll(false);
            setMinLoading(false);
        }
    }, [employee, selectedMonth]);

    // Month change handler with skeleton loading
    const handleMonthChange = (month: string) => {
        if (month !== selectedMonth) {
            setSelectedMonth(month);
            setPendingMonth(month);
        }
    };

    // fetchMonthlySummary is now handled by useEmployeePayroll

    // DEBUG: Show actual values for troubleshooting
    console.log('DEBUG employee.schedule:', {
        work_start_time: employee?.work_start_time,
        work_end_time: employee?.work_end_time,
        work_hours_per_day: employee?.work_hours_per_day
    });
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
                        <DialogContent className="max-w-6xl w-full px-8 py-4 sm:px-12 sm:py-6 z-[100] max-h-[90vh] flex flex-col">
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle className="text-2xl font-bold mb-2">Employee Attendance Details</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto pr-2 min-h-[700px]">
                                <div className="space-y-12 text-base">
                                    <div className="border-b pb-6 mb-2">
                                        <h3 className="text-2xl font-extrabold mb-1">
                                            #{employee.id} - {`${employee.last_name}, ${employee.first_name} ${employee.middle_name}`.toLocaleUpperCase('en-US')}
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-10 items-start mb-6">
                                        <div>
                                            <h4 className="font-semibold text-base mb-4 border-b pb-2">General Information</h4>
                                            <div className="space-y-2 text-sm">
                                                <Info label="Status" value={employee.employee_status} />
                                                <Info label="Type" value={employee.employee_type} />
                                                <Info label="Schedule" value={
                                                    employee.work_start_time && employee.work_end_time && employee.work_hours_per_day
                                                        ? `${formatTime12Hour(employee.work_start_time)} - ${formatTime12Hour(employee.work_end_time)} (${employee.work_hours_per_day} hours)`
                                                        : '-'
                                                } />
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
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="font-semibold text-lg">Time Keeping Data</h4>
                                            <MonthRangePicker
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
                                                    {/* Dynamically render skeleton cards for future-proofing */}
                                                    <div className="grid grid-cols-4 gap-6 mb-6 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
                                                        {[
                                                            { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', labelW: 'w-24' },
                                                            { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', labelW: 'w-36' },
                                                            { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', labelW: 'w-20' },
                                                            { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', labelW: 'w-28', extra: true },
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
                                                    <div className="grid grid-cols-2 gap-10 max-[900px]:grid-cols-1">
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
                                                                <div>
                                                                    <Skeleton className="h-3 w-26 mb-1" />
                                                                    <Skeleton className="h-4 w-36" />
                                                                </div>
                                                                <div>
                                                                    <Skeleton className="h-3 w-40 mb-1" />
                                                                    <Skeleton className="h-4 w-40" />
                                                                </div>
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
                                                    {/* Dynamically render timekeeping cards for future-proofing */}
                                                    <div className="grid grid-cols-4 gap-6 mb-6 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
                                                        {[
                                                            {
                                                                label: 'Tardiness',
                                                                value: !hasMonthData ? '-' : `${Number(summary.tardiness).toFixed(2)} hr(s)`,
                                                                bg: 'bg-orange-50 dark:bg-orange-900/20',
                                                                border: 'border-orange-200 dark:border-orange-800',
                                                                text: 'text-orange-600',
                                                                valueText: 'text-orange-700 dark:text-orange-300',
                                                            },
                                                            {
                                                                label: 'Undertime',
                                                                value: !hasMonthData ? '-' : `${Number(summary.undertime).toFixed(2)} hr(s)`,
                                                                bg: 'bg-red-50 dark:bg-red-900/20',
                                                                border: 'border-red-200 dark:border-red-800',
                                                                text: 'text-red-600',
                                                                valueText: 'text-red-700 dark:text-red-300',
                                                            },
                                                            {
                                                                label: 'Overtime',
                                                                value: !hasMonthData ? '-' : `${Number(summary.overtime).toFixed(2)} hr(s)`,
                                                                bg: 'bg-blue-50 dark:bg-blue-900/20',
                                                                border: 'border-blue-200 dark:border-blue-800',
                                                                text: 'text-blue-600',
                                                                valueText: 'text-blue-700 dark:text-blue-300',
                                                                extra: hasMonthData
                                                            },
                                                            {
                                                                label: 'Absences',
                                                                value: !hasMonthData ? '-' : `${Number(summary.absences).toFixed(2)} hr(s)`,
                                                                bg: 'bg-gray-50 dark:bg-gray-800',
                                                                border: 'border-gray-200 dark:border-gray-700',
                                                                text: 'text-gray-600',
                                                                valueText: 'text-gray-900 dark:text-gray-100',
                                                            },
                                                        ].map((card, idx) => (
                                                            <motion.div
                                                                key={card.label}
                                                                className={`${card.bg} p-5 rounded-2xl border ${card.border} flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm min-h-[120px] h-full`}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                whileHover={{ scale: 1.02 }}
                                                                transition={{ duration: 0.3, delay: 0.1 * (idx + 1) }}
                                                            >
                                                                <div className={`text-xs ${card.text} font-medium mb-2`}>{card.label}</div>
                                                                <div className={`text-xl font-bold ${card.valueText} break-words whitespace-nowrap`}>{card.value}</div>
                                                                {card.label === 'Overtime' && card.extra && (
                                                                    <div className="text-xs text-blue-400 mt-1">
                                                                        {hasMonthData
                                                                            ? `Weekdays: ${Number(summary.overtime_count_weekdays ?? 0).toFixed(2)} hr(s), Weekends: ${Number(summary.overtime_count_weekends ?? 0).toFixed(2)} hr(s)`
                                                                            : ''}
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-10 max-[900px]:grid-cols-1">
                                                        <div>
                                                            <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Pay Summary</h5>
                                                            <div className="space-y-3 text-sm">
                                                                <Info label="Monthly Salary" value={`₱${formatNumberWithCommasAndFixed(summary?.base_salary ?? 0)}`} />
                                                                <Info label="Total Overtime Pay" value={`₱${formatNumberWithCommasAndFixed(summary?.overtime_pay_total ?? 0)}`} />
                                                                <Info label="Gross Pay" value={`₱${formatNumberWithCommasAndFixed(summary?.gross_pay ?? 0)}`} />
                                                            </div>
                                                            <div className="space-y-3 text-sm mt-4">
                                                                <Info label="Rate per Day" value={`₱${formatNumberWithCommasAndFixed(summary?.rate_per_day ?? 0)}`} />
                                                                <Info label="Rate per Hour" value={`₱${formatNumberWithCommasAndFixed(summary?.rate_per_hour ?? 0)}`} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
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
