import React from "react";
import { toast } from "sonner";
import type { Employees } from "@/types";
import type { WorkDayTime } from "@/components/employee-schedule-badges";

export type TimeKeepingMetrics = {
  tardiness: number;
  undertime: number;
  overtime: number;
  absences: number;
  overtime_count_weekdays: number;
  overtime_count_weekends: number;
  overtime_count_observances: number;
  total_hours: number;
  // College-paid hours: attendance counted only within college schedule windows
  college_paid_hours?: number;
  // Added pay context so UI can compute peso values consistently
  rate_per_hour?: number;
  rate_per_day?: number;
  college_rate?: number;
  // Server-computed totals that include NSD adjustments when available
  overtime_pay_total?: number;
  nsd_hours?: number;
  nsd_pay_total?: number;
};

export type ObservanceMap = Record<string, { type?: string; start_time?: string }>;

export type TimeKeepingDataRenderProps = {
  selectedMonth: string;
  pendingMonth: string;
  availableMonths: string[];
  records: Array<Record<string, unknown>>;
  observanceMap: ObservanceMap;
  computed: TimeKeepingMetrics | null;
  isLoading: boolean;
  handleMonthChange: (month: string) => void;
  setSelectedMonth: React.Dispatch<React.SetStateAction<string>>;
  setPendingMonth: React.Dispatch<React.SetStateAction<string>>;
};

/**
 * TimeKeepingDataProvider
 *
 * A render-prop component that encapsulates the timekeeping data fetching
 * (records, available months, observances) and metrics computation logic.
 *
 * Logic is ported from the existing TimeKeepingViewDialog to keep behavior identical
 * while cleaning up the parent dialog's JSX. No business logic has been changed.
 */
