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
import { RolesBadges, getCollegeProgramLabel } from "./roles-badges";
import React, { useState, useEffect } from "react";
import { MonthPicker } from "./ui/month-picker";

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
// Display schedule based on employee data, using 12-hour format
function formatTimeMilitary(time?: string): string {
    if (!time) return '-';
    const parts = time.split(':');
    if (parts.length < 2) return '-';
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return '-';
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
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

    useEffect(() => {
        if (employee) {
            fetchAvailableMonths();
        }
    }, [employee]);

    const fetchAvailableMonths = async () => {
        if (!employee) return;
        try {
            const response = await fetch(route('payroll.employee.months', { employee_id: employee.id }));
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

    const handleMonthChange = (month: string) => {
        if (month !== selectedMonth) {
            setSelectedMonth(month);
            setPendingMonth(month);
        }
    };

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
                                <DialogTitle className="text-2xl font-bold mb-2">Employee Time Keeping Details</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto pr-2">
                                <div className="space-y-12 text-base">
                                    <div className="border-b pb-6 mb-2">
                                        <h3 className="text-2xl font-extrabold mb-1">#{employee.id} - {`${employee.last_name}, ${employee.first_name} ${employee.middle_name}`.toLocaleUpperCase('en-US')}</h3>
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
                                                {employee.college_program && (
                                                    <span className="ml-1 text-xs font-semibold text-white">[{employee.college_program}] {getCollegeProgramLabel(employee.college_program)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="font-semibold text-lg">Time Keeping Data</h4>
                                            <MonthPicker
                                                value={selectedMonth}
                                                onValueChange={handleMonthChange}
                                                placeholder="Select month"
                                                className="w-46 min-w-0 px-2 py-1 text-sm"
                                                availableMonths={availableMonths}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 gap-6 mb-6 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
                                            {/* Tardiness Card */}
                                            <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-2xl border border-orange-200 dark:border-orange-800 flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm h-full">
                                                <div className="text-xs text-orange-600 font-medium mb-2">Tardiness</div>
                                                <div className="text-xl font-bold text-orange-700 dark:text-orange-300 break-words whitespace-nowrap">{employee.late_count ?? 0} hr(s)</div>
                                            </div>
                                            {/* Undertime Card */}
                                            <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-200 dark:border-red-800 flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm h-full">
                                                <div className="text-xs text-red-600 font-medium mb-2">Undertime</div>
                                                <div className="text-xl font-bold text-red-700 dark:text-red-300 break-words whitespace-nowrap">{employee.early_count ?? 0} hr(s)</div>
                                            </div>
                                            {/* Overtime Card */}
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-200 dark:border-blue-800 flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm h-full">
                                                <div className="text-xs text-blue-600 font-medium mb-2">Overtime</div>
                                                <div className="text-xl font-bold text-blue-700 dark:text-blue-300 break-words whitespace-nowrap">{(employee.overtime_count_weekdays ?? 0) + (employee.overtime_count_weekends ?? 0)} hr(s)</div>
                                            </div>
                                            {/* Absences Card */}
                                            <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between min-w-[150px] w-[180px] shadow-sm h-full">
                                                <div className="text-xs text-gray-600 font-medium mb-2">Absences</div>
                                                <div className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words whitespace-nowrap">{employee.absences ?? 0}</div>
                                            </div>
                                        </div>
                                        {/* Computation details below cards, like report view dialog */}
                                        <div className="grid grid-cols-2 gap-10 max-[900px]:grid-cols-1">
                                            {/*   */}
                                            <div>
                                                 <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Pay Summary</h5>
                                                <div className="space-y-3 text-sm">
                                                    <Info label="Monthly Salary" value={`₱${formatNumberWithCommas(employee.base_salary ?? 0)}`} />
                                                    <Info label="Rate per Day" value={`₱${formatNumberWithCommasAndFixed(employee.rate_per_day ?? 0)}`} />
                                                    <Info label="Rate per Hour" value={`₱${formatNumberWithCommasAndFixed(employee.rate_per_hour ?? 0)}`} />
                                                    <Info label="Total Overtime Pay" value={`₱${formatNumberWithCommas(employee.overtime_pay_total ?? 0)}`} />
                                                </div>
                                            </div>
                                        </div>
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
