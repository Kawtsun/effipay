// Toggle for auto-download vs. view in new tab
const AUTO_DOWNLOAD = false; // Set to true to enable auto-download, false for view in new tab
// Utility to sanitize file names (remove spaces, special chars)
function sanitizeFile(str?: string) {
  return (str || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}


import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { MonthPicker } from './ui/month-picker';

import { pdf } from '@react-pdf/renderer';
import PayslipBatchTemplate from './print-templates/PayslipBatchTemplate';
import { FileText, Printer } from 'lucide-react';

interface PrintAllDialogProps {
  open: boolean;
  onClose: () => void;
}

const PrintAllDialog: React.FC<PrintAllDialogProps> = ({ open, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  // Fetch available months from backend (same as PrintDialog)
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

  React.useEffect(() => {
    fetchAvailableMonths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // State for batch payslip printing
  const [batchPayslipData, setBatchPayslipData] = useState<any[] | null>(null);
  const [loadingBatchPayslips, setLoadingBatchPayslips] = useState(false);
  const [batchPayslipError, setBatchPayslipError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Fetch all employees and their payslip data for the selected month
  const handlePrintPayslipAll = async () => {
    setLoadingBatchPayslips(true);
    setBatchPayslipError(null);
    setBatchPayslipData(null);
    setGeneratingPDF(false);
    try {
      // 1. Fetch all employees
      const empRes = await fetch('/api/employees/all');
      let empResult;
      try {
        empResult = await empRes.json();
      } catch (jsonErr) {
        setBatchPayslipError('Failed to parse employees response.');
        console.error('Failed to parse employees response:', jsonErr);
        setLoadingBatchPayslips(false);
        return;
      }
      if (!empResult.success || !Array.isArray(empResult.employees)) {
        setBatchPayslipError('Failed to fetch employees. Response: ' + JSON.stringify(empResult));
        console.error('Failed to fetch employees:', empResult);
        setLoadingBatchPayslips(false);
        return;
      }
      const employees = empResult.employees;
      // 2. For each employee, fetch payslip data for the selected month
      const payslipDataArr = await Promise.all(
        employees.map(async (emp: any, idx: number) => {
          try {
            const res = await fetch(`/api/payroll/payslip?employee_id=${emp.id}&month=${selectedMonth}`);
            let result;
            try {
              result = await res.json();
            } catch (jsonErr) {
              console.error(`Failed to parse payslip for employee ${emp.id}:`, jsonErr);
              return null;
            }
            if (!result.success || !result.payslip) {
              console.error(`No payslip for employee ${emp.id}:`, result);
              return null;
            }
            if (idx === 0) {
              console.log('Payslip API response for first employee:', result.payslip);
            }
            // Map API fields to PayslipTemplate props
            const payslip = result.payslip;
            return {
              employeeName: `${emp.last_name}, ${emp.first_name} ${emp.middle_name}`,
              role: emp.roles || '-',
              payPeriod: selectedMonth,
              earnings: {
                monthlySalary: payslip.base_salary,
                tardiness: payslip.tardiness,
                undertime: payslip.undertime,
                absences: payslip.absences,
                overtime_pay_total: payslip.overtime_pay,
                ratePerHour: payslip.rate_per_hour,
                honorarium: payslip.honorarium,
                gross_pay: payslip.gross_pay,
                net_pay: payslip.net_pay,
                adjustment: payslip.adjustment,
                collegeGSP: payslip.college_gsp,
                overload: payslip.overload,
                // Add more mappings as needed
              },
              deductions: {
                sss: payslip.sss,
                philhealth: payslip.philhealth,
                pagibig: payslip.pag_ibig,
                withholdingTax: payslip.withholding_tax,
                sssSalaryLoan: payslip.sss_salary_loan,
                sssCalamityLoan: payslip.sss_calamity_loan,
                pagibigMultiLoan: payslip.pagibig_multi_loan,
                pagibigCalamityLoan: payslip.pagibig_calamity_loan,
                peraaCon: payslip.peraa_con,
                tuition: payslip.tuition,
                chinaBank: payslip.china_bank,
                tea: payslip.tea,
                // Add more mappings as needed
              },
              totalDeductions: payslip.total_deductions,
            };
          } catch (err) {
            console.error(`Error fetching payslip for employee ${emp.id}:`, err);
            return null;
          }
        })
      );
      // Filter out nulls (failed fetches)
      const filtered = payslipDataArr.filter(Boolean);
      if (filtered.length === 0) {
        setBatchPayslipError('No payslip data found for any employee. Check console for details.');
        setLoadingBatchPayslips(false);
        return;
      }
      // Immediately generate and open PDF blob or download
      setGeneratingPDF(true);
      try {
        const doc = <PayslipBatchTemplate payslips={filtered} />;
        const asPdf = pdf(doc);
        const blob = await asPdf.toBlob();
        const url = URL.createObjectURL(blob);
        if (AUTO_DOWNLOAD) {
          const a = document.createElement('a');
          a.href = url;
          a.download = `Payslip_All_${sanitizeFile(selectedMonth)}.pdf`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        } else {
          window.open(url, '_blank');
        }
      } catch {
        setBatchPayslipError('Failed to generate PDF.');
      } finally {
        setGeneratingPDF(false);
      }
    } catch (err) {
      setBatchPayslipError('An error occurred while fetching payslip data. ' + (err instanceof Error ? err.message : ''));
      console.error('Batch payslip fetch error:', err);
    } finally {
      setLoadingBatchPayslips(false);
    }
  };

  // Generate PDF blob and open in new tab (blob view)
  const handleViewPayslipPDF = async () => {
    if (!batchPayslipData || batchPayslipData.length === 0) return;
    setGeneratingPDF(true);
    try {
      const doc = <PayslipBatchTemplate payslips={batchPayslipData} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      setBatchPayslipError('Failed to generate PDF.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handlePrintBTRAll = () => {
    alert('Batch BTR printing coming soon!');
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
            <DialogContent style={{ maxWidth: 340, padding: '1.5rem 1.5rem 1.2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <DialogHeader>
                <DialogTitle>Print All Employee Reports</DialogTitle>
              </DialogHeader>
              <div className="mb-4 text-sm text-muted-foreground text-center w-full">
                Select a month and choose what to print for all employees.
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
                <Button
                  className="w-full flex items-center gap-2 justify-center"
                  variant="default"
                  onClick={handlePrintPayslipAll}
                  disabled={!selectedMonth || loadingBatchPayslips}
                >
                  <FileText className="w-4 h-4" />
                  {loadingBatchPayslips ? 'Loading Payslips...' : 'Print All Payslips'}
                </Button>
                {batchPayslipError && (
                  <div className="text-xs text-red-500 text-center w-full">{batchPayslipError}</div>
                )}
                {/* No second button for viewing PDF; PDF opens immediately after data fetch */}
                <Button className="w-full flex items-center gap-2 justify-center" variant="default" onClick={handlePrintBTRAll} disabled={!selectedMonth}>
                  <Printer className="w-4 h-4" />
                  Print All BTRs
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={onClose} variant="secondary">Close</Button>
              </DialogFooter>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default PrintAllDialog;
