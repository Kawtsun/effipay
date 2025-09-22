import { formatFullName } from '../utils/formatFullName';

// Utility to convert a string to Title Case (capitalize each word)
function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
// Toggle for auto-download vs. view in new tab
const AUTO_DOWNLOAD = false; // Set to true to enable auto-download, false for view in new tab
// Utility to sanitize file names (remove spaces, special chars)
function sanitizeFile(str?: string) {
  return (str || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { MonthPicker } from './ui/month-picker';

import { pdf } from '@react-pdf/renderer';
import PayslipBatchTemplate from './print-templates/PayslipBatchTemplate';
import BTRBatchTemplate from './print-templates/BTRBatchTemplate';
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


  // State for batch payslip and BTR printing
  const [loadingBatchPayslips, setLoadingBatchPayslips] = useState(false);
  const [loadingBatchBTRs, setLoadingBatchBTRs] = useState(false);
  const [batchPayslipError, setBatchPayslipError] = useState<string | null>(null);
  const [batchBTRError, setBatchBTRError] = useState<string | null>(null);
  // Removed: generatingPDF, setGeneratingPDF (unused)

  // Fetch all employees and their payslip data for the selected month
  const handlePrintPayslipAll = async () => {
    setLoadingBatchPayslips(true);
    setBatchPayslipError(null);
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
      // 2. For each employee, fetch payslip data AND timekeeping summary for the selected month
      const payslipDataArr = await Promise.all(
        employees.map(async (emp: {
          id: number;
          first_name: string;
          middle_name: string;
          last_name: string;
          roles?: string;
        }, idx: number) => {
          try {
            // Fetch payslip
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
            // Fetch timekeeping summary (for hours/rate/OT, etc.)
            let summary = null;
            try {
              const summaryRes = await fetch(`/timekeeping/employee/monthly-summary?employee_id=${emp.id}&month=${selectedMonth}`);
              const summaryJson = await summaryRes.json();
              if (summaryJson.success) summary = summaryJson;
            } catch (summaryErr) {
              console.error(`Failed to fetch timekeeping summary for employee ${emp.id}:`, summaryErr);
            }
            if (idx === 0) {
              console.log('Payslip API response for first employee:', result.payslip);
              if (summary) console.log('Timekeeping summary for first employee:', summary);
            }
            // Map API fields to PayslipTemplate props, merging summary values if present
            const payslip = result.payslip;
            const mergedEarnings = {
              monthlySalary: payslip.base_salary,
              tardiness: summary?.tardiness ?? payslip.tardiness,
              tardinessAmount: payslip.tardiness_amount ?? payslip.tardinessAmount,
              undertime: summary?.undertime ?? payslip.undertime,
              undertimeAmount: payslip.undertime_amount ?? payslip.undertimeAmount,
              absences: summary?.absences ?? payslip.absences,
              absencesAmount: payslip.absences_amount ?? payslip.absencesAmount,
              overtime: summary?.overtime ?? payslip.overtime,
              overtime_hours: payslip.overtime_hours,
              overtime_pay_total: summary?.overtime_pay_total ?? payslip.overtime_pay,
              ratePerHour: summary?.rate_per_hour ?? payslip.rate_per_hour ?? payslip.ratePerHour,
              honorarium: payslip.honorarium,
              gross_pay: summary?.gross_pay ?? payslip.gross_pay,
              net_pay: payslip.net_pay,
              adjustment: payslip.adjustment,
              collegeGSP: payslip.college_gsp,
              overload: payslip.overload,
              // Add more mappings as needed
            };
            return {
              employeeName: toTitleCase(formatFullName(emp.last_name, emp.first_name, emp.middle_name)),
              role: emp.roles || '-',
              payPeriod: selectedMonth,
              earnings: mergedEarnings,
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
  // Removed: setGeneratingPDF (unused)
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
  // Removed: setGeneratingPDF (unused)
      }
    } catch (err) {
      setBatchPayslipError('An error occurred while fetching payslip data. ' + (err instanceof Error ? err.message : ''));
      console.error('Batch payslip fetch error:', err);
    } finally {
    setLoadingBatchPayslips(false);
    }
  };

  // Generate PDF blob and open in new tab (blob view)
  // Removed: handleViewPayslipPDF (unused)

  const handlePrintBTRAll = async () => {
    setLoadingBatchBTRs(true);
    setBatchBTRError(null);
    try {
      // 1. Fetch all employees
      const empRes = await fetch('/api/employees/all');
      let empResult;
      try {
        empResult = await empRes.json();
      } catch (jsonErr) {
        setBatchBTRError('Failed to parse employees response.');
  setLoadingBatchBTRs(false);
        return;
      }
      if (!empResult.success || !Array.isArray(empResult.employees)) {
        setBatchBTRError('Failed to fetch employees. Response: ' + JSON.stringify(empResult));
  setLoadingBatchBTRs(false);
        return;
      }
      const employees = empResult.employees;
      // 2. For each employee, fetch BTR data and timekeeping summary for the selected month
      const btrDataArr = await Promise.all(
        employees.map(async (emp: {
          id: number;
          first_name: string;
          middle_name: string;
          last_name: string;
          roles?: string;
          work_hours_per_day?: number;
        }) => {
          try {
            // Fetch BTR records
            const btrRes = await fetch(`/api/timekeeping/records?employee_id=${emp.id}&month=${selectedMonth}`);
            const btrJson = await btrRes.json();
            let btrRecords: any[] = [];
            if (btrJson.success && Array.isArray(btrJson.records)) {
              btrRecords = btrJson.records.map((rec: any) => ({
                ...rec,
                timeIn: rec.clock_in || rec.time_in || '-',
                timeOut: rec.clock_out || rec.time_out || '-',
              }));
            }
            // Only include employees with at least one real timeIn or timeOut (not just a record)
            const hasRealTime = btrRecords.some(r => (r.timeIn && r.timeIn !== '-') || (r.timeOut && r.timeOut !== '-'));
            if (!hasRealTime) return null;
            // Fetch timekeeping summary
            let summary = null;
            try {
              const summaryRes = await fetch(`/timekeeping/employee/monthly-summary?employee_id=${emp.id}&month=${selectedMonth}`);
              const summaryJson = await summaryRes.json();
              if (summaryJson.success) summary = summaryJson;
            } catch (summaryErr) {
              console.error(`Failed to fetch timekeeping summary for employee ${emp.id}:`, summaryErr);
            }
            // Use summary.total_hours if available, else fallback to old formula
            const totalHours =
              typeof summary?.total_hours === 'number'
                ? summary.total_hours
                : (() => {
                    let totalWorkedHours = 0;
                    if (Array.isArray(btrRecords) && emp.work_hours_per_day) {
                      const attendedShifts = btrRecords.filter(
                        (rec) => rec.timeIn !== '-' || rec.timeOut !== '-'
                      ).length;
                      totalWorkedHours = attendedShifts * emp.work_hours_per_day;
                    }
                    return totalWorkedHours
                      - (Number(summary?.tardiness ?? 0))
                      - (Number(summary?.undertime ?? 0))
                      - (Number(summary?.absences ?? 0))
                      + (Number(summary?.overtime ?? 0));
                  })();
            return {
              employeeName: toTitleCase(formatFullName(emp.last_name, emp.first_name, emp.middle_name)),
              role: emp.roles || '-',
              payPeriod: selectedMonth,
              records: btrRecords,
              totalHours,
              tardiness: summary?.tardiness ?? 0,
              undertime: summary?.undertime ?? 0,
              overtime: summary?.overtime ?? 0,
              absences: summary?.absences ?? 0,
            };
          } catch (err) {
            console.error(`Error fetching BTR for employee ${emp.id}:`, err);
            return null;
          }
        })
      );
      // Filter out nulls (failed fetches or no BTR records)
      const filtered = btrDataArr.filter(Boolean);
      if (filtered.length === 0) {
        setBatchBTRError('No BTR data found for any employee. Check console for details.');
  setLoadingBatchBTRs(false);
        return;
      }
      // Generate and open PDF
      try {
        const doc = <BTRBatchTemplate btrs={filtered} />;
        const asPdf = pdf(doc);
        const blob = await asPdf.toBlob();
        const url = URL.createObjectURL(blob);
        if (AUTO_DOWNLOAD) {
          const a = document.createElement('a');
          a.href = url;
          a.download = `BTR_All_${sanitizeFile(selectedMonth)}.pdf`;
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
        setBatchBTRError('Failed to generate BTR PDF.');
      }
    } catch (err) {
      setBatchBTRError('An error occurred while fetching BTR data. ' + (err instanceof Error ? err.message : ''));
      console.error('Batch BTR fetch error:', err);
    } finally {
  setLoadingBatchBTRs(false);
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
                  {loadingBatchPayslips ? 'Loading...' : 'Print All Payslips'}
                </Button>
                {batchPayslipError && (
                  <div className="text-xs text-red-500 text-center w-full">{batchPayslipError}</div>
                )}
                {batchBTRError && (
                  <div className="text-xs text-red-500 text-center w-full">{batchBTRError}</div>
                )}
                {/* No second button for viewing PDF; PDF opens immediately after data fetch */}
                <Button className="w-full flex items-center gap-2 justify-center" variant="default" onClick={handlePrintBTRAll} disabled={!selectedMonth || loadingBatchBTRs}>
                  <Printer className="w-4 h-4" />
                  {loadingBatchBTRs ? 'Loading...' : 'Print All BTRs'}
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
