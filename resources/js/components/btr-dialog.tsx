import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Employees } from "@/types";
import { MonthRangePicker } from "./ui/month-range-picker";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { RolesBadges } from "./roles-badges";

interface Props {
  employee: Employees | null;
  onClose: () => void;
}

interface TimeRecord {
  date: string; // YYYY-MM-DD
  clock_in: string | null;
  clock_out: string | null;
}

export default function BTRDialog({ employee, onClose }: Props) {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  // const [loading, setLoading] = useState(false); // No longer used

  // Fetch months
  useEffect(() => {
    if (!employee) return;
    fetch("/payroll/all-available-months")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.months)) {
          setAvailableMonths(data.months);
          if (!selectedMonth && data.months.length > 0) {
            setSelectedMonth(data.months[0]);
          }
        }
      });
  }, [employee, selectedMonth]);

  // Loading state for skeleton and minimum loading time
  const [loading, setLoading] = useState(false);
  const [minLoading, setMinLoading] = useState(false);
  const minLoadingTimeout = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!employee || !selectedMonth) return;
    setLoading(true);
    setMinLoading(true);
    if (minLoadingTimeout.current) clearTimeout(minLoadingTimeout.current);
    minLoadingTimeout.current = setTimeout(() => setMinLoading(false), 400);
    fetch(`/api/timekeeping/records?employee_id=${employee.id}&month=${selectedMonth}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.records)) {
          setRecords(data.records);
        } else {
          setRecords([]);
        }
      })
      .finally(() => setLoading(false));
  }, [employee, selectedMonth]);

  // Generate days for the month
  const daysInMonth = selectedMonth
    ? new Date(
        parseInt(selectedMonth.split("-")[0]),
        parseInt(selectedMonth.split("-")[1]),
        0
      ).getDate()
    : 0;
  const year = selectedMonth ? selectedMonth.split("-")[0] : "";
  const month = selectedMonth ? selectedMonth.split("-")[1] : "";

  // Map records by date for quick lookup
  const recordMap: Record<string, TimeRecord> = {};
  records.forEach((rec) => {
    recordMap[rec.date] = rec;
  });

  // Helper for time formatting (copied from timekeeping-view-dialog)
  function formatTime12Hour(time?: string): string {
    if (!time) return '-';
    const parts = time.split(':');
    if (parts.length < 2) return '-';
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return '-';
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Import RolesBadges and Info from timekeeping-view-dialog
  // (Assume Info is a local helper, so redefine here)
  function Info({ label, value }: { label: string; value: string | number }) {
    return (
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium break-words">{value}</p>
      </div>
    );
  }

  return (
    <Dialog open={!!employee} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full px-8 py-4 sm:px-12 sm:py-6 z-[100] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold mb-2">Biometric Time Record</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 min-h-[700px]">
          {employee && (
            <div className="space-y-12 text-base mb-6">
              <div className="border-b pb-6 mb-2">
                <h3 className="text-2xl font-extrabold mb-1">
                  #{employee.id} - {`${employee.last_name}, ${employee.first_name} ${employee.middle_name}`.toLocaleUpperCase('en-US')}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-10 items-start mb-6">
                <div>
                  <h4 className="font-semibold text-base mb-4 border-b pb-2">General Information</h4>
                  <div className="space-y-2 text-sm">
                    <Info label="Status" value={employee.employee_status} />
                    <Info label="Type" value={employee.employee_type} />
                    <Info label="Schedule" value={
                      employee.work_start_time && employee.work_end_time && employee.work_hours_per_day
                        ? `${formatTime12Hour(employee.work_start_time)} - ${formatTime12Hour(employee.work_end_time)} (${employee.work_hours_per_day} hours)`
                        : '-'
                    } />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-base mb-4 border-b pb-2">Roles & Responsibilities</h4>
                  <div className="flex flex-wrap gap-3 max-w-full px-2 py-2 break-words whitespace-pre-line min-h-[2.5rem] text-sm">
                    <RolesBadges roles={employee.roles} employee={employee} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
          <div className="flex items-center justify-end gap-2 mb-6">
            <MonthRangePicker
              value={selectedMonth}
              onValueChange={setSelectedMonth}
              availableMonths={availableMonths}
              className="w-56 min-w-0 px-2 py-1 text-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <AnimatePresence mode="wait">
              {(loading || minLoading) ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <table className="min-w-full border text-sm table-fixed">
                    <colgroup>
                      <col style={{ width: '140px' }} />
                      <col style={{ width: '120px' }} />
                      <col style={{ width: '120px' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-2 py-1 border">Date</th>
                        <th className="px-2 py-1 border">Clock In</th>
                        <th className="px-2 py-1 border">Clock Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: daysInMonth || 10 }, (_, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1 border"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-2 py-1 border"><Skeleton className="h-4 w-16" /></td>
                          <td className="px-2 py-1 border"><Skeleton className="h-4 w-16" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <table className="min-w-full border text-sm table-fixed">
                    <colgroup>
                      <col style={{ width: '140px' }} />
                      <col style={{ width: '120px' }} />
                      <col style={{ width: '120px' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-2 py-1 border">Date</th>
                        <th className="px-2 py-1 border">Clock In</th>
                        <th className="px-2 py-1 border">Clock Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${month.padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const rec = recordMap[dateStr];
                        return (
                          <tr key={dateStr}>
                            <td className="px-2 py-1 border">{dateStr}</td>
                            <td className="px-2 py-1 border">{rec?.clock_in || "-"}</td>
                            <td className="px-2 py-1 border">{rec?.clock_out || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button type="button" onClick={onClose} variant="secondary">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
