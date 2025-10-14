import React, { useState, useEffect, useRef, useMemo } from "react";
import { formatFullName } from "@/utils/formatFullName";
import { toast } from "sonner";
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
import DialogScrollArea from "./dialog-scroll-area";
import { EmployeeScheduleBadges } from "./employee-schedule-badges";

interface Props {
  employee: Employees | null;
  onClose: () => void;
}

interface TimeRecord {
  date: string; // YYYY-MM-DD
  time_in?: string | null;
  time_out?: string | null;
  clock_in?: string | null;
  clock_out?: string | null;
}

// Define the structure for the monthly summary response (including our debug info)
interface MonthlySummary {
  absences: number;
  _debug?: {
    // CHANGE 1: Update the debug structure to map date -> leave type
    // We assume the backend returns this structure now
    leave_dates_map: Record<string, string>; // e.g., { '2025-09-03': 'Paid Leave', '2025-09-05': 'Sick Leave' }
    leave_dates_in_month: string[]; // Keep for backward compatibility if needed, but the map is better
    // ... other debug fields
  };
  // Add other fields you might need later (e.g., tardiness, overtime)
}

// BTRDialog.tsx (around line 45, or anywhere outside the component)

const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

import { OBSERVANCE_COLOR_MAP, OBSERVANCE_PRETTY } from './observance-colors';

// Map some normalized leave strings to observance keys when possible
const LEAVE_TO_OBSERVANCE: Record<string, string> = {
  'Rainy Day': 'rainy-day',
  'Rainy-day': 'rainy-day',
  'Half-day': 'half-day',
  'Half Day': 'half-day',
  'Whole-day': 'whole-day',
  'Whole Day': 'whole-day',
};

const LEAVE_COLOR_MAP: Record<string, { bg: string; text: string; badge: string }> = {
  'Paid Leave': {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
    badge: 'bg-green-500/20 text-green-700 dark:text-green-300 dark:bg-green-900/50',
  },
  'Maternity Leave': {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 dark:bg-blue-900/50',
  },
  'Sick Leave': {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-300',
    badge: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 dark:bg-orange-900/50',
  },
  'Study Leave': {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-300',
    badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 dark:bg-purple-900/50',
  },
  // Default for any other type, or if debug data is corrupted
  'DEFAULT': {
    bg: 'bg-gray-100 dark:bg-gray-700/30',
    text: 'text-gray-800 dark:text-gray-300',
    badge: 'bg-gray-400/20 text-gray-700 dark:text-gray-300 dark:bg-gray-600/50',
  },
};

// ... (New data structure)
interface LeaveTypeData {
  type: string; // e.g., 'Paid Leave'
  date: string; // e.g., '2025-09-03'
}

