import * as React from "react";
import { toast } from "sonner";
import { Employees } from "@/types";

// Public types
export interface TimeRecord {
  date: string; // YYYY-MM-DD
  time_in?: string | null;
  time_out?: string | null;
  clock_in?: string | null;
  clock_out?: string | null;
  // Tolerate possible camelCase variants from API for extra safety
  timeIn?: string | null;
  timeOut?: string | null;
  clockIn?: string | null;
  clockOut?: string | null;
}

export interface MonthlySummaryDebug {
  // Map of date -> leave type (e.g. '2025-09-03': 'Paid Leave')
  leave_dates_map?: Record<string, string>;
  // Kept for backward compatibility if needed
  leave_dates_in_month?: string[];
  // ...other debug fields preserved as-is
  [key: string]: unknown;
}

export interface MonthlySummary {
  absences: number;
  _debug?: MonthlySummaryDebug;
  // ...add any other fields if UI needs them
  [key: string]: unknown;
}

// Augment window for debug exposure without using any
declare global {
  interface Window {
    __BTR_DEBUG__?: Record<string, unknown>;
  }
}

// Exported mapping for consumers that translate leave names to observance keys
// (mirrors mapping present in the existing BTR dialog)
export const LEAVE_TO_OBSERVANCE: Record<string, string> = {
  "Rainy Day": "rainy-day",
  "Rainy-day": "rainy-day",
  "Half-day": "half-day",
  "Half Day": "half-day",
  "Whole-day": "whole-day",
  "Whole Day": "whole-day",
};

export interface BtrDataRenderProps {
  // Calendar/month control
  selectedMonth: string;
  setSelectedMonth: React.Dispatch<React.SetStateAction<string>>;
  availableMonths: string[];
  // Data
  records: TimeRecord[];
  recordMap: Record<string, TimeRecord>;
  monthlySummary: MonthlySummary | null;
  observanceMap: Record<string, { type?: string; label?: string; start_time?: string; is_automated?: boolean }>;
  leaveDatesMap: Record<string, string>;
  // Loading flags (align with current dialog behavior)
  loading: boolean;       // current backend fetch in progress
  minLoading: boolean;    // minimum skeleton time hold flag
  isLoading: boolean;     // convenience: loading || minLoading
  // Helpers
  normalizeYm: (ym: string) => string;
  formatTime12Hour: (time?: string) => string;
}

export function normalizeYm(ym: string): string {
  const base = ym?.slice(0, 7) || "";
  const [y, m] = base.split("-");
  const yi = parseInt(y || "", 10);
  const mi = parseInt(m || "", 10);
  if (Number.isNaN(yi) || Number.isNaN(mi)) return base;
  return `${yi}-${String(mi).padStart(2, "0")}`;
}

