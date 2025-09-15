import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import React, { useState } from 'react';
import { useEmployeePayroll } from '@/hooks/useEmployeePayroll';
// ...existing code...
import { toast } from 'sonner';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PayslipTemplate from './print-templates/PayslipTemplate';
import BiometricTimeRecordTemplate from './print-templates/BiometricTimeRecordTemplate';
import { AnimatePresence, motion } from 'framer-motion';
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
            withholdingTaxBase: payroll.withholding_tax_base ?? '',
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
    const [selected, setSelected] = useState({ payslip: true, btr: false });
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
    const [showPDF, setShowPDF] = useState(false);
    const [payrollData, setPayrollData] = useState<PayslipData | null>(null);

    const handleChange = (key: 'payslip' | 'btr') => {
        setSelected(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePrint = async () => {
        setShowPDF(false); // Always reset before print
        if (selected.payslip) {
            const data = await fetchPayrollData(employee?.id, selectedMonth);
            if (selected.payslip) {
                const payrollData = await fetchPayrollData(employee?.id, selectedMonth);
                if (!payrollData) {
                    toast.error('No payroll data found for the selected month.');
                    return;
                }
                // Fetch timekeeping records before calculating numHours
                const response = await fetch(`/api/timekeeping/records?employee_id=${employee?.id}&month=${selectedMonth}`);
                const result = await response.json();
                let btrRecords: BTRRecord[] = [];
                if (result.success && Array.isArray(result.records) && result.records.length > 0) {
                    btrRecords = result.records.map((rec: {
                        date: string;
                        clock_in?: string;
                        time_in?: string;
                        clock_out?: string;
                        time_out?: string;
                    }) => {
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
                // Calculate total worked hours from timekeeping summary
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
                    ...payrollData,
                    earnings: {
                        ...payrollData.earnings,
                        numHours,
                        ratePerHour: timekeepingSummary?.rate_per_hour ?? 0,
                        tardiness: timekeepingSummary?.tardiness ?? 0,
                        undertime: timekeepingSummary?.undertime ?? 0,
                        absences: timekeepingSummary?.absences ?? 0,
                        overtime_pay_total: timekeepingSummary?.overtime_pay_total ?? 0,
                    },
                });
                setTimeout(() => setShowPDF(true), 100); // Ensure PDF triggers
            }
            const response = await fetch(`/api/timekeeping/records?employee_id=${employee?.id}&month=${selectedMonth}`);
            const result = await response.json();
            if (result.success && Array.isArray(result.records) && result.records.length > 0) {
                const records: BTRRecord[] = result.records.map((rec: {
                    date: string;
                    clock_in?: string;
                    time_in?: string;
                    clock_out?: string;
                    time_out?: string;
                }) => {
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
                setTimeout(() => setShowPDF(true), 100); // Ensure PDF triggers
            } else {
                setBtrRecords([]);
                toast.error('No biometric time records found for this month.');
            }
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
                        <DialogContent style={{ maxWidth: 340, padding: '1.5rem' }}>
                            <DialogHeader>
                                <DialogTitle>Print Employee Report</DialogTitle>
                            </DialogHeader>
                            <div className="mb-4 text-sm text-muted-foreground">
                                What would you like to print for <span className="font-semibold">{employee?.last_name}, {employee?.first_name}</span>?
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-semibold mb-1">Select Month</label>
                                <MonthPicker
                                    value={selectedMonth}
                                    onValueChange={setSelectedMonth}
                                    availableMonths={availableMonths}
                                    className="w-full"
                                />
                            </div>
                            <div className="flex flex-col gap-2 mb-4 select-none">
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selected.payslip}
                                        onCheckedChange={() => handleChange('payslip')}
                                        className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                                    />
                                    Payslip
                                </label>
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selected.btr}
                                        onCheckedChange={() => handleChange('btr')}
                                        className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                                    />
                                    Biometric Time Record (BTR)
                                </label>
                            </div>
                            <DialogFooter>
                                <Button onClick={onClose} variant="secondary">Cancel</Button>
                                <Button disabled={!selected.payslip && !selected.btr} onClick={handlePrint}>Print Selected</Button>
                                {showPDF && selected.payslip && payrollData && (
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
                                        fileName={`Payslip_${employee?.last_name}_${employee?.first_name}_${selectedMonth}.pdf`}
                                        style={{ display: 'none' }}
                                    >
                                        {({ url, loading }) => {
                                            if (url && !loading) {
                                                window.open(url, '_blank');
                                                setShowPDF(false);
                                            }
                                            return null;
                                        }}
                                    </PDFDownloadLink>
                                )}
                                {showPDF && selected.btr && btrRecords.length > 0 && (
                                    <PDFDownloadLink
                                        document={<BiometricTimeRecordTemplate
                                            employeeName={`${employee?.last_name}, ${employee?.first_name}`}
                                            payPeriod={selectedMonth}
                                            records={btrRecords}
                                        />}
                                        fileName={`BTR_${employee?.last_name}_${employee?.first_name}_${selectedMonth}.pdf`}
                                        style={{ display: 'none' }}
                                    >
                                        {({ url, loading }) => {
                                            if (url && !loading) {
                                                window.open(url, '_blank');
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