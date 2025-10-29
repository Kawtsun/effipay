import DialogScrollArea from './dialog-scroll-area';
import { formatFullName } from '../utils/formatFullName';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Employees } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import React, { useState, useEffect, useRef } from "react";
import { useEmployeePayroll } from "@/hooks/useEmployeePayroll";
import { MonthRangePicker } from "./ui/month-range-picker";
import { Skeleton } from "./ui/skeleton";
import { RolesBadges } from "./roles-badges"; // Ensure RolesBadges is imported
import { EmployeeScheduleBadges } from './employee-schedule-badges';

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
    // Payroll summary for pay details (keep for summary cards)
    const { summary } = useEmployeePayroll(employee?.id ?? null, pendingMonth, employee);

    // Calculate gross pay including overtime (for display)
    function getOvertimePay() {
        if (!summary) return 0;
        const isCollegeInstructor = employee && typeof employee.roles === 'string' && employee.roles.toLowerCase().includes('college instructor');
        const ratePerHour = isCollegeInstructor ? Number(summary.college_rate ?? 0) : Number(summary.rate_per_hour ?? 0);
        const weekdayOvertime = Number(summary.overtime_count_weekdays ?? 0);
        const weekendOvertime = Number(summary.overtime_count_weekends ?? 0);
        const weekdayPay = ratePerHour * 0.25 * weekdayOvertime;
        const weekendPay = ratePerHour * 0.30 * weekendOvertime;
        return weekdayPay + weekendPay;
    }

    function getGrossPay() {
        if (!summary) return 0;
        const rolesStr = (employee?.roles || '').toLowerCase();
        const roleTokens = rolesStr.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
        const hasCollege = rolesStr.includes('college instructor');
        const isCollegeOnly = hasCollege && (roleTokens.length > 0 ? roleTokens.every(t => t.includes('college instructor')) : true);
        const isCollegeMulti = hasCollege && !isCollegeOnly;

        const baseSalary = Number(summary.base_salary ?? 0);
        const nonCollegeRatePerHour = Number(summary.rate_per_hour ?? 0);
        const collegeRatePerHour = Number(summary.college_rate ?? 0);

        // Prefer locally computed metrics when available to reflect UI logic
        const tardiness = Number((computed?.tardiness ?? summary.tardiness) ?? 0);
        const undertime = Number((computed?.undertime ?? summary.undertime) ?? 0);
        const absences = Number((computed?.absences ?? summary.absences) ?? 0);
        const totalHours = Number((computed?.total_hours ?? summary.total_hours) ?? 0);

        const overtimePay = getOvertimePay();

        if (isCollegeOnly) {
            // College-only: use college rate and hours for all
            return (
                (collegeRatePerHour * totalHours)
                + overtimePay
                - (collegeRatePerHour * tardiness)
                - (collegeRatePerHour * undertime)
                - (collegeRatePerHour * absences)
            );
        }

        if (isCollegeMulti) {
            // Multi-role with College Instructor:
            // Gross = Base Salary + College/GSP + Overtime - (non-college rate * (tardiness + undertime + absences))
            // Note: computed metrics exclude college-role timekeeping from T/U/A in the section below.
            const collegeGsp = collegeRatePerHour > 0 && totalHours > 0
                ? (collegeRatePerHour * totalHours)
                : 0;
            const deductions = (nonCollegeRatePerHour * tardiness)
                + (nonCollegeRatePerHour * undertime)
                + (nonCollegeRatePerHour * absences);
            return baseSalary + collegeGsp + overtimePay - deductions;
        }

        // Non-college
        return (
            baseSalary
            + overtimePay
            - (nonCollegeRatePerHour * tardiness)
            - (nonCollegeRatePerHour * undertime)
            - (nonCollegeRatePerHour * absences)
        );
    }
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [loadingPayroll, setLoadingPayroll] = useState(false);
    const [minLoading, setMinLoading] = useState(false);
    const minLoadingTimeout = useRef<NodeJS.Timeout | null>(null);
    // Remove summary/hasMonthData logic for toast, use BTRDialog approach
    // Use a more specific type for records
    // Use a more specific type for records if possible. Assuming records are objects with string keys and values.
    const [records, setRecords] = useState<Array<Record<string, unknown>>>([]);
    const recordsMinLoadingTimeout = useRef<NodeJS.Timeout | null>(null);
    // Observances map keyed by YYYY-MM-DD to apply event formulas in computations
    const [observanceMap, setObservanceMap] = useState<Record<string, { type?: string; start_time?: string }>>({});
    useEffect(() => {
        if (!employee || !selectedMonth) return;
        if (recordsMinLoadingTimeout.current) clearTimeout(recordsMinLoadingTimeout.current);
        recordsMinLoadingTimeout.current = setTimeout(() => { }, 400);
        fetch(`/api/timekeeping/records?employee_id=${employee.id}&month=${selectedMonth}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data.records)) {
                    setRecords(data.records);
                    if (data.records.length === 0) {
                        toast.error("No timekeeping data found for this month.");
                    }
                } else {
                    setRecords([]);
                    toast.error("No timekeeping data found for this month.");
                }
            })
            .finally(() => { });
    }, [employee, selectedMonth]);
    // Fetch observances for the current month and store minimal data in a map
    useEffect(() => {
        if (!selectedMonth) return;
        (async () => {
            try {
                const res = await fetch('/observances');
                const payload = await res.json();
                const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.observances) ? payload.observances : []);
                const map: Record<string, { type?: string; start_time?: string }> = {};
                for (const o of arr) {
                    const d = (o?.date || '').slice(0, 10);
                    if (!d || d.slice(0, 7) !== selectedMonth) continue;
                    map[d] = { type: o?.type || o?.label, start_time: o?.start_time };
                }
                setObservanceMap(map);
            } catch (e) {
                console.error('Failed to fetch observances', e);
                setObservanceMap({});
            }
        })();
    }, [selectedMonth]);
    // Use records.length === 0 to determine if there is data, matching BTRDialog

    // Show toast if no data, but only once per employee+month, and reset properly when data is present
    // Remove lastToastRef and use BTRDialog's approach

    // Fetch timekeeping-only months from backend (distinct months found in timekeeping records)
    const fetchAvailableMonths = React.useCallback(async () => {
        try {
            const response = await fetch('/timekeeping/available-months');
            const result = await response.json();
            if (result.success) {
                setAvailableMonths(result.months);
                if (result.months.length > 0 && !selectedMonth) {
                    setSelectedMonth(result.months[0]);
                    setPendingMonth(result.months[0]);
                } else if (result.months.length === 0) {
                    toast.error('No available months to display.');
                }
            }
        } catch (error) {
            console.error('Error fetching available months:', error);
        }
    }, [selectedMonth, setPendingMonth, setSelectedMonth]);

    useEffect(() => {
        if (employee) {
            fetchAvailableMonths();
        }
    }, [employee, fetchAvailableMonths]);

    useEffect(() => {
        // summary is now handled by useEmployeePayroll
    }, [employee, pendingMonth]);

    // Keep payroll loading for summary, but not for toast
    useEffect(() => {
        if (employee) {
            setLoadingPayroll(true);
            setMinLoading(true);
            if (minLoadingTimeout.current) clearTimeout(minLoadingTimeout.current);
            minLoadingTimeout.current = setTimeout(() => setMinLoading(false), 400);
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

    // ---------- Compute metrics from BTR + schedule ----------
    const computed = React.useMemo(() => {
        if (!employee || !selectedMonth) return null;
    const workDays = Array.isArray((employee as any).work_days) ? (employee as any).work_days : [];
    const rolesStr = String((employee as any).roles || '').toLowerCase();
    const roleTokens = rolesStr.split(/[\,\n]+/).map((s: string) => s.trim()).filter(Boolean);
    const hasCollege = rolesStr.includes('college instructor');
    const isCollegeOnly = hasCollege && (roleTokens.length > 0 ? roleTokens.every((t: string) => t.includes('college instructor')) : true);
    const isCollegeMulti = hasCollege && !isCollegeOnly;
        // Build schedule map by weekday code (mon..sun)
        const schedByCode: Record<string, { start: number; end: number; durationMin: number }> = {};
        const hmToMin = (t?: string) => {
            if (!t) return NaN;
            const parts = t.split(':');
            if (parts.length < 2) return NaN;
            const h = Number(parts[0]);
            const m = Number(parts[1]);
            if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
            return h * 60 + m;
        };
        const diffMin = (startMin: number, endMin: number) => {
            let d = endMin - startMin;
            if (d <= 0) d += 24 * 60; // overnight handling
            return d;
        };
        const codeFromDate = (d: Date) => {
            const idx = d.getDay(); // 0..6 Sun..Sat
            return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][idx];
        };
        const parseClock = (raw?: any): number => {
            if (!raw || typeof raw !== 'string') return NaN;
            let s = raw.trim();
            // Accept 'HH:mm', 'HH:mm:ss', 'h:mm AM/PM'
            const ampmMatch = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)$/i);
            if (ampmMatch) {
                let h = Number(ampmMatch[1]);
                const m = Number(ampmMatch[2]);
                const ap = ampmMatch[3].toUpperCase();
                if (ap === 'PM' && h < 12) h += 12;
                if (ap === 'AM' && h === 12) h = 0;
                return h * 60 + m;
            }
            const hmMatch = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
            if (hmMatch) {
                const h = Number(hmMatch[1]);
                const m = Number(hmMatch[2]);
                return h * 60 + m;
            }
            return NaN;
        };

        for (const wd of workDays) {
            const start = hmToMin((wd as any).work_start_time);
            const end = hmToMin((wd as any).work_end_time);
            if (Number.isNaN(start) || Number.isNaN(end)) continue;
            const raw = diffMin(start, end);
            const durationMin = Math.max(0, raw - 60); // minus 1 hour break to match schedule display
            const roleStr = String((wd as any).role ?? '').toLowerCase();
            const fromCollegeRole = roleStr.includes('college instructor');
            // Exclude college-instructor schedules from T/U/A for multi-role employees
            if (isCollegeMulti && fromCollegeRole) continue;
            schedByCode[(wd as any).day] = { start, end, durationMin };
        }

        // Map records by date
        const map: Record<string, any> = {};
        for (const r of records) {
            const rd = (r as any).date;
            if (typeof rd === 'string') map[rd] = r;
        }

        const [yStr, mStr] = selectedMonth.split('-');
        const y = Number(yStr), m = Number(mStr);
        if (!y || !m) return null;
        const daysInMonth = new Date(y, m, 0).getDate();

        let tardMin = 0;
        let underMin = 0;
        let absentMin = 0;
        let otMin = 0;
        let otWeekdayMin = 0;
        let otWeekendMin = 0;
        let totalWorkedMin = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${yStr}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const d = new Date(`${dateStr}T00:00:00`);
            const code = codeFromDate(d);
            const sched = schedByCode[code];
            const rec = map[dateStr];
            const timeIn = parseClock(rec?.clock_in ?? rec?.time_in);
            const timeOut = parseClock(rec?.clock_out ?? rec?.time_out);

            const hasBoth = !Number.isNaN(timeIn) && !Number.isNaN(timeOut);
            if (sched) {
                // Scheduled day with potential observance adjustments
                const workedRaw = hasBoth ? diffMin(timeIn, timeOut) : 0;
                const obs = observanceMap[dateStr];
                const obsType = obs?.type?.toLowerCase?.() || '';

                // WHOLE-DAY: No absences/tardy/undertime; any work counts as overtime (weekend bucket)
                if (obsType.includes('whole')) {
                    const workedMinusBreak = hasBoth ? Math.max(0, workedRaw - 60) : 0;
                    totalWorkedMin += workedMinusBreak;
                    if (hasBoth) {
                        otMin += workedMinusBreak;
                        otWeekendMin += workedMinusBreak;
                    }
                    continue;
                }

                // HALF-DAY: suspension starts at provided time; expectation ends there; overtime after that
                if (obsType.includes('half')) {
                    const suspMinVal = hmToMin(obs?.start_time);
                    const suspMin = Number.isNaN(suspMinVal) ? 12 * 60 : suspMinVal; // default 12:00
                    const expectedEnd = Math.max(sched.start, Math.min(suspMin, sched.end));
                    const expectedDuration = Math.max(0, expectedEnd - sched.start);

                    if (!hasBoth) {
                        absentMin += expectedDuration;
                        continue;
                    }

                    // Morning work (no lunch break deduction for half-day expectation)
                    totalWorkedMin += workedRaw;
                    const tard = Math.max(0, timeIn - sched.start);
                    const under = Math.max(0, expectedEnd - timeOut);
                    const over = Math.max(0, timeOut - Math.max(timeIn, expectedEnd));

                    tardMin += tard;
                    underMin += under;
                    otMin += over;
                    otWeekdayMin += over;
                    continue;
                }

                // Default or RAINY-DAY behavior
                const workedMinusBreak = hasBoth ? Math.max(0, workedRaw - 60) : 0;
                totalWorkedMin += workedMinusBreak;

                if (!hasBoth) {
                    absentMin += sched.durationMin;
                    continue;
                }

                // Tardiness: rainy-day 1-hour grace; if beyond grace, base from original start
                let tard: number;
                if (obsType.includes('rainy')) {
                    const graceEnd = sched.start + 60;
                    tard = timeIn <= graceEnd ? 0 : Math.max(0, timeIn - sched.start);
                } else {
                    tard = Math.max(0, timeIn - sched.start);
                }

                const under = Math.max(0, sched.end - timeOut);
                const over = Math.max(0, workedMinusBreak - sched.durationMin);

                tardMin += tard;
                underMin += under;
                otMin += over;
                otWeekdayMin += over;
            } else {
                // Not scheduled day (weekend or off)
                if (hasBoth) {
                    const workedRaw = diffMin(timeIn, timeOut);
                    const workedMinusBreak = Math.max(0, workedRaw - 60);
                    totalWorkedMin += workedMinusBreak;
                    otMin += workedMinusBreak;
                    otWeekendMin += workedMinusBreak;
                }
            }
        }

        const toH = (min: number) => Number((min / 60).toFixed(2));
        return {
            tardiness: toH(tardMin),
            undertime: toH(underMin),
            overtime: toH(otMin),
            absences: toH(absentMin),
            overtime_count_weekdays: toH(otWeekdayMin),
            overtime_count_weekends: toH(otWeekendMin),
            total_hours: toH(totalWorkedMin),
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employee, records, selectedMonth, observanceMap]);
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
                                <DialogTitle className="text-2xl font-bold mb-2">Employee Attendance Details</DialogTitle>
                            </DialogHeader>
                            <DialogScrollArea>
                                <div className="space-y-12 text-base">
                                    <div className="border-b pb-6 mb-2">
                                        <h3 className="text-2xl font-extrabold mb-1">
                                            #{employee.id} - {formatFullName(employee.last_name, employee.first_name, employee.middle_name)}
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-10 items-start mb-6">
                                        <div>
                                            <h4 className="font-semibold text-base mb-4 border-b pb-2">General Information</h4>
                                            <div className="space-y-2 text-sm">
                                                <Info label="Status" value={employee.employee_status} />
                                                <Info label="Type" value={employee.employee_type} />
                                                <div className="mb-2">
                                                    <span className="text-xs text-muted-foreground">Schedule</span>
                                                    <EmployeeScheduleBadges workDays={employee.work_days || []} />
                                                </div>
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
                                                className="w-56 min-w-0 px-2 py-1 text-sm"
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
                                                            {/* College Instructor: custom skeleton fields */}
                                                            {employee && typeof employee.roles === 'string' && employee.roles.toLowerCase().includes('college instructor') ? (
                                                                <div className="space-y-3 text-sm">
                                                                    <div>
                                                                        <Skeleton className="h-3 w-32 mb-1" /> {/* Rate Per Hour */}
                                                                        <Skeleton className="h-4 w-40" />
                                                                    </div>
                                                                    <div>
                                                                        <Skeleton className="h-3 w-32 mb-1" /> {/* Total Hours */}
                                                                        <Skeleton className="h-4 w-36" />
                                                                    </div>
                                                                    <div>
                                                                        <Skeleton className="h-3 w-32 mb-1" /> {/* Gross Pay */}
                                                                        <Skeleton className="h-4 w-40" />
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="space-y-3 text-sm">
                                                                        <div>
                                                                            <Skeleton className="h-3 w-32 mb-1" /> {/* Monthly Salary */}
                                                                            <Skeleton className="h-4 w-40" />
                                                                        </div>
                                                                        <div>
                                                                            <Skeleton className="h-3 w-32 mb-1" /> {/* Gross Pay */}
                                                                            <Skeleton className="h-4 w-40" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-3 text-sm mt-4">
                                                                        <div>
                                                                            <Skeleton className="h-3 w-32 mb-1" /> {/* Rate per Day */}
                                                                            <Skeleton className="h-4 w-36" />
                                                                        </div>
                                                                        <div>
                                                                            <Skeleton className="h-3 w-32 mb-1" /> {/* Rate per Hour */}
                                                                            <Skeleton className="h-4 w-36" />
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
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
                                                    {/* Dynamically render timekeeping cards based on computed metrics */}
                                                    <div className="grid grid-cols-4 gap-6 mb-6 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
                                                        {[
                                                            {
                                                                label: 'Tardiness',
                                                                value: records.length === 0 ? '-' : `${Number((computed?.tardiness ?? summary?.tardiness) ?? 0).toFixed(2)} hr(s)`,
                                                                bg: 'bg-orange-50 dark:bg-orange-900/20',
                                                                border: 'border-orange-200 dark:border-orange-800',
                                                                text: 'text-orange-600',
                                                                valueText: 'text-orange-700 dark:text-orange-300',
                                                            },
                                                            {
                                                                label: 'Undertime',
                                                                value: records.length === 0 ? '-' : `${Number((computed?.undertime ?? summary?.undertime) ?? 0).toFixed(2)} hr(s)`,
                                                                bg: 'bg-red-50 dark:bg-red-900/20',
                                                                border: 'border-red-200 dark:border-red-800',
                                                                text: 'text-red-600',
                                                                valueText: 'text-red-700 dark:text-red-300',
                                                            },
                                                            {
                                                                label: 'Overtime',
                                                                value: records.length === 0 ? '-' : `${Number((computed?.overtime ?? summary?.overtime) ?? 0).toFixed(2)} hr(s)`,
                                                                bg: 'bg-blue-50 dark:bg-blue-900/20',
                                                                border: 'border-blue-200 dark:border-blue-800',
                                                                text: 'text-blue-600',
                                                                valueText: 'text-blue-700 dark:text-blue-300',
                                                                extra: records.length !== 0
                                                            },
                                                            {
                                                                label: 'Absences',
                                                                value: records.length === 0 ? '-' : `${Number((computed?.absences ?? summary?.absences) ?? 0).toFixed(2)} hr(s)`,
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
                                                                        {records.length !== 0
                                                                            ? `Weekdays: ${Number((computed?.overtime_count_weekdays ?? summary?.overtime_count_weekdays) ?? 0).toFixed(2)} hr(s), Weekends: ${Number((computed?.overtime_count_weekends ?? summary?.overtime_count_weekends) ?? 0).toFixed(2)} hr(s)`
                                                                            : ''}
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-10 max-[900px]:grid-cols-1">
                                                        <div>
                                                            <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Pay Summary</h5>
                                                            {/* College Instructor: custom summary order and fields */}
                                                            {employee && typeof employee.roles === 'string' && employee.roles.toLowerCase().includes('college instructor') ? (
                                                                <div className="space-y-3 text-sm">
                                                                    <Info label="Rate Per Hour" value={records.length === 0 ? '-' : `₱${formatNumberWithCommasAndFixed(summary?.college_rate ?? 0)}`} />
                                                                    <Info label="Total Hours" value={records.length === 0 ? '-' : `${Number((computed?.total_hours ?? summary?.total_hours) ?? 0).toFixed(2)} hr(s)`} />
                                                                    <Info label="Gross Pay" value={records.length === 0 ? '-' : `₱${formatNumberWithCommasAndFixed(getGrossPay())}`} />
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="space-y-3 text-sm">
                                                                        <Info label="Monthly Salary" value={records.length === 0 ? '-' : `₱${formatNumberWithCommasAndFixed(summary?.base_salary ?? 0)}`} />
                                                                        <Info label="Gross Pay" value={records.length === 0 ? '-' : `₱${formatNumberWithCommasAndFixed(getGrossPay())}`} />
                                                                    </div>
                                                                    <div className="space-y-3 text-sm mt-4">
                                                                        <Info label="Rate per Day" value={records.length === 0 ? '-' : `₱${formatNumberWithCommasAndFixed(summary?.rate_per_day ?? 0)}`} />
                                                                        <Info label="Rate per Hour" value={records.length === 0 ? '-' : `₱${formatNumberWithCommasAndFixed(summary?.rate_per_hour ?? 0)}`} />
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
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