export function TimeKeepingDataProvider({
  employee,
  children,
}: {
  employee: Employees | null;
  children: (props: TimeKeepingDataRenderProps) => React.ReactNode;
}) {
  const [selectedMonth, setSelectedMonth] = React.useState("");
  const [pendingMonth, setPendingMonth] = React.useState("");

  const [availableMonths, setAvailableMonths] = React.useState<string[]>([]);
  // Records fetched from backend (BTR/biometric)
  const [records, setRecords] = React.useState<Array<Record<string, unknown>>>([]);
  // Observances map keyed by YYYY-MM-DD
  const [observanceMap, setObservanceMap] = React.useState<ObservanceMap>({});
  // Store the computed metrics from the backend API
  const [apiMetrics, setApiMetrics] = React.useState<TimeKeepingMetrics | null>(null);
  // Minimal monthly summary rates (used for college fallback)
  const [summaryRates, setSummaryRates] = React.useState<{
    rate_per_hour?: number;
    college_rate?: number;
    overtime_pay_total?: number;
    nsd_hours?: number;
    nsd_pay_total?: number;
  } | null>(null);

  // Loading flags for skeleton control
  const [recordsLoading, setRecordsLoading] = React.useState(false);
  const [observancesLoading, setObservancesLoading] = React.useState(false);
  const [leavesLoading, setLeavesLoading] = React.useState(false);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [displayLoading, setDisplayLoading] = React.useState(false);
  const loadingStartRef = React.useRef<number | null>(null);
  const MIN_SKELETON_MS = 400;

  // Toast guards to prevent duplicate notifications
  const monthsEmptyToastShownRef = React.useRef(false);
  const monthNoDataToastedRef = React.useRef<Set<string>>(new Set());

  // Fetch records for employee + month
  React.useEffect(() => {
    if (!employee || !selectedMonth) return;
    setRecordsLoading(true);

    fetch(`/api/timekeeping/records?employee_id=${employee.id}&month=${selectedMonth}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.records)) {
          setRecords(data.records);
          // Notify once per month if no records returned
          if (data.records.length === 0 && !monthNoDataToastedRef.current.has(selectedMonth)) {
            toast.error("No timekeeping data found for this month");
            monthNoDataToastedRef.current.add(selectedMonth);
          }
        } else {
          setRecords([]);
          if (!monthNoDataToastedRef.current.has(selectedMonth)) {
            toast.error("No timekeeping data found for this month");
            monthNoDataToastedRef.current.add(selectedMonth);
          }
        }
      })
      .catch(() => {
        setRecords([]);
        if (!monthNoDataToastedRef.current.has(selectedMonth)) {
          toast.error("No timekeeping data found for this month");
          monthNoDataToastedRef.current.add(selectedMonth);
        }
      })
      .finally(() => setRecordsLoading(false));
  }, [employee, selectedMonth]);

  // Fetch observances and reduce to a map for the selectedMonth
  React.useEffect(() => {
    if (!selectedMonth) return;
    (async () => {
      setObservancesLoading(true);
      try {
        const res = await fetch("/observances");
        const payload = await res.json();
        const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.observances) ? payload.observances : []);
        const map: ObservanceMap = {};
        for (const o of arr) {
          const d = (o?.date || "").slice(0, 10);
          if (!d || d.slice(0, 7) !== selectedMonth) continue;
          map[d] = { type: o?.type || o?.label, start_time: o?.start_time };
        }
        setObservanceMap(map);
      } catch (e) {
        console.error("Failed to fetch observances", e);
        setObservanceMap({});
      } finally {
        setObservancesLoading(false);
      }
    })();
  }, [selectedMonth]);

  // Fetch leaves and build a set of leave dates within the selected month
  const [leaveDatesSet, setLeaveDatesSet] = React.useState<Record<string, true>>({});
  React.useEffect(() => {
    if (!employee || !selectedMonth) {
      setLeaveDatesSet({});
      return;
    }
    (async () => {
      setLeavesLoading(true);
      try {
        const res = await fetch(`/api/leaves?employee_id=${employee.id}`);
        const json = await res.json();
        const rows: Array<{ leave_start_day?: string; leave_end_day?: string | null }> = Array.isArray(json?.leaves) ? json.leaves : [];
        const monthStart = `${selectedMonth}-01`;
        const [y, m] = selectedMonth.split('-').map((v) => parseInt(v, 10));
        const monthEnd = new Date(y, m, 0); // last day of month
        const monthEndStr = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;
        const toDate = (s: string) => new Date(`${s}T00:00:00`);
        const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

        const set: Record<string, true> = {};
        for (const r of rows) {
          const startStr = (r?.leave_start_day || '').slice(0, 10);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(startStr)) continue;
          const endStrRaw = (r?.leave_end_day || '').slice(0, 10);
          const startBounded = cmp(startStr, monthStart) < 0 ? monthStart : startStr;
          const endBounded = endStrRaw && /^\d{4}-\d{2}-\d{2}$/.test(endStrRaw)
            ? (cmp(endStrRaw, monthEndStr) > 0 ? monthEndStr : endStrRaw)
            : monthEndStr; // open-ended -> cap to month end

          // Expand dates from startBounded..endBounded
          let cur = toDate(startBounded);
          const last = toDate(endBounded);
          for (; cur <= last; cur.setDate(cur.getDate() + 1)) {
            const d = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
            if (d.startsWith(selectedMonth)) set[d] = true;
          }
        }
        setLeaveDatesSet(set);
      } catch (e) {
        console.error('Failed to fetch leaves', e);
        setLeaveDatesSet({});
      } finally {
        setLeavesLoading(false);
      }
    })();
  }, [employee?.id, selectedMonth]);

  // Fetch distinct months present in timekeeping records
  const fetchAvailableMonths = React.useCallback(async () => {
    try {
      const response = await fetch("/timekeeping/available-months");
      const result = await response.json();
      if (result.success) {
        setAvailableMonths(result.months);
        if (result.months.length > 0 && !selectedMonth) {
          setSelectedMonth(result.months[0]);
          setPendingMonth(result.months[0]);
        } else if (result.months.length === 0 && !monthsEmptyToastShownRef.current) {
          // Mirror ReportView behavior when no months are available
          toast.error("No available months to display.");
          monthsEmptyToastShownRef.current = true;
        }
      }
    } catch (error) {
      console.error("Error fetching available months:", error);
    }
  }, [selectedMonth]);

  React.useEffect(() => {
    if (employee) fetchAvailableMonths();
  }, [employee, fetchAvailableMonths]);

  // Reset toast guards when employee changes
  React.useEffect(() => {
    monthsEmptyToastShownRef.current = false;
    monthNoDataToastedRef.current.clear();
  }, [employee?.id]);

  // Fetch monthly summary from backend API (unified calculation)
  React.useEffect(() => {
    if (!employee || !selectedMonth) {
      setSummaryRates(null);
      setApiMetrics(null);
      return;
    }
    setSummaryLoading(true);
    try {
      const url = typeof route === 'function'
        ? route("timekeeping.employee.monthly-summary", { employee_id: employee.id, month: selectedMonth })
        : `/timekeeping/employee/${employee.id}/monthly-summary?month=${encodeURIComponent(selectedMonth)}`;
      fetch(url)
        .then((r) => r.json())
        .then((res) => {
          if (res && res.success) {
            const rh = typeof res.rate_per_hour === 'number' ? res.rate_per_hour
              : (typeof res.rate_per_hour === 'string' && res.rate_per_hour !== '' ? Number(res.rate_per_hour) : undefined);
            const cr = typeof res.college_rate === 'number' ? res.college_rate
              : (typeof res.college_rate === 'string' && res.college_rate !== '' ? Number(res.college_rate) : undefined);
            const otTotal = typeof res.overtime_pay_total === 'number' ? res.overtime_pay_total
              : (typeof res.overtime_pay_total === 'string' && res.overtime_pay_total !== '' ? Number(res.overtime_pay_total) : undefined);
            const nsdHours = typeof res.nsd_hours === 'number' ? res.nsd_hours
              : (typeof res.nsd_hours === 'string' && res.nsd_hours !== '' ? Number(res.nsd_hours) : undefined);
            const nsdPay = typeof res.nsd_pay_total === 'number' ? res.nsd_pay_total
              : (typeof res.nsd_pay_total === 'string' && res.nsd_pay_total !== '' ? Number(res.nsd_pay_total) : undefined);
            setSummaryRates({ rate_per_hour: rh, college_rate: cr, overtime_pay_total: otTotal, nsd_hours: nsdHours, nsd_pay_total: nsdPay });
            
            // Use backend-computed metrics instead of frontend calculation
            setApiMetrics({
              tardiness: Number(res.tardiness) || 0,
              undertime: Number(res.undertime) || 0,
              overtime: Number(res.overtime) || 0,
              absences: Number(res.absences) || 0,
              overtime_count_weekdays: Number(res.overtime_count_weekdays) || 0,
              overtime_count_weekends: Number(res.overtime_count_weekends) || 0,
              overtime_count_observances: Number(res.overtime_count_observances) || 0,
              total_hours: Number(res.total_hours) || 0,
              college_paid_hours: res.college_paid_hours != null ? Number(res.college_paid_hours) : undefined,
              rate_per_hour: rh,
              college_rate: cr,
              overtime_pay_total: otTotal,
              nsd_hours: nsdHours,
              nsd_pay_total: nsdPay,
            });
          } else {
            setSummaryRates(null);
            setApiMetrics(null);
          }
        })
        .catch(() => {
          setSummaryRates(null);
          setApiMetrics(null);
        })
        .finally(() => setSummaryLoading(false));
    } catch {
      setSummaryRates(null);
      setApiMetrics(null);
      setSummaryLoading(false);
    }
  }, [employee, selectedMonth]);

  const handleMonthChange = (month: string) => {
    if (month !== selectedMonth) {
      setSelectedMonth(month);
      setPendingMonth(month);
    }
  };

  // Manage displayed skeleton with a small minimum duration to prevent flicker
  const anyBackendLoading = !selectedMonth || recordsLoading || observancesLoading || leavesLoading || summaryLoading;
  React.useEffect(() => {
    if (anyBackendLoading) {
      if (!displayLoading) {
        loadingStartRef.current = performance.now();
        setDisplayLoading(true);
      }
      return;
    }
    // If loading just finished, ensure minimum display time
    const startedAt = loadingStartRef.current;
    if (startedAt == null) {
      setDisplayLoading(false);
      return;
    }
    const elapsed = performance.now() - startedAt;
    if (elapsed >= MIN_SKELETON_MS) {
      setDisplayLoading(false);
      loadingStartRef.current = null;
    } else {
      const remaining = MIN_SKELETON_MS - elapsed;
      const t = setTimeout(() => {
        setDisplayLoading(false);
        loadingStartRef.current = null;
      }, remaining);
      return () => clearTimeout(t);
    }
  }, [anyBackendLoading, displayLoading]);

  // ---------- Use backend API metrics instead of frontend calculation ----------
  // This ensures timekeeping dialog and report dialog stay in sync
  const computed: TimeKeepingMetrics | null = apiMetrics;

  return (
    <>{children({
      selectedMonth,
      pendingMonth,
      availableMonths,
      records,
      observanceMap,
      computed,
      isLoading: displayLoading,
      handleMonthChange,
      setSelectedMonth,
      setPendingMonth,
    })}</>
  );
}

// Optional utility helpers often used alongside the metrics
export function formatTime12Hour(time?: string): string {
  if (!time) return "-";
  const parts = time.split(":");
  if (parts.length < 2) return "-";
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (isNaN(hours) || isNaN(minutes)) return "-";
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function formatNumberWithCommasAndFixed(num: number | string, decimals = 2): string {
  if (num === null || num === undefined) return "-";
  const n = typeof num === "string" ? Number(num) : num;
  if (isNaN(n)) return "-";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Helper exported for callers that need a standalone hourly-rate computation
export function computeRatePerHourForEmployee(employee: Employees | null): number {
  if (!employee) return 0;
  const rolesStr = String(employee.roles ?? "").toLowerCase();
  const isCollege = rolesStr.includes("college instructor");
  if (isCollege) {
    return Number(employee.college_rate ?? 0) || 0;
  }
  const baseSalary = Number(employee.base_salary ?? 0) || 0;
  const honorarium = Number(employee.honorarium ?? 0) || 0;
  const monthly = baseSalary + honorarium;
  // Use 262 divisor for Basic Education roles, 288 for others
  const isBasicEducation = rolesStr.includes('basic education');
  const divisor = isBasicEducation ? 262 : 288;
  const ratePerDay = (monthly * 12) / divisor;
  // Try to infer hours per day from the first valid work_day; fallback to 8
  const wd: WorkDayTime[] = Array.isArray(employee.work_days) ? employee.work_days! : [];
  const hmToMin = (t?: string) => {
    if (!t) return NaN;
    const parts = t.split(":");
    if (parts.length < 2) return NaN;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
    return h * 60 + m;
  };
  let hoursPerDay = 8;
  for (const w of wd) {
    const start = hmToMin(w.work_start_time || undefined);
    const end = hmToMin(w.work_end_time || undefined);
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      let d = end - start;
      if (d <= 0) d += 24 * 60; // overnight
      const durationMin = Math.max(0, d - 60);
      hoursPerDay = Math.max(1, Math.round((durationMin / 60) * 100) / 100);
      break;
    }
  }
  return Number(((ratePerDay) / (hoursPerDay || 8)).toFixed(2));
}
