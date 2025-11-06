import { formatFullName } from '../utils/formatFullName';

// Utility to convert a string to Title Case (capitalize each word)
function toTitleCase(str: string) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEmployeePayroll } from '@/hooks/useEmployeePayroll';
import { toast } from 'sonner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PayslipTemplate from './print-templates/PayslipTemplate';
import BiometricTimeRecordTemplate from './print-templates/BiometricTimeRecordTemplate';
import { AnimatePresence, motion } from 'framer-motion';
import { Printer, FileText } from 'lucide-react';
import { MonthPicker } from './ui/month-picker';
import { Employees } from '@/types';
import { computeMonthlyMetrics } from '@/utils/computeMonthlyMetrics';
// import { computeRatePerHourForEmployee } from '@/components/table-dialogs/dialog-components/timekeeping-data-provider';

interface Payroll {
    payroll_date: string;
    base_salary?: number;
    college_rate?: number;
    honorarium?: number;
    tardiness?: number;
    undertime?: number;
    absences?: number;
    overtime_pay?: number;
    adjustments?: number;
    sss?: string;
    sss_salary_loan?: string;
    sss_calamity_loan?: string;
    pag_ibig?: string;
    pagibig_multi_loan?: string;
    pagibig_calamity_loan?: string;
    philhealth?: string;
    withholding_tax?: string;
    withholding_tax_base?: string;
    gross_pay?: number;
    total_deductions?: number;
    net_pay?: number;
    salary_loan?: string | number;
    peraa_con?: string | number;
    tuition?: string | number;
    china_bank?: string | number;
    tea?: string | number;
}

type PayrollWithExtras = Payroll & {
    college_rate?: number;
    college_total_hours?: number;
    total_hours?: number;
};

interface PayslipData {
    earnings: {
        monthlySalary?: string | number;
        numHours?: string | number;
        ratePerHour?: string | number;
        collegeRate?: string | number;
        collegeGSP?: string | number;
        honorarium?: string | number;
        tardiness?: number | string;
        tardinessAmount?: number | string;
        undertime?: number | string;
        undertimeAmount?: number | string;
        absences?: number | string;
        absencesAmount?: number | string;
        overtime_pay_total?: number | string;
        overtime_hours?: number | string;
        overtime?: number | string;
        overload?: number | string;
        adjustment?: number | string;
        double_pay?: number | string;
        gross_pay?: number | string;
        net_pay?: number | string;
        totalHours?: number;
        overtime_count_weekdays?: number | string;
        overtime_count_weekends?: number | string;
    };
    deductions: {
        sss?: string;
        philhealth?: string;
        pagibig?: string;
        withholdingTax?: string;
        sssSalaryLoan?: string;
        sssCalamityLoan?: string;
        pagibigMultiLoan?: string;
        pagibigCalamityLoan?: string;
        peraaCon?: string | number;
        tuition?: string | number;
        chinaBank?: string | number;
        tea?: string | number;
    };
    totalEarnings?: string;
    totalDeductions?: string;
    netPay?: string;
    netPay1530?: string;
}

interface BTRRecord {
    date: string;
    dayName: string;
    timeIn: string;
    timeOut: string;
}

interface PrintDialogProps {
  open: boolean;
  onClose: () => void;
  employee: Employees | null;
}

