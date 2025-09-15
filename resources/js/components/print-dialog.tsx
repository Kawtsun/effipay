import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import React, { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PayslipTemplate from './print-templates/PayslipTemplate';
import { AnimatePresence, motion } from 'framer-motion';
import { MonthPicker } from './ui/month-picker';

interface PrintDialogProps {
    open: boolean;
    onClose: () => void;
    employee: any;
}

const fetchPayrollData = async (employeeId: number, month: string) => {
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
    const payroll = result.payrolls.reduce((latest, curr) => {
        return new Date(curr.payroll_date) > new Date(latest.payroll_date) ? curr : latest;
    }, result.payrolls[0]);
    // Map backend fields to payslip template props
    return {
        earnings: {
            monthlySalary: payroll.base_salary?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            tardiness: payroll.tardiness?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            absences: payroll.absences?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        },
        deductions: {
            sss: payroll.sss?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            sssLoan: payroll.sss_loan?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            pagibig: payroll.pag_ibig?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
            philhealth: payroll.philhealth?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        },
        otherDeductions: {
            tuition: payroll.tuition?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        },
        totalEarnings: payroll.gross_pay?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        totalDeductions: payroll.total_deductions?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        netPay: payroll.net_pay?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
        netPay1530: payroll.net_pay ? (Number(payroll.net_pay) / 2).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '',
    };
};

export default function PrintDialog({ open, onClose, employee }: PrintDialogProps) {
    const [selected, setSelected] = useState({ payslip: true, btr: false });
    // Sync month selector with report dialog logic
    const [selectedMonth, setSelectedMonth] = useState<string>('');
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
    }, []);
    const [showPDF, setShowPDF] = useState(false);
    const [payrollData, setPayrollData] = useState<any>(null);

    const handleChange = (key: 'payslip' | 'btr') => {
        setSelected(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePrint = async () => {
        if (selected.payslip) {
            // Fetch payroll data for selected employee and month
            const data = await fetchPayrollData(employee?.id, selectedMonth);
            setPayrollData(data);
            setShowPDF(true);
        }
        // Add BTR logic here if needed
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
                            <div className="flex flex-col gap-2 mb-4">
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
                                            payPeriod={selectedMonth}
                                            earnings={payrollData.earnings}
                                            deductions={payrollData.deductions}
                                            otherDeductions={payrollData.otherDeductions}
                                            totalEarnings={payrollData.totalEarnings}
                                            totalDeductions={payrollData.totalDeductions}
                                            netPay={payrollData.netPay}
                                            netPay1530={payrollData.netPay1530}
                                        />}
                                        fileName={`Payslip_${employee?.last_name}_${employee?.first_name}_${selectedMonth}.pdf`}
                                        style={{ display: 'none' }}
                                    >
                                        {({ blob, url, loading, error }) => {
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