export default function BTRDialog({ employee, onClose }: Props) {
  // Use YYYY-MM strings consistently
  const normalizeYm = (ym: string) => {
    const base = ym?.slice(0, 7) || "";
    const [y, m] = base.split("-");
    const yi = parseInt(y || "", 10);
    const mi = parseInt(m || "", 10);
    if (Number.isNaN(yi) || Number.isNaN(mi)) return base;
    return `${yi}-${String(mi).padStart(2, '0')}`;
  };

  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(normalizeYm(currentYm));
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [observanceMap, setObservanceMap] = useState<Record<string, { type?: string; label?: string; start_time?: string; is_automated?: boolean }>>({});

  // Loading state for skeleton and minimum loading time
  const [loading, setLoading] = useState(false);
  const [minLoading, setMinLoading] = useState(false);
  const minLoadingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch months
  useEffect(() => {
    if (!employee) return;
    fetch("/payroll/all-available-months")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.months)) {
          const normalized = (data.months as string[])
            .map((m) => normalizeYm(m))
            .filter(Boolean) as string[];
          setAvailableMonths(normalized);
          if (!selectedMonth) {
            if (normalized.length > 0) {
              setSelectedMonth(normalized[0]);
            } else {
              // Fallback to current month when API returns nothing
              setSelectedMonth(normalizeYm(currentYm));
            }
          }
        }
      })
      .catch(() => {
        // On failure, still allow user to pick current/recent months
        if (!selectedMonth) setSelectedMonth(normalizeYm(currentYm));
      });
  }, [employee]);

  // Fetch observances for the selected month to drive row highlighting
  useEffect(() => {
    if (!selectedMonth) {
      setObservanceMap({});
      return;
    }
    const [y, m] = selectedMonth.split('-');
    const monthPrefix = `${y}-${m.padStart(2, '0')}`;
    fetch('/observances')
      .then(res => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const map: Record<string, any> = {};
        for (const o of data) {
          const d = (o?.date || '').slice(0, 10);
          if (!d.startsWith(monthPrefix)) continue;
          map[d] = { type: o?.type, label: o?.label, start_time: o?.start_time, is_automated: o?.is_automated };
        }
        setObservanceMap(map);
        // Expose for quick debugging if needed
        (window as any).__BTR_DEBUG__ = { ...(window as any).__BTR_DEBUG__, observanceMap: map };
      })
      .catch(() => {});
  }, [selectedMonth]);

  // Fetch Timekeeping Records AND Monthly Summary (Absence/Leave Data)
  useEffect(() => {
    if (!employee || !selectedMonth) {
      setRecords([]);
      setMonthlySummary(null);
      return;
    }

    setLoading(true);
    setMinLoading(true);
    if (minLoadingTimeout.current) clearTimeout(minLoadingTimeout.current);
    minLoadingTimeout.current = setTimeout(() => setMinLoading(false), 400);

    const recordsPromise = fetch(`/api/timekeeping/records?employee_id=${employee.id}&month=${selectedMonth}`)
      .then((res) => res.json());

    const summaryPromise = fetch(`/api/timekeeping/monthlySummary?employee_id=${employee.id}&month=${selectedMonth}`)
      .then((res) => res.json());

    Promise.all([recordsPromise, summaryPromise])
      .then(([recordsData, summaryData]) => {
        // --- Handle Time Records ---
        if (Array.isArray(recordsData.records)) {
          setRecords(recordsData.records);
          // Only show error if no records AND the summary is empty too (less spammy)
        } else {
          setRecords([]);
        }

        // --- Handle Monthly Summary (for leave dates) ---
        if (summaryData.success) {
          setMonthlySummary(summaryData);

          // You can use this for quick console inspection of your debug data!
          // console.log("Monthly Summary Debug:", summaryData._debug);

        } else {
          setMonthlySummary(null);
          // Optional: toast.error("Failed to load monthly summary.");
        }
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        toast.error("An error occurred while fetching timekeeping data.");
      })
      .finally(() => setLoading(false));

    return () => {
      if (minLoadingTimeout.current) clearTimeout(minLoadingTimeout.current);
    };
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
  const recordMap: Record<string, TimeRecord> = useMemo(() => {
    const map: Record<string, TimeRecord> = {};
    records.forEach((rec) => {
      map[rec.date] = rec;
    });
    return map;
  }, [records]);

  // Change the name to reflect it's now a map
  const leaveDatesMap: Record<string, string> = useMemo(() => {
    // Check for the new debug property
    if (monthlySummary && monthlySummary._debug && monthlySummary._debug.leave_dates_map && typeof monthlySummary._debug.leave_dates_map === 'object') {
      return monthlySummary._debug.leave_dates_map;
    }
    return {}; // Return an empty object if data is missing or wrong type
  }, [monthlySummary]);

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
        <DialogScrollArea>
          {employee && (
            <div className="space-y-12 text-base mb-6">
              <div className="border-b pb-6 mb-2">
                <h3 className="text-2xl font-extrabold mb-1">
                  #{employee.id} - {formatFullName(employee.last_name, employee.first_name, employee.middle_name)}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-10 items-start mb-6">
                <div>
                  <h4 className="font-semibold text-base mb-4 border-b pb-2">General Information</h4>
                  <div className="space-y-2 text-sm">
                    <Info label="Status" value={employee.employee_status} />
                    <Info label="Type" value={employee.employee_type} />
                    <div className="mb-2">
                      <span className="text-xs text-muted-foreground">Schedule</span>
                      <EmployeeScheduleBadges workDays={employee.work_days || []} />
                    </div>
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
                  <div className="animate-pulse overflow-x-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full text-sm table-fixed border-separate border-spacing-0">
                      <colgroup>
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '120px' }} />
                      </colgroup>
                      <thead>
                        <tr className="bg-muted sticky top-0 z-10">
                          <th className="px-4 py-2 border-b font-semibold text-left rounded-tl-lg">Date</th>
                          <th className="px-4 py-2 border-b font-semibold text-left">Time In</th>
                          <th className="px-4 py-2 border-b font-semibold text-left rounded-tr-lg">Time Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: daysInMonth || 10 }, (_, i) => {
                          const isEven = i % 2 === 0;
                          return (
                            <tr
                              key={i}
                              className={
                                `${isEven ? "bg-gray-50 dark:bg-gray-900/40" : "bg-white dark:bg-gray-800/60"} ` +
                                "hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors group"
                              }
                            >
                              <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-mono text-xs group-hover:text-primary rounded-l-md">
                                <Skeleton className="h-4 w-24" />
                              </td>
                              <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-semibold group-hover:text-primary">
                                <Skeleton className="h-4 w-16" />
                              </td>
                              <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-semibold group-hover:text-primary rounded-r-md">
                                <Skeleton className="h-4 w-16" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : null}
              {!(loading || minLoading) && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full text-sm table-fixed border-separate border-spacing-0">
                      <colgroup>
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '120px' }} />
                      </colgroup>
                      <thead>
                        <tr className="bg-muted sticky top-0 z-10">
                          <th className="px-4 py-2 border-b font-semibold text-left rounded-tl-lg">Date</th>
                          <th className="px-4 py-2 border-b font-semibold text-left">Time In</th>
                          <th className="px-4 py-2 border-b font-semibold text-left rounded-tr-lg">Time Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1;
                          const dateStr = `${year}-${month.padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                          const rec = recordMap[dateStr];
                          const isEven = i % 2 === 0;

                          // --- UPDATED LOGIC FOR LEAVE & STYLING ---
                          const leaveType = leaveDatesMap[dateStr];
                          const isLeaveDay = !!leaveType;
                          // Observance for this date takes priority
                          const obs = observanceMap[dateStr];
                          const obsType = obs?.type as (keyof typeof OBSERVANCE_COLOR_MAP) | undefined;
                          let colors = LEAVE_COLOR_MAP.DEFAULT;
                          if (obsType && OBSERVANCE_COLOR_MAP[obsType]) {
                            colors = OBSERVANCE_COLOR_MAP[obsType];
                          } else if (isLeaveDay) {
                            const mapped = LEAVE_TO_OBSERVANCE[leaveType];
                            if (mapped && OBSERVANCE_COLOR_MAP[mapped]) {
                              colors = OBSERVANCE_COLOR_MAP[mapped];
                            } else {
                              colors = LEAVE_COLOR_MAP[leaveType] || LEAVE_COLOR_MAP.DEFAULT;
                            }
                          }

                          let rowClassName = isEven
                            ? "bg-gray-50 dark:bg-gray-900/40"
                            : "bg-white dark:bg-gray-800/60";
                          let textClassName = "";

                          const isHighlight = !!obsType || isLeaveDay;
                          if (isHighlight) {
                            rowClassName = colors.bg; // Use specific background color
                            textClassName = colors.text; // Use specific text color
                          }

                          const dateObj = new Date(dateStr);
                          const dayName = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : '';
                          const workDays = employee?.work_days || [];
                          const isWorkDay = workDays.some(workDay => DAY_LABELS[workDay.day] === dayName);
                          const isPaidLeaveDay = isLeaveDay && isWorkDay; // leave-based tag (fallback)
                          const showObservanceTag = !!obsType; // primary tag control
                          // --- END UPDATED LOGIC ---


                          return (
                            <tr
                              key={dateStr}
                              className={`${rowClassName} hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors group`}
                            >
                              <td className={`px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-mono text-xs rounded-l-md ${textClassName}`}>
                                {(() => {
                                  const displayText = `${dateStr}${dayName ? ` (${dayName})` : ''}`;

                                  // Display the leave badge with the specific type
                                  return (
                                    <>
                                      {displayText}
                                      {(showObservanceTag || isPaidLeaveDay) && (
                                        <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${colors.badge}`}>
                                          {(
                                            showObservanceTag
                                              ? (OBSERVANCE_PRETTY[obsType as string] || (obsType as string || '').replace('-', ' '))
                                              : leaveType
                                          ).toUpperCase()}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </td>

                              {/* === MODIFIED TIME IN COLUMN === */}
                              <td className={`px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-semibold rounded-md ${textClassName}`}>
                                {rec?.clock_in || rec?.time_in || "-"}
                              </td>

                              {/* === MODIFIED TIME OUT COLUMN === */}
                              <td className={`px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-semibold rounded-r-md ${textClassName}`}>
                                {rec?.clock_out || rec?.time_out || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogScrollArea>
        <DialogFooter className="flex-shrink-0">
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}