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

interface Payroll {
    payroll_date: string;
    base_salary?: number;
    college_rate?: number;
    tardiness?: number;
    undertime?: number;
    absences?: number;
    overtime_pay?: number;
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
    const payroll: Payroll & { college_rate?: number } = result.payrolls.reduce((latest: Payroll, curr: Payroll) => {
        return new Date(curr.payroll_date) > new Date(latest.payroll_date) ? curr : latest;
    }, result.payrolls[0]);
    return {
        earnings: {
            monthlySalary: payroll.base_salary ?? 0,
            tardiness: payroll.tardiness ?? 0,
            undertime: payroll.undertime ?? 0,
            absences: payroll.absences ?? 0,
            overtime_pay_total: payroll.overtime_pay ?? 0,
            adjustment: payroll.adjustments ?? 0,
            ratePerHour: undefined,
            collegeRate: payroll.college_rate ?? 0,
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
    if (!employee) {
        return null;
    }
    
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const { summary: timekeepingSummary } = useEmployeePayroll(employee.id, selectedMonth);
    const [btrRecords, setBtrRecords] = useState<BTRRecord[]>([]);
    const [leaveDatesMap, setLeaveDatesMap] = useState<Record<string, string>>({});
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [payrollData, setPayrollData] = useState<PayslipData | null>(null);
    const [showPDF, setShowPDF] = useState<false | 'payslip' | 'btr'>(false);
    const [loadingPayslip, setLoadingPayslip] = useState(false);
    const [loadingBTR, setLoadingBTR] = useState(false);

    const fetchAvailableMonths = async () => {
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
    };
    React.useEffect(() => {
        if (open) {
            fetchAvailableMonths();
        }
    }, [open]);

    const handlePrintPayslip = async () => {
        setLoadingPayslip(true);
        setShowPDF(false);
        const data = await fetchPayrollData(employee?.id, selectedMonth);
        if (!data) {
            toast.error('No payroll data found for the selected month.');
            setLoadingPayslip(false);
            return;
        }
        let payrollCollegeRate = 0;
        try {
            const response = await fetch(route('payroll.employee.monthly', {
                employee_id: employee?.id,
                month: selectedMonth,
            }));
            const result = await response.json();
            if (result.success && result.payrolls && result.payrolls.length > 0) {
                type PayrollType = typeof result.payrolls[0];
                const payroll = result.payrolls.reduce((latest: PayrollType, curr: PayrollType) => {
                    return new Date(curr.payroll_date) > new Date(latest.payroll_date) ? curr : latest;
                }, result.payrolls[0]);
                payrollCollegeRate = payroll.college_rate ?? 0;
            }
        } catch { /* ignore error */ }
        const response = await fetch(`/api/timekeeping/records?employee_id=${employee?.id}&month=${selectedMonth}`);
        const result = await response.json();
        let btrRecords: BTRRecord[] = [];
        if (result.success && Array.isArray(result.records) && result.records.length > 0) {
            btrRecords = result.records.map((rec: Record<string, unknown>) => {
                const dateObj = new Date(rec.date as string);
                const dayName = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : '';
                return {
                    date: rec.date as string,
                    dayName,
                    timeIn: (rec.clock_in as string) || (rec.time_in as string) || '-',
                    timeOut: (rec.clock_out as string) || (rec.time_out as string) || '-',
                };
            });
        }
        let numHours = 0;
        if (timekeepingSummary) {
            let totalWorkedHours = 0;
            if (Array.isArray(btrRecords) && employee?.work_hours_per_day) {
                const attendedShifts = btrRecords.filter(
                    (rec) => rec.timeIn !== '-' || rec.timeOut !== '-'
                ).length;
                totalWorkedHours = attendedShifts * employee.work_hours_per_day;
            }
            numHours = totalWorkedHours
                - (Number(timekeepingSummary.tardiness ?? 0))
                - (Number(timekeepingSummary.undertime ?? 0))
                - (Number(timekeepingSummary.absences ?? 0))
                + (Number(timekeepingSummary.overtime ?? 0));
            if (numHours < 0) numHours = 0;
        }
            setPayrollData({
                ...data,
                earnings: {
                    ...data.earnings,
                    numHours,
                    ratePerHour: (employee?.roles && employee.roles.toLowerCase().includes('college'))
                        ? (data.earnings.collegeRate ?? payrollCollegeRate ?? 0)
                        : (timekeepingSummary?.rate_per_hour ?? 0),
                    collegeRate: data.earnings.collegeRate ?? payrollCollegeRate ?? 0,
                    tardiness: timekeepingSummary?.tardiness ?? 0,
                    undertime: timekeepingSummary?.undertime ?? 0,
                    absences: timekeepingSummary?.absences ?? 0,
                    overtime_pay_total: timekeepingSummary?.overtime_pay_total ?? 0,
                    overtime: timekeepingSummary?.overtime ?? undefined,
                    overtime_count_weekdays: timekeepingSummary?.overtime_count_weekdays ?? data.earnings.overtime_count_weekdays ?? 0,
                    overtime_count_weekends: timekeepingSummary?.overtime_count_weekends ?? data.earnings.overtime_count_weekends ?? 0,
                    gross_pay: (data.totalEarnings !== undefined && data.totalEarnings !== null && data.totalEarnings !== '') ? data.totalEarnings : (typeof data.earnings?.gross_pay !== 'undefined' ? data.earnings.gross_pay : undefined),
                    net_pay: (data.netPay !== undefined && data.netPay !== null && data.netPay !== '') ? data.netPay : (typeof data.earnings?.net_pay !== 'undefined' ? data.earnings.net_pay : undefined),
                    adjustment: data.earnings?.adjustment ?? undefined,
                    honorarium: data.earnings?.honorarium ?? undefined,
                    collegeGSP: data.earnings?.collegeGSP ?? undefined,
                    overload: data.earnings?.overload ?? undefined,
                    totalHours: (employee?.roles && employee.roles.toLowerCase().includes('college'))
                      ? (timekeepingSummary?.total_hours ? Number(timekeepingSummary.total_hours) : 0)
                      : (typeof numHours === 'number' ? numHours : (numHours ? Number(numHours) : 0)),
                },
            });
        setTimeout(() => {
            setShowPDF('payslip');
            setLoadingPayslip(false);
        }, 100);

        // Fire-and-forget audit log for payslip print
        try {
            fetch('/api/audit/print-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'payslip',
                    employee_id: employee?.id,
                    month: selectedMonth,
                    details: { source: 'PrintDialog' },
                }),
            });
        } catch {
            // ignore audit errors
        }
    };

    const handlePrintBTR = async () => {
        setLoadingBTR(true);
        setShowPDF(false);
        try {
            const btrRes = await fetch(`/api/timekeeping/records?employee_id=${employee?.id}&month=${selectedMonth}`);
            const btrJson = await btrRes.json();
            let btrRecords: BTRRecord[] = [];
            if (btrJson.success && Array.isArray(btrJson.records)) {
                btrRecords = btrJson.records.map((rec: Record<string, unknown>) => ({
                    ...rec,
                    timeIn: (rec.clock_in as string) || (rec.time_in as string) || '-',
                    timeOut: (rec.clock_out as string) || (rec.time_out as string) || '-',
                }));
            }
            
            const summaryRes = await fetch(`/api/timekeeping/monthlySummary?employee_id=${employee?.id}&month=${selectedMonth}`);
            const summaryJson = await summaryRes.json();
            if (summaryJson.success && summaryJson._debug) {
                setLeaveDatesMap(summaryJson._debug.leave_dates_map || {});
            } else {
                setLeaveDatesMap({});
            }

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

            // Fire-and-forget audit log for BTR print
            try {
                fetch('/api/audit/print-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'btr',
                        employee_id: employee?.id,
                        month: selectedMonth,
                        details: { source: 'PrintDialog' },
                    }),
                });
            } catch {
                // ignore audit errors
            }
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
                                <Button className="w-full flex items-center gap-2 justify-center" variant="default" onClick={handlePrintBTR} disabled={!selectedMonth || loadingBTR}>
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
                                            totalHours={
                                                typeof timekeepingSummary?.total_hours === 'number'
                                                    ? timekeepingSummary.total_hours
                                                    : (() => {
                                                        let totalWorkedHours = 0;
                                                        if (Array.isArray(btrRecords) && employee?.work_hours_per_day) {
                                                            const attendedShifts = btrRecords.filter(
                                                                (rec) => rec.timeIn !== '-' || rec.timeOut !== '-'
                                                            ).length;
                                                            totalWorkedHours = attendedShifts * employee.work_hours_per_day;
                                                        }
                                                        return totalWorkedHours
                                                            - (Number(timekeepingSummary?.tardiness ?? 0))
                                                            - (Number(timekeepingSummary?.undertime ?? 0))
                                                            - (Number(timekeepingSummary?.absences ?? 0))
                                                            + (Number(timekeepingSummary?.overtime ?? 0));
                                                    })()
                                            }
                                            tardiness={timekeepingSummary?.tardiness ?? 0}
                                            undertime={timekeepingSummary?.undertime ?? 0}
                                            overtime={timekeepingSummary?.overtime ?? 0}
                                            absences={timekeepingSummary?.absences ?? 0}
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