const AUTO_DOWNLOAD = false;
function sanitizeFile(str?: string) {
    return (str || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

const fetchPayrollData = async (employeeId: number, month: string): Promise<PayslipData | null> => {
    const response = await fetch(route('payroll.employee.monthly', {
        employee_id: employeeId,
        month,
    }));
    const result = await response.json();
    if (!result.success || !result.payrolls || result.payrolls.length === 0) {
        return null;
    }
    const payroll: PayrollWithExtras = result.payrolls.reduce((latest: PayrollWithExtras, curr: PayrollWithExtras) => {
        return new Date(curr.payroll_date) > new Date(latest.payroll_date) ? curr : latest;
    }, result.payrolls[0] as PayrollWithExtras);
    return {
        earnings: {
            monthlySalary: payroll.base_salary ?? 0,
            honorarium: payroll.honorarium ?? 0,
            tardiness: payroll.tardiness ?? 0,
            undertime: payroll.undertime ?? 0,
            absences: payroll.absences ?? 0,
            // Prefer overtime_pay_total if present; fallback to legacy field name
            overtime_pay_total: ((payroll as unknown as { overtime_pay_total?: number; overtime_pay?: number; }).overtime_pay_total
              ?? (payroll as unknown as { overtime_pay_total?: number; overtime_pay?: number; }).overtime_pay
              ?? 0),
            adjustment: payroll.adjustments ?? 0,
                        // Only show Rate Per Hour when the payroll record contains it; here we map to college_rate as requested
                                                ratePerHour: payroll.college_rate ?? undefined,
            collegeRate: payroll.college_rate ?? 0,
                        // Expose the exact hours used by payroll for College/GSP so UI can match payroll run precisely
                                    totalHours: typeof payroll?.college_total_hours === 'number'
                                        ? Number(payroll.college_total_hours)
                            : undefined,
        },
        deductions: {
            sss: payroll.sss ?? '',
            philhealth: payroll.philhealth ?? '',
            pagibig: payroll.pag_ibig ?? '',
            withholdingTax: payroll.withholding_tax ?? '',
            sssSalaryLoan: payroll.sss_salary_loan ?? '',
            sssCalamityLoan: payroll.sss_calamity_loan ?? '',
            pagibigMultiLoan: payroll.pagibig_multi_loan ?? '',
            pagibigCalamityLoan: payroll.pagibig_calamity_loan ?? '',
            peraaCon: payroll.peraa_con ?? '',
            tuition: payroll.tuition ?? '',
            chinaBank: payroll.china_bank ?? '',
            tea: payroll.tea ?? '',
        },
        totalEarnings: payroll.gross_pay?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        totalDeductions: payroll.total_deductions?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        netPay: payroll.net_pay?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        netPay1530: payroll.net_pay ? (Number(payroll.net_pay) / 2).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '',
    };
};

export default function PrintDialog({ open, onClose, employee }: PrintDialogProps) {
    // Hooks must be unconditionally called; guard usages instead of returning early
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const { summary: timekeepingSummary } = useEmployeePayroll(employee?.id ?? 0, selectedMonth);
    const [btrRecords, setBtrRecords] = useState<BTRRecord[]>([]);
    const [leaveDatesMap, setLeaveDatesMap] = useState<Record<string, string>>({});
    const [btrTotalHours, setBtrTotalHours] = useState<number>(0);
    const [btrMetrics, setBtrMetrics] = useState<{ tardiness: number; undertime: number; overtime: number; absences: number }>({ tardiness: 0, undertime: 0, overtime: 0, absences: 0 });
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [payrollData, setPayrollData] = useState<PayslipData | null>(null);
    const [showPDF, setShowPDF] = useState<false | 'payslip' | 'btr'>(false);
    const [loadingPayslip, setLoadingPayslip] = useState(false);
    const [loadingBTR, setLoadingBTR] = useState(false);

    const fetchAvailableMonths = React.useCallback(async () => {
        try {
            const response = await fetch('/payroll/all-available-months');
            const result = await response.json();
            if (result.success) {
                setAvailableMonths(result.months);
                if (result.months.length > 0 && !selectedMonth) {
                    setSelectedMonth(result.months[0]);
                } else if (result.months.length === 0) {
                    toast.error('No available months to display.');
                }
            }
        } catch (error) {
            console.error('Error fetching available months:', error);
        }
    }, [selectedMonth]);
    React.useEffect(() => {
        if (open) {
            fetchAvailableMonths();
        }
    }, [open, fetchAvailableMonths]);

    const handlePrintPayslip = async () => {
        if (!employee) {
            toast.error('No employee selected.');
            return;
        }
        setLoadingPayslip(true);
        setShowPDF(false);
        const data = await fetchPayrollData(employee.id, selectedMonth);
        if (!data) {
            toast.error('No payroll data found for the selected month.');
            setLoadingPayslip(false);
            return;
        }
    let payrollCollegeRate = 0;
    let payrollCollegeHours: number | undefined = undefined;
        try {
            const response = await fetch(route('payroll.employee.monthly', {
                employee_id: employee?.id,
                month: selectedMonth,
            }));
            const result = await response.json();
            if (result.success && result.payrolls && result.payrolls.length > 0) {
                type PayrollType = PayrollWithExtras;
                const payroll = result.payrolls.reduce((latest: PayrollType, curr: PayrollType) => {
                    return new Date(curr.payroll_date) > new Date(latest.payroll_date) ? curr : latest;
                }, result.payrolls[0] as PayrollType);
                payrollCollegeRate = payroll.college_rate ?? 0;
                if (typeof payroll?.college_total_hours === 'number') {
                    payrollCollegeHours = Number(payroll.college_total_hours);
                }
            }
        } catch { /* ignore error */ }
        // Fetch BTR records for the month
        const response = await fetch(`/api/timekeeping/records?employee_id=${employee?.id}&month=${selectedMonth}`);
        const result = await response.json();
    const btrRecords: BTRRecord[] = [];
    const btrRecordsForMetrics: Array<{ date: string; time_in?: string; time_out?: string }> = [];
        if (result.success && Array.isArray(result.records) && result.records.length > 0) {
            result.records.map((rec: Record<string, unknown>) => {
                const dateStr = String(rec.date || '');
                const dateObj = new Date(dateStr);
                const dayName = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : '';
                const inRaw = (rec.clock_in as string) || (rec.time_in as string) || '';
                const outRaw = (rec.clock_out as string) || (rec.time_out as string) || '';
                const timeInDisplay = inRaw && inRaw.trim() !== '' ? inRaw : '-';
                const timeOutDisplay = outRaw && outRaw.trim() !== '' ? outRaw : '-';
                // For computeMonthlyMetrics, use undefined when missing instead of '-'
                const timeInMetric = inRaw && inRaw.trim() !== '' ? inRaw : undefined;
                const timeOutMetric = outRaw && outRaw.trim() !== '' ? outRaw : undefined;
                btrRecordsForMetrics.push({ date: dateStr, time_in: timeInMetric, time_out: timeOutMetric });
                const displayRec = {
                    ...(rec as object),
                    date: dateStr,
                    dayName,
                    timeIn: timeInDisplay,
                    timeOut: timeOutDisplay,
                    time_in: timeInMetric,
                    time_out: timeOutMetric,
                } as unknown as BTRRecord;
                btrRecords.push(displayRec);
                return displayRec;
            });
        }
        // Fetch observances to ensure parity with Attendance/Report cards
        let observances: Array<Record<string, unknown>> = [];
        try {
            const obsRes = await fetch('/observances');
            const obsJson = await obsRes.json();
            observances = Array.isArray(obsJson) ? obsJson : (Array.isArray(obsJson?.observances) ? obsJson.observances : []);
        } catch { /* ignore */ }

        // Compute monthly metrics using the same logic as AttendanceCards
        const metrics = await computeMonthlyMetrics(
            employee,
            selectedMonth,
            btrRecordsForMetrics as unknown as Array<{ date: string; time_in?: string; time_out?: string }>,
            observances as unknown as Array<{ [k: string]: unknown }>
        );
    const rolesStr = (employee?.roles || '').toLowerCase();
    const tokens = rolesStr.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean);
        const hasCollege = rolesStr.includes('college instructor') || rolesStr.includes('college');
        const isCollegeOnly = hasCollege && (tokens.length > 0 ? tokens.every(t => t.includes('college')) : true);
    const mObj = metrics as unknown as { college_paid_hours?: number };
    const collegeHours = typeof mObj.college_paid_hours === 'number' ? Number(mObj.college_paid_hours) : NaN;

    const tardinessRaw = metrics.tardiness ?? 0;
        const undertimeRaw = metrics.undertime ?? 0;
    // Fallback to monthly summary absences if metrics unexpectedly yields 0/undefined
    const absencesFromSummary = Number(timekeepingSummary?.absences ?? 0) || 0;
    const absences = Number(metrics.absences ?? NaN);
    const effectiveAbsences = Number.isFinite(absences) && absences > 0 ? absences : absencesFromSummary;
        const overtimeRaw = metrics.overtime ?? 0;
        // Hours for College/GSP amount calculation: strictly college-paid hours;
        // Hours for display: if college-paid hours are missing, fall back to total_hours to avoid showing 0.00
        // Prefer the exact hours used by payroll for College/GSP when a college role exists
        const collegeHoursForGSP = hasCollege
            ? (typeof payrollCollegeHours === 'number' ? payrollCollegeHours : (Number.isFinite(collegeHours) ? collegeHours : 0))
            : 0;
        const hoursForDisplayRaw = hasCollege
            ? (typeof payrollCollegeHours === 'number'
                ? payrollCollegeHours
                : (Number.isFinite(collegeHours) ? collegeHours : (metrics.total_hours ?? 0)))
            : (metrics.total_hours ?? 0);
    const weekdayOT = Number(metrics.overtime_count_weekdays ?? 0) || 0;
    const weekendOT = Number(metrics.overtime_count_weekends ?? 0) || 0;
        const numHoursDisplay = Number.isFinite(hoursForDisplayRaw) ? hoursForDisplayRaw : 0;

        // Apply college-only rule: no tardiness, undertime, or overtime; only absences count
        const tardiness = isCollegeOnly ? 0 : tardinessRaw;
        const undertime = isCollegeOnly ? 0 : undertimeRaw;
    const overtime = isCollegeOnly ? 0 : overtimeRaw;

        const effectiveCollegeRate = (data.earnings.collegeRate ?? payrollCollegeRate ?? 0) as number;
        // Derive non-college hourly rate from base salary when needed (match backend formula)
        const rateFromSummary = Number((timekeepingSummary as unknown as { rate_per_hour?: number })?.rate_per_hour ?? NaN);
        const baseMonthly = Number(data.earnings?.monthlySalary ?? NaN);
        const whpd = Number(employee?.work_hours_per_day ?? NaN) || 8;
        const derivedHourly = Number.isFinite(rateFromSummary)
            ? Number(rateFromSummary)
            : (Number.isFinite(baseMonthly) && whpd > 0
                ? Number((((baseMonthly * 12) / 288) / whpd).toFixed(2))
                : 0);
        // Display: only show rate per hour for college (from payroll.college_rate); hide for non-college
        const ratePerHour = hasCollege ? (data.earnings?.ratePerHour ?? undefined) : undefined;
        const collegeGSP = hasCollege
            ? parseFloat(((Number.isFinite(collegeHoursForGSP) ? collegeHoursForGSP : 0) * Number(effectiveCollegeRate || 0)).toFixed(2))
            : (data.earnings?.collegeGSP ?? undefined);
        // Compute absences amount explicitly to ensure value is shown
        const absencesAmount = (() => {
            const rate = hasCollege ? Number(effectiveCollegeRate || 0) : Number(derivedHourly || 0);
            if (rate <= 0) return undefined;
            return parseFloat(((Number(effectiveAbsences) || 0) * rate).toFixed(2));
        })();
        const tardinessAmount = (() => {
            if (isCollegeOnly) return 0;
            const rate = Number(derivedHourly || 0);
            if (rate <= 0) return undefined;
            return parseFloat(((Number(tardiness) || 0) * rate).toFixed(2));
        })();
        const undertimeAmount = (() => {
            if (isCollegeOnly) return 0;
            const rate = Number(derivedHourly || 0);
            if (rate <= 0) return undefined;
            return parseFloat(((Number(undertime) || 0) * rate).toFixed(2));
        })();
                        // Build overtime pay total with robust preference: use server monthly-summary value when available (includes NSD)
                        const tkExt = (timekeepingSummary as unknown as { overtime_pay_total?: number }) || null;
                        const serverOTTotal = Number(tkExt?.overtime_pay_total ?? NaN);
                        const numericOvertimeFromPayroll = Number(data.earnings?.overtime_pay_total ?? NaN);
                        // Fallback formula for non-college only when no server/payroll value is available
                        const computedOTFallback = (!isCollegeOnly && Number(derivedHourly) > 0)
                            ? parseFloat((Number(derivedHourly) * ((0.25 * weekdayOT) + (0.30 * weekendOT))).toFixed(2))
                            : 0;
                        const overtime_pay_total = Number.isFinite(serverOTTotal)
                            ? Number(serverOTTotal.toFixed(2))
                            : (Number.isFinite(numericOvertimeFromPayroll) ? Number(numericOvertimeFromPayroll.toFixed(2)) : computedOTFallback);

                                                setPayrollData({
                ...data,
                earnings: {
                    ...data.earnings,
                                        // For College/GSP display, always show college-paid hours when a college role exists
                                        // Display hours: show college-paid hours if available; otherwise show total monthly hours
                                        numHours: Number(Number(numHoursDisplay).toFixed(2)),
                    // Display Rate Per Hour only for college roles (from payroll). Hide for non-college.
                    ratePerHour,
                    collegeRate: effectiveCollegeRate,
                    tardiness,
                    undertime,
                    absences: effectiveAbsences,
                    absencesAmount,
                    tardinessAmount,
                    undertimeAmount,
                                        overtime_pay_total,
                    overtime,
                    overtime_hours: overtime,
                    overtime_count_weekdays: isCollegeOnly ? 0 : weekdayOT,
                    overtime_count_weekends: isCollegeOnly ? 0 : weekendOT,
                                        gross_pay: (data.totalEarnings !== undefined && data.totalEarnings !== null && data.totalEarnings !== '') ? data.totalEarnings : (typeof data.earnings?.gross_pay !== 'undefined' ? data.earnings.gross_pay : undefined),
                    net_pay: (data.netPay !== undefined && data.netPay !== null && data.netPay !== '') ? data.netPay : (typeof data.earnings?.net_pay !== 'undefined' ? data.earnings.net_pay : undefined),
                    adjustment: data.earnings?.adjustment ?? undefined,
                    honorarium: data.earnings?.honorarium ?? 0,
                    collegeGSP,
                    overload: data.earnings?.overload ?? undefined,
                                                            // For "No. of hours" display, mirror the same logic with 2-decimal rounding
                                                            totalHours: Number(Number(numHoursDisplay).toFixed(2)),
                },
            });
        setTimeout(() => {
            setShowPDF('payslip');
            setLoadingPayslip(false);
        }, 100);

        // Fire-and-forget audit log for payslip print (with CSRF)
        try {
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            fetch('/api/audit/print-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'Accept': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    type: 'payslip',
                    employee_id: employee?.id,
                    month: selectedMonth,
                    details: { source: 'PrintDialog' },
                }),
            }).catch(() => {});
    } catch (e) { void e; }
    };

    const handlePrintBTR = async () => {
        if (!employee) {
            toast.error('No employee selected.');
            return;
        }
        setLoadingBTR(true);
        setShowPDF(false);
        try {
            const btrRes = await fetch(`/api/timekeeping/records?employee_id=${employee?.id}&month=${selectedMonth}`);
            const btrJson = await btrRes.json();
            let btrRecords: BTRRecord[] = [];
            if (btrJson.success && Array.isArray(btrJson.records)) {
                btrRecords = btrJson.records.map((rec: Record<string, unknown>) => {
                    const dateStr = String(rec.date || '');
                    const dateObj = new Date(dateStr);
                    const dayName = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : '';
                    const time_in = (rec.clock_in as string) || (rec.time_in as string) || '-';
                    const time_out = (rec.clock_out as string) || (rec.time_out as string) || '-';
                    return {
                        ...(rec as object),
                        date: dateStr,
                        dayName,
                        timeIn: time_in,
                        timeOut: time_out,
                        time_in,
                        time_out,
                    } as unknown as BTRRecord;
                });
            }
            
            const summaryRes = await fetch(`/api/timekeeping/monthlySummary?employee_id=${employee?.id}&month=${selectedMonth}`);
            const summaryJson = await summaryRes.json();
            if (summaryJson.success && summaryJson._debug) {
                setLeaveDatesMap(summaryJson._debug.leave_dates_map || {});
            } else {
                setLeaveDatesMap({});
            }
                        // Compute and store totals for BTR output using the SAME rules as AttendanceCards:
                        // - Include observances so hours match cards/reports exactly
                        // - For college-only employees, display college-paid hours and zero-out T/U/OT
                        // - Otherwise, use total_hours
                        let observancesBTR: Array<Record<string, unknown>> = [];
                        try {
                            const obsRes = await fetch('/observances');
                            const obsJson = await obsRes.json();
                            observancesBTR = Array.isArray(obsJson) ? obsJson : (Array.isArray(obsJson?.observances) ? obsJson.observances : []);
                        } catch { /* ignore */ }
                        const metricsBTR = await computeMonthlyMetrics(employee, selectedMonth, btrRecords, observancesBTR as unknown as Array<{ [k: string]: unknown }>);
                        const rolesStr = (employee?.roles || '').toLowerCase();
                                    const tokens = rolesStr
                                        .split(',')
                                        .flatMap((p) => p.split('\n'))
                                        .map((s) => s.trim())
                                        .filter(Boolean);
                        const hasCollege = rolesStr.includes('college instructor') || rolesStr.includes('college');
                        const isCollegeOnly = hasCollege && (tokens.length > 0 ? tokens.every((t) => t.includes('college')) : true);
                        // Prefer payroll-computed college hours for display to exactly match payroll run
                        let payrollCollegeHoursBTR: number | undefined = undefined;
                        try {
                            const resp = await fetch(route('payroll.employee.monthly', { employee_id: employee?.id, month: selectedMonth }));
                            const json = await resp.json();
                            if (json?.success && Array.isArray(json.payrolls) && json.payrolls.length > 0) {
                                const latest = (json.payrolls as Array<PayrollWithExtras>).reduce((a, b) => new Date(b.payroll_date) > new Date(a.payroll_date) ? b : a, json.payrolls[0] as PayrollWithExtras);
                                if (typeof latest?.college_total_hours === 'number') payrollCollegeHoursBTR = Number(latest.college_total_hours);
                            }
                        } catch { /* ignore */ }
                        const collegeHoursBTR = Number((metricsBTR as unknown as { college_paid_hours?: number })?.college_paid_hours ?? NaN);
                        const displayHours = isCollegeOnly
                            ? (typeof payrollCollegeHoursBTR === 'number'
                                ? payrollCollegeHoursBTR
                                : (Number.isFinite(collegeHoursBTR) ? collegeHoursBTR : (metricsBTR.total_hours ?? 0)))
                            : (metricsBTR.total_hours ?? 0);
                        // Round to 2 decimals before rendering to match Attendance/Report cards
                        setBtrTotalHours(Number(Number(displayHours).toFixed(2)));
                        setBtrMetrics({
                                tardiness: isCollegeOnly ? 0 : (metricsBTR.tardiness ?? 0),
                                undertime: isCollegeOnly ? 0 : (metricsBTR.undertime ?? 0),
                                overtime: isCollegeOnly ? 0 : (metricsBTR.overtime ?? 0),
                                absences: metricsBTR.absences ?? 0,
                        });

            const hasRealTime = btrRecords.some(r => (r.timeIn && r.timeIn !== '-') || (r.timeOut && r.timeOut !== '-'));
            const hasLeaves = summaryJson.success && summaryJson._debug && Object.keys(summaryJson._debug.leave_dates_map).length > 0;

            if (!hasRealTime && !hasLeaves) {
                toast.error('No biometric time records or leaves found for this month.');
                setLoadingBTR(false);
                return;
            }
            
            const allDates: string[] = [];
            if (selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)) {
                const [yearStr, monthStr] = selectedMonth.split('-');
                const year = parseInt(yearStr, 10);
                const month = parseInt(monthStr, 10);
                if (!isNaN(year) && !isNaN(month)) {
                    const daysInMonth = new Date(year, month, 0).getDate();
                    for (let d = 1; d <= daysInMonth; d++) {
                        const mm = String(month).padStart(2, '0');
                        const dd = String(d).padStart(2, '0');
                        allDates.push(`${year}-${mm}-${dd}`);
                    }
                }
            }
            const recordMap: Record<string, BTRRecord> = {};
            btrRecords.forEach((rec) => {
                recordMap[rec.date] = rec;
            });
            const records: BTRRecord[] = allDates.map(dateStr => {
                const rec = recordMap[dateStr];
                const dateObj = new Date(dateStr);
                const dayName = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : '';
                return {
                    date: dateStr,
                    dayName,
                    timeIn: rec ? rec.timeIn : '-',
                    timeOut: rec ? rec.timeOut : '-',
                };
            });
            setBtrRecords(records);
            setTimeout(() => {
                setShowPDF('btr');
                setLoadingBTR(false);
            }, 100);

            // Fire-and-forget audit log for BTR print (with CSRF)
            try {
                const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                fetch('/api/audit/print-log', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrf,
                        'Accept': 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        type: 'btr',
                        employee_id: employee?.id,
                        month: selectedMonth,
                        details: { source: 'PrintDialog' },
                    }),
                }).catch(() => {});
            } catch (e) { void e; }
        } catch {
            toast.error('Error generating BTR.');
            setLoadingBTR(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                        <DialogContent style={{ maxWidth: 320, padding: '1.5rem 1.5rem 1.2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <DialogHeader>
                                <DialogTitle>Print Employee Report</DialogTitle>
                            </DialogHeader>
                            <div className="mb-4 text-sm text-muted-foreground text-center w-full">
                                What would you like to print for <span className="font-semibold">{employee ? toTitleCase(formatFullName(employee.last_name, employee.first_name, employee.middle_name)) : ''}</span>?
                            </div>
                            <div className="mb-4 w-full flex flex-col items-center">
                                <label className="block text-xs font-semibold mb-1 text-center w-full">Select Month</label>
                                <MonthPicker
                                    value={selectedMonth}
                                    onValueChange={setSelectedMonth}
                                    availableMonths={availableMonths}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex flex-col gap-2 mb-4 select-none w-full items-center">
                                <Button className="w-full flex items-center gap-2 justify-center" variant="default" onClick={handlePrintPayslip} disabled={!selectedMonth || loadingPayslip}>
                                    <FileText className="w-4 h-4" />
                                    {loadingPayslip ? 'Loading Payslip...' : 'Print Payslip'}
                                </Button>
                                <Button className="w-full flex items-center gap-2 justify-center" variant="outline" onClick={handlePrintBTR} disabled={!selectedMonth || loadingBTR}>
                                    <Printer className="w-4 h-4" />
                                    {loadingBTR ? 'Loading BTR...' : 'Print BTR'}
                                </Button>
                                
                            </div>
                            <DialogFooter>
                                <Button onClick={onClose} variant="secondary">Close</Button>
                                {showPDF === 'payslip' && payrollData && (
                                    <PDFDownloadLink
                                        document={<PayslipTemplate
                                            employeeName={employee ? (formatFullName(employee.last_name, employee.first_name, employee.middle_name)) : ''}
                                            role={employee?.roles || '-'}
                                            payPeriod={selectedMonth}
                                            earnings={payrollData.earnings}
                                            deductions={payrollData.deductions}
                                            totalDeductions={payrollData.totalDeductions}
                                            totalHours={payrollData.earnings.totalHours}
                                            collegeRate={payrollData.earnings.collegeRate}
                                        />}
                                        fileName={`Payslip_${sanitizeFile(employee?.last_name)}_${sanitizeFile(employee?.first_name)}_${sanitizeFile(selectedMonth)}.pdf`}
                                        download
                                        style={{ display: 'none' }}
                                    >
                                        {({ url, loading }) => {
                                            if (url && !loading && url) {
                                                if (AUTO_DOWNLOAD) {
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `Payslip_${sanitizeFile(employee?.last_name)}_${sanitizeFile(employee?.first_name)}_${sanitizeFile(selectedMonth)}.pdf`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                } else {
                                                    window.open(url, '_blank');
                                                }
                                                setShowPDF(false);
                                            }
                                            return null;
                                        }}
                                    </PDFDownloadLink>
                                )}
                                {showPDF === 'btr' && btrRecords.length > 0 && (
                                    <PDFDownloadLink
                                        document={<BiometricTimeRecordTemplate
                                            employee={employee}
                                            leaveDatesMap={leaveDatesMap}
                                            employeeName={employee ? (formatFullName(employee.last_name, employee.first_name, employee.middle_name)) : ''}
                                            role={employee?.roles || '-'}
                                            payPeriod={selectedMonth}
                                            records={btrRecords}
                                            totalHours={btrTotalHours}
                                            tardiness={btrMetrics.tardiness}
                                            undertime={btrMetrics.undertime}
                                            overtime={btrMetrics.overtime}
                                            absences={btrMetrics.absences}
                                        />}
                                        fileName={`BTR_${sanitizeFile(employee?.last_name)}_${sanitizeFile(employee?.first_name)}_${sanitizeFile(selectedMonth)}.pdf`}
                                        download
                                        style={{ display: 'none' }}
                                    >
                                        {({ url, loading }) => {
                                            if (url && !loading && url) {
                                                if (AUTO_DOWNLOAD) {
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `BTR_${sanitizeFile(employee?.last_name)}_${sanitizeFile(employee?.first_name)}_${sanitizeFile(selectedMonth)}.pdf`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                } else {
                                                    window.open(url, '_blank');
                                                }
                                                setShowPDF(false);
                                            }
                                            return null;
                                        }}
                                    </PDFDownloadLink>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Dialog>
    );
}
