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
    // ... (existing implementation)
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
                return {
                    date: dateStr,
                    timeIn: rec?.clock_in || rec?.time_in || '-',
                    timeOut: rec?.clock_out || rec?.time_out || '-',
                };
            });

            const totalHours =
              typeof summaryJson?.total_hours === 'number'
                ? summaryJson.total_hours
                : (() => {
                    let totalWorkedHours = 0;
                    if (Array.isArray(records) && emp.work_hours_per_day) {
                      const attendedShifts = records.filter(
                        (rec) => rec.timeIn !== '-' || rec.timeOut !== '-'
                      ).length;
                      totalWorkedHours = attendedShifts * emp.work_hours_per_day;
                    }
                    return totalWorkedHours
                      - (Number(summaryJson?.tardiness ?? 0))
                      - (Number(summaryJson?.undertime ?? 0))
                      - (Number(summaryJson?.absences ?? 0))
                      + (Number(summaryJson?.overtime ?? 0));
                  })();

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
        const doc = <BTRBatchTemplate btrs={filtered as any[]} />;
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
