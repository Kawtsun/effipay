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
interface Employee {
    id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    roles?: string;
    work_hours_per_day?: number;
}

interface Payroll {
    payroll_date: string;
    base_salary?: number;
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
  employee: Employee;
}

// Toggle for auto-download vs. view in new tab
const AUTO_DOWNLOAD = false; // Set to true to enable auto-download, false for view in new tab
// Utility to sanitize file names (remove spaces, special chars)
function sanitizeFile(str?: string) {
    return (str || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

const fetchPayrollData = async (employeeId: number, month: string): Promise<PayslipData | null> => {
    // Fetch payroll data from backend
    const response = await fetch(route('payroll.employee.monthly', {
        employee_id: employeeId,
        month,
    }));
    const result = await response.json();
    if (!result.success || !result.payrolls || result.payrolls.length === 0) {
        return null;
    }
    // Use the latest payroll for the month
    const payroll: Payroll = result.payrolls.reduce((latest: Payroll, curr: Payroll) => {
        return new Date(curr.payroll_date) > new Date(latest.payroll_date) ? curr : latest;
    }, result.payrolls[0]);
    // Map backend fields to payslip template props
    return {
        earnings: {
            monthlySalary: payroll.base_salary ?? 0,
            tardiness: payroll.tardiness ?? 0,
            undertime: payroll.undertime ?? 0,
            absences: payroll.absences ?? 0,
            overtime_pay_total: payroll.overtime_pay ?? 0,
            ratePerHour: undefined, // will be injected from timekeeping
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
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const { summary: timekeepingSummary } = useEmployeePayroll(employee?.id ?? null, selectedMonth);
    // Removed selected state
    const [btrRecords, setBtrRecords] = useState<BTRRecord[]>([]);
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    // Fetch available months from backend
    const fetchAvailableMonths = async () => {
        try {
            const response = await fetch('/payroll/all-available-months');
            const result = await response.json();
            if (result.success) {
                setAvailableMonths(result.months);
                if (result.months.length > 0 && !selectedMonth) {
                    setSelectedMonth(result.months[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching available months:', error);
        }
    };
    // Fetch months on mount
    React.useEffect(() => {
        fetchAvailableMonths();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Removed duplicate showPDF state
    const [payrollData, setPayrollData] = useState<PayslipData | null>(null);


    // showPDF: false | 'payslip' | 'btr'
    const [showPDF, setShowPDF] = useState<false | 'payslip' | 'btr'>(false);

    // Print Payslip handler
    const handlePrintPayslip = async () => {
        setShowPDF(false);
        const data = await fetchPayrollData(employee?.id, selectedMonth);
        if (!data) {
            toast.error('No payroll data found for the selected month.');
            return;
        }
        // Fetch timekeeping records before calculating numHours
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
                ratePerHour: timekeepingSummary?.rate_per_hour ?? 0,
                tardiness: timekeepingSummary?.tardiness ?? 0,
                undertime: timekeepingSummary?.undertime ?? 0,
                absences: timekeepingSummary?.absences ?? 0,
                overtime_pay_total: timekeepingSummary?.overtime_pay_total ?? 0,
                overtime: timekeepingSummary?.overtime ?? undefined,
                gross_pay: (data.totalEarnings !== undefined && data.totalEarnings !== null && data.totalEarnings !== '') ? data.totalEarnings : (typeof data.earnings?.gross_pay !== 'undefined' ? data.earnings.gross_pay : undefined),
                net_pay: (data.netPay !== undefined && data.netPay !== null && data.netPay !== '') ? data.netPay : (typeof data.earnings?.net_pay !== 'undefined' ? data.earnings.net_pay : undefined),
                adjustment: data.earnings?.adjustment ?? undefined,
                honorarium: data.earnings?.honorarium ?? undefined,
                collegeGSP: data.earnings?.collegeGSP ?? undefined,
                overload: data.earnings?.overload ?? undefined,
            },
        });
        setTimeout(() => setShowPDF('payslip'), 100);
    };

    // Print BTR handler
    const handlePrintBTR = async () => {
        setShowPDF(false);
        const response = await fetch(`/api/timekeeping/records?employee_id=${employee?.id}&month=${selectedMonth}`);
        const result = await response.json();
        // Get all days in the selected month
    const allDates: string[] = [];
        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-').map(Number);
            if (!isNaN(year) && !isNaN(month)) {
                const daysInMonth = new Date(year, month, 0).getDate();
                for (let d = 1; d <= daysInMonth; d++) {
                    const date = new Date(year, month - 1, d);
                    allDates.push(date.toISOString().slice(0, 10));
                }
            }
        }
        const recordMap: Record<string, Partial<BTRRecord> & { clock_in?: string; time_in?: string; clock_out?: string; time_out?: string }> = {};
        if (result.success && Array.isArray(result.records)) {
            for (const rec of result.records) {
                recordMap[rec.date] = rec;
            }
        }
        const records: BTRRecord[] = allDates.map(dateStr => {
            const rec = recordMap[dateStr];
            const dateObj = new Date(dateStr);
            const dayName = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : '';
            return {
                date: dateStr,
                dayName,
                timeIn: rec ? (rec.clock_in || rec.time_in || '-') : '-',
                timeOut: rec ? (rec.clock_out || rec.time_out || '-') : '-',
            };
        });
        setBtrRecords(records);
        if (records.length > 0) {
            setTimeout(() => setShowPDF('btr'), 100);
        } else {
            toast.error('No biometric time records found for this month.');
        }
    };

    // Removed unused handlePrint and selected logic

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
                                What would you like to print for <span className="font-semibold">{employee?.last_name}, {employee?.first_name} {employee?.middle_name}</span>?
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
                                <Button className="w-full flex items-center gap-2 justify-center" variant="default" onClick={handlePrintPayslip} disabled={!selectedMonth}>
                                    <FileText className="w-4 h-4" />
                                    Print Payslip
                                </Button>
                                <Button className="w-full flex items-center gap-2 justify-center" variant="default" onClick={handlePrintBTR} disabled={!selectedMonth}>
                                    <Printer className="w-4 h-4" />
                                    Print Biometric Time Record (BTR)
                                </Button>
                            </div>
                            <DialogFooter>
                                <Button onClick={onClose} variant="secondary">Close</Button>
                                {showPDF === 'payslip' && payrollData && (
                                    <PDFDownloadLink
                                        document={<PayslipTemplate
                                            employeeName={`${employee?.last_name}, ${employee?.first_name} ${employee?.middle_name}`}
                                            role={employee?.roles || '-'}
                                            payPeriod={selectedMonth}
                                            earnings={payrollData.earnings}
                                            deductions={payrollData.deductions}
                                            totalDeductions={payrollData.totalDeductions}
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
                                            employeeName={`${employee?.last_name}, ${employee?.first_name} ${employee?.middle_name}`}
                                            payPeriod={selectedMonth}
                                            records={btrRecords}
                                            totalHours={(() => {
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
                                            })()}
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