// Utility to sanitize file names (remove spaces, special chars)
function sanitizeFile(str?: string) {
    return (str || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// Removed Checkbox import
import React, { useState } from 'react';
import { useEmployeePayroll } from '@/hooks/useEmployeePayroll';
// ...existing code...
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
    sss_loan?: string;
    pag_ibig?: string;
    philhealth?: string;
    withholding_tax?: string;
    withholding_tax_base?: string;
    gross_pay?: number;
    total_deductions?: number;
    net_pay?: number;
    salary_loan?: string | number;
    peraa_con?: string | number;
    china_bank?: string | number;
    tea?: string | number;
    calamity_loan?: string | number;
    multipurpose_loan?: string | number;
}

interface PayslipData {
    earnings: {
        monthlySalary?: string | number;
        numHours?: string | number;
        ratePerHour?: string | number;
        collegeGSP?: string | number;
        honorarium?: string | number;
        tardiness?: number;
        undertime?: number;
        absences?: number;
        overtime_pay_total?: number;
        overload?: string | number;
        adjustment?: string | number;
    };
    deductions: {
        sss?: string;
        sssLoan?: string;
        pagibig?: string;
        philhealth?: string;
        withholdingTax?: string;
        withholdingTaxBase?: string;
        salaryLoan?: string | number;
        peraaCon?: string | number;
        chinaBank?: string | number;
        tea?: string | number;
        calamityLoan?: string | number;
        multipurposeLoan?: string | number;
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
            sssLoan: payroll.sss_loan ?? '',
            pagibig: payroll.pag_ibig ?? '',
            philhealth: payroll.philhealth ?? '',
            withholdingTax: payroll.withholding_tax ?? '',
            salaryLoan: payroll.salary_loan ?? '',
            peraaCon: payroll.peraa_con ?? '',
            chinaBank: payroll.china_bank ?? '',
            tea: payroll.tea ?? '',
            calamityLoan: payroll.calamity_loan ?? '',
            multipurposeLoan: payroll.multipurpose_loan ?? '',
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
            btrRecords = result.records.map((rec: any) => {
                const dateObj = new Date(rec.date);
                const dayName = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : '';
                return {
                    date: rec.date,
                    dayName,
                    timeIn: rec.clock_in || rec.time_in || '-',
                    timeOut: rec.clock_out || rec.time_out || '-',
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
            },
        });
        setTimeout(() => setShowPDF('payslip'), 100);
    };

    // Print BTR handler
    const handlePrintBTR = async () => {
        setShowPDF(false);
        const response = await fetch(`/api/timekeeping/records?employee_id=${employee?.id}&month=${selectedMonth}`);
        const result = await response.json();
        if (result.success && Array.isArray(result.records) && result.records.length > 0) {
            const records: BTRRecord[] = result.records.map((rec: any) => {
                const dateObj = new Date(rec.date);
                const dayName = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : '';
                return {
                    date: rec.date,
                    dayName,
                    timeIn: rec.clock_in || rec.time_in || '-',
                    timeOut: rec.clock_out || rec.time_out || '-',
                };
            });
            setBtrRecords(records);
            setTimeout(() => setShowPDF('btr'), 100);
        } else {
            setBtrRecords([]);
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
                                What would you like to print for <span className="font-semibold">{employee?.last_name}, {employee?.first_name}</span>?
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
                                            employeeName={`${employee?.last_name}, ${employee?.first_name}`}
                                            role={employee?.roles || '-'}
                                            payPeriod={selectedMonth}
                                            earnings={payrollData.earnings}
                                            deductions={payrollData.deductions}
                                            totalEarnings={payrollData.totalEarnings}
                                            totalDeductions={payrollData.totalDeductions}
                                            netPay={payrollData.netPay}
                                            netPay1530={payrollData.netPay1530}
                                        />}
                                        fileName={`Payslip_${sanitizeFile(employee?.last_name)}_${sanitizeFile(employee?.first_name)}_${sanitizeFile(selectedMonth)}.pdf`}
                                        download
                                        style={{ display: 'none' }}
                                    >
                                        {({ url, loading }) => {
                                            if (url && !loading && url) {
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `Payslip_${sanitizeFile(employee?.last_name)}_${sanitizeFile(employee?.first_name)}_${sanitizeFile(selectedMonth)}.pdf`;
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                                setShowPDF(false);
                                            }
                                            return null;
                                        }}
                                    </PDFDownloadLink>
                                )}
                                {showPDF === 'btr' && btrRecords.length > 0 && (
                                    <PDFDownloadLink
                                        document={<BiometricTimeRecordTemplate
                                            employeeName={`${employee?.last_name}, ${employee?.first_name}`}
                                            payPeriod={selectedMonth}
                                            records={btrRecords}
                                        />}
                                        fileName={`BTR_${sanitizeFile(employee?.last_name)}_${sanitizeFile(employee?.first_name)}_${sanitizeFile(selectedMonth)}.pdf`}
                                        download
                                        style={{ display: 'none' }}
                                    >
                                        {({ url, loading }) => {
                                            if (url && !loading && url) {
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `BTR_${sanitizeFile(employee?.last_name)}_${sanitizeFile(employee?.first_name)}_${sanitizeFile(selectedMonth)}.pdf`;
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
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