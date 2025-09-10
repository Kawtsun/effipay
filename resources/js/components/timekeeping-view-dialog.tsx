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
import React from "react";

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
                                        <h4 className="font-semibold text-lg mb-6">Time Keeping Data</h4>
                                        <div className="grid grid-cols-2 gap-16 items-start mb-10">
                                            <div>
                                                <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Attendance & Overtime</h5>
                                                <div className="space-y-3 text-sm">
                                                    <Info label="Tardiness" value={employee.late_count ?? 0} />
                                                    <Info label="Undertime" value={employee.early_count ?? 0} />
                                                    <Info label="Overtime Count (Weekdays)" value={employee.overtime_count_weekdays ?? 0} />
                                                    <Info label="Overtime Count (Weekends)" value={employee.overtime_count_weekends ?? 0} />
                                                    <Info label="Absences" value={employee.absences ?? 0} />
                                                </div>
                                            </div>
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
