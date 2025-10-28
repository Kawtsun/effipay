import { formatFullName } from '../utils/formatFullName';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { MonthPicker } from './ui/month-picker';
import { pdf } from '@react-pdf/renderer';
import PayslipBatchTemplate from './print-templates/PayslipBatchTemplate';
import BTRBatchTemplate from './print-templates/BTRBatchTemplate';
import { FileText, Printer } from 'lucide-react';
import { Employees } from '@/types';
import { computeMonthlyMetrics, type ObservanceEntry, type TimeRecordLike } from '@/utils/computeMonthlyMetrics';

// Local type matching BTRBatchTemplate's item shape
type BTRItem = {
  employee: Employees;
  leaveDatesMap: Record<string, string>;
  employeeName: string;
  role?: string;
  payPeriod?: string;
  records?: any[];
  totalHours?: number | string;
  tardiness?: number | string;
  undertime?: number | string;
  overtime?: number | string;
  absences?: number | string;
};

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

interface PrintAllDialogProps {
  open: boolean;
  onClose: () => void;
}

const PrintAllDialog: React.FC<PrintAllDialogProps> = ({ open, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

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

  const [loadingBatchPayslips, setLoadingBatchPayslips] = useState(false);
  const [loadingBatchBTRs, setLoadingBatchBTRs] = useState(false);
  const [batchPayslipError, setBatchPayslipError] = useState<string | null>(null);
  const [batchBTRError, setBatchBTRError] = useState<string | null>(null);

  const handlePrintPayslipAll = async () => {
    setLoadingBatchPayslips(true);
    setBatchPayslipError(null);
    try {
      // Pre-fetch observances once for this month to reuse across employees
      let observances: ObservanceEntry[] = [];
      try {
        const obsRes = await fetch('/observances');
        const obsJson = await obsRes.json();
        observances = Array.isArray(obsJson) ? obsJson : (Array.isArray(obsJson?.observances) ? obsJson.observances : []);
      } catch (e) {
        observances = [];
      }
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
          work_hours_per_day?: number;
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
            // Fetch timekeeping records for numHours calculation
            let btrRecords = [];
            try {
              const btrRes = await fetch(`/api/timekeeping/records?employee_id=${emp.id}&month=${selectedMonth}`);
              const btrJson = await btrRes.json();
              if (btrJson.success && Array.isArray(btrJson.records)) {
                btrRecords = btrJson.records;
              }
            } catch (btrErr) {
              // ignore
            }
            // Calculate numHours using the same logic as AttendanceCards
            let numHours = 0;
            const isCollege = (emp.roles || '').toLowerCase().includes('college');
            if (Array.isArray(btrRecords)) {
              const metrics = await computeMonthlyMetrics(emp as Employees, selectedMonth, btrRecords, observances);
              numHours = metrics.total_hours ?? 0;
            }
            // Get college_rate from payslip
            const collegeRate = result.payslip.college_rate ?? 0;
            // Compose merged earnings (match single print logic)
            const mergedEarnings = {
              monthlySalary: result.payslip.base_salary,
              numHours: isCollege ? numHours : undefined,
              totalHours: isCollege ? numHours : undefined,
              ratePerHour: isCollege ? (result.payslip.college_rate ?? 0) : (summary?.rate_per_hour ?? result.payslip.rate_per_hour ?? result.payslip.ratePerHour),
              collegeRate: result.payslip.college_rate ?? 0,
              collegeGSP: isCollege && typeof numHours === 'number' && Number(result.payslip.college_rate ?? 0) > 0
                ? parseFloat((numHours * Number(result.payslip.college_rate)).toFixed(2))
                : undefined,
              honorarium: result.payslip.honorarium,
              tardiness: summary?.tardiness ?? result.payslip.tardiness,
              tardinessAmount: summary?.tardiness !== undefined && isCollege
                ? parseFloat(((Number(summary.tardiness) || 0) * Number(result.payslip.college_rate ?? 0)).toFixed(2))
                : (result.payslip.tardiness_amount ?? result.payslip.tardinessAmount),
              undertime: summary?.undertime ?? result.payslip.undertime,
              undertimeAmount: summary?.undertime !== undefined && isCollege
                ? parseFloat(((Number(summary.undertime) || 0) * Number(result.payslip.college_rate ?? 0)).toFixed(2))
                : (result.payslip.undertime_amount ?? result.payslip.undertimeAmount),
              absences: summary?.absences ?? result.payslip.absences,
              absencesAmount: summary?.absences !== undefined && isCollege
                ? parseFloat(((Number(summary.absences) || 0) * Number(result.payslip.college_rate ?? 0)).toFixed(2))
                : (result.payslip.absences_amount ?? result.payslip.absencesAmount),
              overtime: summary?.overtime ?? result.payslip.overtime,
              overtime_hours: result.payslip.overtime_hours,
              overtime_pay_total: summary?.overtime_pay_total ?? result.payslip.overtime_pay,
              overtime_count_weekdays: summary?.overtime_count_weekdays ?? 0,
              overtime_count_weekends: summary?.overtime_count_weekends ?? 0,
              gross_pay: summary?.gross_pay ?? result.payslip.gross_pay,
              net_pay: result.payslip.net_pay,
              adjustment: result.payslip.adjustment,
              overload: result.payslip.overload,
            };
            return {
              employeeName: (formatFullName(emp.last_name, emp.first_name, emp.middle_name)),
              role: emp.roles || '-',
              payPeriod: selectedMonth,
              earnings: mergedEarnings,
              deductions: {
                sss: result.payslip.sss,
                philhealth: result.payslip.philhealth,
                pagibig: result.payslip.pag_ibig,
                withholdingTax: result.payslip.withholding_tax,
                sssSalaryLoan: result.payslip.sss_salary_loan,
                sssCalamityLoan: result.payslip.sss_calamity_loan,
                pagibigMultiLoan: result.payslip.pagibig_multi_loan,
                pagibigCalamityLoan: result.payslip.pagibig_calamity_loan,
                peraaCon: result.payslip.peraa_con,
                tuition: result.payslip.tuition,
                chinaBank: result.payslip.china_bank,
                tea: result.payslip.tea,
              },
              totalDeductions: result.payslip.total_deductions,
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
        toast.error('No payroll data found for the selected month.');
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
        // Fire-and-forget audit log for batch payslip print
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
              employee_id: null,
              month: selectedMonth,
              details: { source: 'PrintAllDialog', employees: filtered.length },
            }),
          }).catch(() => {});
        } catch {}
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

  const handlePrintBTRAll = async () => {
    setLoadingBatchBTRs(true);
    setBatchBTRError(null);
    try {
      const empRes = await fetch('/api/employees/all');
      const empResult = await empRes.json();
      if (!empResult.success || !Array.isArray(empResult.employees)) {
        setBatchBTRError('Failed to fetch employees.');
        setLoadingBatchBTRs(false);
        return;
      }
      const employees = empResult.employees as Employees[];

      const btrDataArr = await Promise.all(
        employees.map(async (emp) => {
          try {
            const btrRes = await fetch(`/api/timekeeping/records?employee_id=${emp.id}&month=${selectedMonth}`);
            const btrJson = await btrRes.json();
            
            const summaryRes = await fetch(`/api/timekeeping/monthlySummary?employee_id=${emp.id}&month=${selectedMonth}`);
            const summaryJson = await summaryRes.json();

            const hasRealTime = btrJson.success && btrJson.records.some((r: any) => (r.clock_in && r.clock_in !== '-') || (r.clock_out && r.clock_out !== '-'));
            const hasLeaves = summaryJson.success && summaryJson._debug && Object.keys(summaryJson._debug.leave_dates_map).length > 0;

            if (!hasRealTime && !hasLeaves) return null;

            const allDates: string[] = [];
            if (selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)) {
                const [year, month] = selectedMonth.split('-').map(Number);
                const daysInMonth = new Date(year, month, 0).getDate();
                for (let d = 1; d <= daysInMonth; d++) {
                    allDates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
                }
            }

            const recordMap: Record<string, any> = {};
            if (btrJson.success && Array.isArray(btrJson.records)) {
                btrJson.records.forEach((rec: any) => { recordMap[rec.date] = rec; });
            }

      const records = allDates.map(dateStr => {
        const rec = recordMap[dateStr];
        // Use time_in/time_out keys (and keep compatibility with computeMonthlyMetrics)
        return {
          ...(rec || {}),
          date: dateStr,
          time_in: rec?.clock_in || rec?.time_in || '-',
          time_out: rec?.clock_out || rec?.time_out || '-',
        };
      });

            // Compute total hours using the same logic as AttendanceCards
            const metrics = await computeMonthlyMetrics(emp as Employees, selectedMonth, records as TimeRecordLike[]);
            const totalHours = metrics.total_hours ?? 0;

            return {
              employee: emp,
              leaveDatesMap: summaryJson?._debug?.leave_dates_map || {},
              employeeName: formatFullName(emp.last_name, emp.first_name, emp.middle_name),
              role: emp.roles || '-',
              payPeriod: selectedMonth,
              records,
              totalHours,
              tardiness: summaryJson?.tardiness ?? 0,
              undertime: summaryJson?.undertime ?? 0,
              overtime: summaryJson?.overtime ?? 0,
              absences: summaryJson?.absences ?? 0,
            };
          } catch (err) {
            console.error(`Error fetching BTR for employee ${emp.id}:`, err);
            return null;
          }
        })
      );

      const filtered = btrDataArr.filter(Boolean);
      if (filtered.length === 0) {
        setBatchBTRError('No BTR data found for any employee.');
        setLoadingBatchBTRs(false);
        return;
      }

      try {
  const doc = <BTRBatchTemplate btrs={filtered as unknown as BTRItem[]} />;
        const asPdf = pdf(doc);
        const blob = await asPdf.toBlob();
        const url = URL.createObjectURL(blob);
        // Fire-and-forget audit log for batch BTR print
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
              employee_id: null,
              month: selectedMonth,
              details: { source: 'PrintAllDialog', employees: filtered.length },
            }),
          });
  } catch (e) { void e; }
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
      setBatchBTRError('An error occurred while fetching BTR data.');
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
                <Button className="w-full flex items-center gap-2 justify-center" variant="outline" onClick={handlePrintBTRAll} disabled={!selectedMonth || loadingBatchBTRs}>
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
