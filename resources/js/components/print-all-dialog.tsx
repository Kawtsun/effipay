import { formatFullName } from '../utils/formatFullName';
import React, { useState, useCallback } from 'react';
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
import { computeRatePerHourForEmployee } from '@/components/table-dialogs/dialog-components/timekeeping-data-provider';

// Local type matching BTRBatchTemplate's item shape
type BTRItem = {
  employee: Employees;
  leaveDatesMap: Record<string, string>;
  employeeName: string;
  role?: string;
  payPeriod?: string;
  records?: TimeRecordLike[];
  totalHours?: number | string;
  tardiness?: number | string;
  undertime?: number | string;
  overtime?: number | string;
  absences?: number | string;
};

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

  const fetchAvailableMonths = useCallback(async () => {
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
    } catch {
      // ignore
    }
  }, [selectedMonth]);

  React.useEffect(() => {
    if (open) {
      fetchAvailableMonths();
    }
  }, [open, fetchAvailableMonths]);

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
      } catch {
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
        }) => {
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
            // Fetch timekeeping records for metrics calculation
            let btrRecords: TimeRecordLike[] = [];
            try {
              const btrRes = await fetch(`/api/timekeeping/records?employee_id=${emp.id}&month=${selectedMonth}`);
              const btrJson = await btrRes.json();
              if (btrJson.success && Array.isArray(btrJson.records)) {
                btrRecords = btrJson.records.map((rec: Record<string, unknown>) => {
                  const r = rec as Record<string, unknown>;
                  const time_in = typeof r['clock_in'] === 'string' ? (r['clock_in'] as string)
                    : (typeof r['time_in'] === 'string' ? (r['time_in'] as string) : '-');
                  const time_out = typeof r['clock_out'] === 'string' ? (r['clock_out'] as string)
                    : (typeof r['time_out'] === 'string' ? (r['time_out'] as string) : '-');
                  return {
                    ...(rec as object),
                    time_in,
                    time_out,
                  } as TimeRecordLike;
                }) as TimeRecordLike[];
              }
            } catch {
              // ignore
            }
            // Fetch summary to get rate_per_hour and absences fallback for parity with cards
            let summary: { rate_per_hour?: number; absences?: number } | null = null;
            try {
              const summaryRes = await fetch(`/timekeeping/employee/monthly-summary?employee_id=${emp.id}&month=${selectedMonth}`);
              const summaryJson = await summaryRes.json();
              if (summaryJson?.success) summary = summaryJson;
            } catch {/* ignore */}
            // Calculate metrics using the same logic as AttendanceCards
            const metrics = await computeMonthlyMetrics(emp as Employees, selectedMonth, btrRecords as TimeRecordLike[], observances);
            const numHours = metrics.total_hours ?? 0;
            const rolesStr = (emp.roles || '').toLowerCase();
            const tokens = rolesStr.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
            const hasCollege = rolesStr.includes('college instructor') || rolesStr.includes('college');
            const isCollegeOnly = hasCollege && (tokens.length > 0 ? tokens.every(t => t.includes('college')) : true);
            // Get college_rate from payslip
            const collegeRate = result.payslip.college_rate ?? 0;
            // Resolve rate per hour for non-college (fallback to computed when missing)
            const ratePerHour = isCollegeOnly
              ? (collegeRate ?? 0)
              : (
                  (Number(summary?.rate_per_hour ?? 0) > 0 ? Number(summary?.rate_per_hour) : computeRatePerHourForEmployee(emp as Employees))
                );
            // Compose merged earnings (match single print logic)
            const mergedEarnings = {
              monthlySalary: result.payslip.base_salary,
              numHours: hasCollege ? numHours : undefined,
              totalHours: hasCollege ? numHours : undefined,
              ratePerHour,
              collegeRate: result.payslip.college_rate ?? 0,
              collegeGSP: isCollegeOnly && typeof numHours === 'number' && Number(result.payslip.college_rate ?? 0) > 0
                ? parseFloat((numHours * Number(result.payslip.college_rate)).toFixed(2))
                : undefined,
              honorarium: result.payslip.honorarium,
              // Use metrics for consistency
              tardiness: isCollegeOnly ? 0 : (metrics.tardiness ?? 0),
              tardinessAmount: isCollegeOnly ? 0 : (result.payslip.tardiness_amount ?? result.payslip.tardinessAmount),
              undertime: isCollegeOnly ? 0 : (metrics.undertime ?? 0),
              undertimeAmount: isCollegeOnly ? 0 : (result.payslip.undertime_amount ?? result.payslip.undertimeAmount),
              absences: (() => {
                const m = Number(metrics.absences ?? NaN);
                if (Number.isFinite(m) && m > 0) return m;
                const s = Number(summary?.absences ?? NaN);
                if (Number.isFinite(s) && s > 0) return s;
                return Number(result.payslip.absences ?? 0) || 0;
              })(),
              absencesAmount: (() => {
                const abs = (Number(metrics.absences ?? NaN) && Number(metrics.absences) > 0)
                  ? Number(metrics.absences)
                  : (Number(summary?.absences ?? NaN) && Number(summary?.absences) > 0 ? Number(summary?.absences) : Number(result.payslip.absences ?? 0));
                if (isCollegeOnly) return parseFloat(((abs || 0) * Number(collegeRate || 0)).toFixed(2));
                const rate = Number(ratePerHour) || 0;
                if (rate > 0) return parseFloat(((abs || 0) * rate).toFixed(2));
                return (result.payslip.absences_amount ?? result.payslip.absencesAmount);
              })(),
              overtime: isCollegeOnly ? 0 : (metrics.overtime ?? 0),
              overtime_hours: isCollegeOnly ? 0 : (metrics.overtime ?? result.payslip.overtime_hours ?? 0),
              overtime_pay_total: (() => {
                if (isCollegeOnly) return 0;
                const fromPayroll = Number(result.payslip.overtime_pay ?? 0);
                if (fromPayroll > 0) return fromPayroll;
                const rate = Number(ratePerHour) || 0;
                const weekdayOT = Number(metrics.overtime_count_weekdays ?? 0) || 0;
                const weekendOT = Number(metrics.overtime_count_weekends ?? 0) || 0;
                if (rate > 0) {
                  return parseFloat((rate * ((0.25 * weekdayOT) + (0.30 * weekendOT))).toFixed(2));
                }
                return 0;
              })(),
              overtime_count_weekdays: isCollegeOnly ? 0 : (metrics.overtime_count_weekdays ?? 0),
              overtime_count_weekends: isCollegeOnly ? 0 : (metrics.overtime_count_weekends ?? 0),
              gross_pay: result.payslip.gross_pay,
              net_pay: result.payslip.net_pay,
              adjustment: result.payslip.adjustment,
              overload: result.payslip.overload,
            };
            // Ensure amounts are numbers with two decimals where needed
            if (isCollegeOnly) {
              mergedEarnings.tardinessAmount = 0;
              mergedEarnings.undertimeAmount = 0;
              mergedEarnings.overtime_pay_total = 0;
            }
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
  } catch { /* ignore */ }
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

            const hasRealTime = btrJson.success && btrJson.records.some((r: Record<string, unknown>) => {
              const ci = typeof r['clock_in'] === 'string' ? (r['clock_in'] as string) : undefined;
              const co = typeof r['clock_out'] === 'string' ? (r['clock_out'] as string) : undefined;
              return (ci && ci !== '-') || (co && co !== '-');
            });
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

            const recordMap: Record<string, Record<string, unknown>> = {};
            if (btrJson.success && Array.isArray(btrJson.records)) {
                btrJson.records.forEach((rec: Record<string, unknown>) => {
                  const key = typeof rec['date'] === 'string' ? (rec['date'] as string) : '';
                  if (key) recordMap[key] = rec;
                });
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
            const rolesStr = (emp.roles || '').toLowerCase();
            const tokens = rolesStr.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
            const hasCollege = rolesStr.includes('college instructor') || rolesStr.includes('college');
            const isCollegeOnly = hasCollege && (tokens.length > 0 ? tokens.every(t => t.includes('college')) : true);

            return {
              employee: emp,
              leaveDatesMap: summaryJson?._debug?.leave_dates_map || {},
              employeeName: formatFullName(emp.last_name, emp.first_name, emp.middle_name),
              role: emp.roles || '-',
              payPeriod: selectedMonth,
              records,
              totalHours,
              tardiness: isCollegeOnly ? 0 : (metrics.tardiness ?? 0),
              undertime: isCollegeOnly ? 0 : (metrics.undertime ?? 0),
              overtime: isCollegeOnly ? 0 : (metrics.overtime ?? 0),
              absences: metrics.absences ?? 0,
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