export function formatTime12Hour(time?: string): string {
  if (!time) return "-";
  const t = String(time).trim();
  if (!t) return "-";

  // If already a 12-hour string (contains AM/PM), normalize and return
  if (/am|pm/i.test(t)) {
    const m = t.match(/^(\d{1,2})(?::(\d{1,2}))?(?::\d{1,2})?\s*(am|pm)$/i);
    if (m) {
      const h = parseInt(m[1], 10);
      const mm = (m[2] ?? "00").padStart(2, "0");
      const suf = m[3].toUpperCase();
      return `${h}:${mm} ${suf}`;
    }
    // Generic fallback: just ensure the space and uppercase suffix
    return t.replace(/\s*(am|pm)\s*$/i, (_, s) => ` ${String(s).toUpperCase()}`);
  }

  // Assume 24-hour like HH:MM(:SS?) -> convert to 12-hour
  const parts = t.split(":");
  const hours = Number(parts[0]);
  const minutesStr = (parts[1] ?? "0").replace(/\D/g, "");
  const minutes = Number(minutesStr);
  if (isNaN(hours) || isNaN(minutes)) {
    // As a last resort, show the original string rather than dash
    return t;
  }
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Provider that encapsulates BTR dialog data fetching and state logic
export function BtrDataProvider({
  employee,
  children,
}: {
  employee: Employees | null;
  children: (props: BtrDataRenderProps) => React.ReactNode;
}) {
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [availableMonths, setAvailableMonths] = React.useState<string[]>([]);

  const [records, setRecords] = React.useState<TimeRecord[]>([]);
  const [monthlySummary, setMonthlySummary] = React.useState<MonthlySummary | null>(null);
  const [observanceMap, setObservanceMap] = React.useState<
    Record<string, { type?: string; label?: string; start_time?: string; is_automated?: boolean }>
  >({});

  // Loading / skeleton timing (keep same behavior as the current dialog)
  const [loading, setLoading] = React.useState(false);
  const [minLoading, setMinLoading] = React.useState(false);
  const minLoadingTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toast guards to avoid duplicate notifications
  const monthsEmptyToastShownRef = React.useRef(false);
  const monthNoDataToastedRef = React.useRef<Set<string>>(new Set());

  // Fetch months
  React.useEffect(() => {
    if (!employee) return;
    const now = new Date();
    const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    fetch("/payroll/all-available-months")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.months)) {
          const normalized = (data.months as string[])
            .map((m) => normalizeYm(m))
            .filter(Boolean) as string[];
          setAvailableMonths(normalized);
          if (normalized.length > 0 && !selectedMonth) {
            setSelectedMonth(normalized[0]);
          } else if (normalized.length === 0) {
            // Fallback to current month when API returns nothing
            setSelectedMonth(normalizeYm(currentYm));
            if (!monthsEmptyToastShownRef.current) {
              toast.error("No available months to display.");
              monthsEmptyToastShownRef.current = true;
            }
          }
        }
      })
      .catch(() => {
        // On failure, still allow user to pick current/recent months
        if (!selectedMonth) setSelectedMonth(normalizeYm(currentYm));
      });
  }, [employee, selectedMonth]);

  // Fetch observances for the selected month to drive row highlighting
  React.useEffect(() => {
    if (!selectedMonth) {
      setObservanceMap({});
      return;
    }
    const [y, m] = selectedMonth.split("-");
    const monthPrefix = `${y}-${m.padStart(2, "0")}`;
    fetch("/observances")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const map: Record<string, { type?: string; label?: string; start_time?: string; is_automated?: boolean }> = {};
        for (const o of data) {
          const d = (o?.date || "").slice(0, 10);
          if (!d.startsWith(monthPrefix)) continue;
          map[d] = { type: o?.type, label: o?.label, start_time: o?.start_time, is_automated: o?.is_automated };
        }
        setObservanceMap(map);
        // Expose for quick debugging if needed
        window.__BTR_DEBUG__ = { ...(window.__BTR_DEBUG__ ?? {}), observanceMap: map };
      })
      .catch(() => {});
  }, [selectedMonth]);

  // Fetch Timekeeping Records AND Monthly Summary (Absence/Leave Data)
  React.useEffect(() => {
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
          // Canonicalize records to tolerate snake_case/camelCase and normalize date keys
          const pad2 = (n: number | string) => String(n).padStart(2, "0");
          const normDate = (s?: string): string | null => {
            if (!s) return null;
            const base = s.slice(0, 10);
            const [y, m, d] = base.split("-");
            const yi = parseInt(y || "", 10);
            const mi = parseInt(m || "", 10);
            const di = parseInt(d || "", 10);
            if (Number.isNaN(yi) || Number.isNaN(mi) || Number.isNaN(di)) return base;
            return `${yi}-${pad2(mi)}-${pad2(di)}`;
          };

          const canonical = (recordsData.records as Array<Record<string, unknown>>).map((r) => {
            const date = normDate(String(r?.date ?? "")) ?? String(r?.date ?? "");
            const clock_in = (r?.clock_in ?? r?.clockIn ?? r?.time_in ?? r?.timeIn ?? null) as string | null;
            const clock_out = (r?.clock_out ?? r?.clockOut ?? r?.time_out ?? r?.timeOut ?? null) as string | null;
            const time_in = (r?.time_in ?? r?.timeIn ?? r?.clock_in ?? r?.clockIn ?? null) as string | null;
            const time_out = (r?.time_out ?? r?.timeOut ?? r?.clock_out ?? r?.clockOut ?? null) as string | null;

            return { date, clock_in, clock_out, time_in, time_out } as TimeRecord;
          });
          setRecords(canonical);
          if (canonical.length === 0 && !monthNoDataToastedRef.current.has(selectedMonth)) {
            toast.error("No biometric records found for this month");
            monthNoDataToastedRef.current.add(selectedMonth);
          }
          // Expose for quick browser debugging
          if (typeof window !== "undefined") {
            const keys = canonical.map((r) => r.date);
            window.__BTR_DEBUG__ = { ...(window.__BTR_DEBUG__ ?? {}), recordsCount: canonical.length, recordDates: keys.slice(0, 10) };
          }
        } else {
          setRecords([]);
          if (!monthNoDataToastedRef.current.has(selectedMonth)) {
            toast.error("No biometric records found for this month");
            monthNoDataToastedRef.current.add(selectedMonth);
          }
        }

        // --- Handle Monthly Summary (for leave dates) ---
        if (summaryData?.success) {
          setMonthlySummary(summaryData);
        } else {
          setMonthlySummary(null);
        }
      })
      .catch(() => {
        setRecords([]);
        if (!monthNoDataToastedRef.current.has(selectedMonth)) {
          toast.error("No biometric records found for this month");
          monthNoDataToastedRef.current.add(selectedMonth);
        }
        setMonthlySummary(null);
      })
      .finally(() => setLoading(false));

    return () => {
      if (minLoadingTimeout.current) clearTimeout(minLoadingTimeout.current);
    };
  }, [employee, selectedMonth]);

  // Reset toast guards when employee changes
  React.useEffect(() => {
    monthsEmptyToastShownRef.current = false;
    monthNoDataToastedRef.current.clear();
  }, [employee?.id]);

  // Derived maps
  const recordMap = React.useMemo(() => {
    const pad2 = (n: number | string) => String(n).padStart(2, "0");
    const norm = (s?: string): string | null => {
      if (!s) return null;
      const base = s.slice(0, 10);
      const [y, m, d] = base.split("-");
      const yi = parseInt(y || "", 10);
      const mi = parseInt(m || "", 10);
      const di = parseInt(d || "", 10);
      if (Number.isNaN(yi) || Number.isNaN(mi) || Number.isNaN(di)) return base;
      return `${yi}-${pad2(mi)}-${pad2(di)}`;
    };

    const map: Record<string, TimeRecord> = {};
    for (const rec of records) {
      const k = norm(rec?.date);
      if (k) map[k] = rec;
    }
    return map;
  }, [records]);

  const leaveDatesMap = React.useMemo(() => {
    if (monthlySummary && monthlySummary._debug && typeof monthlySummary._debug.leave_dates_map === "object") {
      return (monthlySummary._debug.leave_dates_map as Record<string, string>) || {};
    }
    return {};
  }, [monthlySummary]);

  const isLoading = loading || minLoading;

  return (
    <>{children({
      selectedMonth,
      setSelectedMonth,
      availableMonths,
      records,
      recordMap,
      monthlySummary,
      observanceMap,
      leaveDatesMap,
      loading,
      minLoading,
      isLoading,
      normalizeYm,
      formatTime12Hour,
    })}</>
  );
}
