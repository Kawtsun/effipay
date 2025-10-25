import React from "react";
import type { Employees } from "@/types";

export type TimeKeepingMetrics = {
  tardiness: number;
  undertime: number;
  overtime: number;
  absences: number;
  overtime_count_weekdays: number;
  overtime_count_weekends: number;
  total_hours: number;
};

export type ObservanceMap = Record<string, { type?: string; start_time?: string }>;

export type TimeKeepingDataRenderProps = {
  selectedMonth: string;
  pendingMonth: string;
  availableMonths: string[];
  records: Array<Record<string, unknown>>;
  observanceMap: ObservanceMap;
  computed: TimeKeepingMetrics | null;
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

  const recordsMinLoadingTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch records for employee + month
  React.useEffect(() => {
    if (!employee || !selectedMonth) return;
    if (recordsMinLoadingTimeout.current) clearTimeout(recordsMinLoadingTimeout.current);
    recordsMinLoadingTimeout.current = setTimeout(() => {}, 400);

    fetch(`/api/timekeeping/records?employee_id=${employee.id}&month=${selectedMonth}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.records)) {
          setRecords(data.records);
        } else {
          setRecords([]);
        }
      })
      .catch(() => setRecords([]));
  }, [employee, selectedMonth]);

  // Fetch observances and reduce to a map for the selectedMonth
  React.useEffect(() => {
    if (!selectedMonth) return;
    (async () => {
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
      }
    })();
  }, [selectedMonth]);

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
        }
      }
    } catch (error) {
      console.error("Error fetching available months:", error);
    }
  }, [selectedMonth]);

  React.useEffect(() => {
    if (employee) fetchAvailableMonths();
  }, [employee, fetchAvailableMonths]);

  const handleMonthChange = (month: string) => {
    if (month !== selectedMonth) {
      setSelectedMonth(month);
      setPendingMonth(month);
    }
  };

  // ---------- Compute metrics from BTR + schedule ----------
  const computed: TimeKeepingMetrics | null = React.useMemo(() => {
    if (!employee || !selectedMonth) return null;
    type WorkDay = {
      day: string;
      work_start_time?: string | null;
      work_end_time?: string | null;
      work_hours?: number | null;
      role?: string | null;
    };
    const workDaysRaw: unknown = (employee as unknown as { work_days?: unknown }).work_days;
    const workDays: WorkDay[] = Array.isArray(workDaysRaw)
      ? (workDaysRaw as Array<Record<string, unknown>>).map((wd) => ({
          day: String(wd?.day ?? ""),
          work_start_time: (wd?.work_start_time as string | null | undefined) ?? undefined,
          work_end_time: (wd?.work_end_time as string | null | undefined) ?? undefined,
          work_hours: (wd?.work_hours as number | null | undefined) ?? undefined,
          role: (wd?.role as string | null | undefined) ?? undefined,
        }))
      : [];

    // Build schedule map by weekday code (mon..sun)
    const schedByCode: Record<string, { start: number; end: number; durationMin: number }> = {};
    const hmToMin = (t?: string) => {
      if (!t) return NaN;
      const parts = t.split(":");
      if (parts.length < 2) return NaN;
      const h = Number(parts[0]);
      const m = Number(parts[1]);
      if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
      return h * 60 + m;
    };
    const diffMin = (startMin: number, endMin: number) => {
      let d = endMin - startMin;
      if (d <= 0) d += 24 * 60; // overnight handling
      return d;
    };
    const codeFromDate = (d: Date) => {
      const idx = d.getDay(); // 0..6 Sun..Sat
      return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][idx];
    };
    const parseClock = (raw?: unknown): number => {
      if (!raw || typeof raw !== "string") return NaN;
      const s = raw.trim();
      // Accept 'HH:mm', 'HH:mm:ss', 'h:mm AM/PM'
      const ampmMatch = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)$/i);
      if (ampmMatch) {
        let h = Number(ampmMatch[1]);
        const m = Number(ampmMatch[2]);
        const ap = ampmMatch[3].toUpperCase();
        if (ap === "PM" && h < 12) h += 12;
        if (ap === "AM" && h === 12) h = 0;
        return h * 60 + m;
      }
      const hmMatch = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
      if (hmMatch) {
        const h = Number(hmMatch[1]);
        const m = Number(hmMatch[2]);
        return h * 60 + m;
      }
      return NaN;
    };

    for (const wd of workDays) {
      const start = hmToMin(wd.work_start_time || undefined);
      const end = hmToMin(wd.work_end_time || undefined);
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      const raw = diffMin(start, end);
      const durationMin = Math.max(0, raw - 60); // minus 1 hour break to match schedule display
      schedByCode[wd.day] = { start, end, durationMin };
    }

    // Map records by date
    const map: Record<string, { clock_in?: string | null; clock_out?: string | null; time_in?: string | null; time_out?: string | null }> = {};
    for (const r of records) {
      const rec = r as Record<string, unknown>;
      const rd = typeof rec.date === "string" ? rec.date : undefined;
      if (rd) {
        map[rd] = {
          clock_in: (rec.clock_in as string | null | undefined) ?? undefined,
          clock_out: (rec.clock_out as string | null | undefined) ?? undefined,
          time_in: (rec.time_in as string | null | undefined) ?? undefined,
          time_out: (rec.time_out as string | null | undefined) ?? undefined,
        };
      }
    }

    const [yStr, mStr] = selectedMonth.split("-");
    const y = Number(yStr), m = Number(mStr);
    if (!y || !m) return null;
    const daysInMonth = new Date(y, m, 0).getDate();

    let tardMin = 0;
    let underMin = 0;
    let absentMin = 0;
    let otMin = 0;
    let otWeekdayMin = 0;
    let otWeekendMin = 0;
    let totalWorkedMin = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yStr}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const d = new Date(`${dateStr}T00:00:00`);
      const code = codeFromDate(d);
      const sched = schedByCode[code];
      const rec = map[dateStr];
      const timeIn = parseClock(rec?.clock_in ?? rec?.time_in);
      const timeOut = parseClock(rec?.clock_out ?? rec?.time_out);

      const hasBoth = !Number.isNaN(timeIn) && !Number.isNaN(timeOut);
      if (sched) {
        // Scheduled day with potential observance adjustments
        const workedRaw = hasBoth ? diffMin(timeIn, timeOut) : 0;
        const obs = observanceMap[dateStr];
        const obsType = obs?.type?.toLowerCase?.() || "";

        // WHOLE-DAY: No absences/tardy/undertime; any work counts as overtime (weekend bucket)
        if (obsType.includes("whole")) {
          const workedMinusBreak = hasBoth ? Math.max(0, workedRaw - 60) : 0;
          totalWorkedMin += workedMinusBreak;
          if (hasBoth) {
            otMin += workedMinusBreak;
            otWeekendMin += workedMinusBreak;
          }
          continue;
        }

        // HALF-DAY: suspension starts at provided time; expectation ends there; overtime after that
        if (obsType.includes("half")) {
          const suspMinVal = hmToMin(obs?.start_time);
          const suspMin = Number.isNaN(suspMinVal) ? 12 * 60 : suspMinVal; // default 12:00
          const expectedEnd = Math.max(sched.start, Math.min(suspMin, sched.end));
          const expectedDuration = Math.max(0, expectedEnd - sched.start);

          if (!hasBoth) {
            absentMin += expectedDuration;
            continue;
          }

          // Morning work (no lunch break deduction for half-day expectation)
          totalWorkedMin += workedRaw;
          const tard = Math.max(0, timeIn - sched.start);
          const under = Math.max(0, expectedEnd - timeOut);
          const over = Math.max(0, timeOut - Math.max(timeIn, expectedEnd));

          tardMin += tard;
          underMin += under;
          otMin += over;
          otWeekdayMin += over;
          continue;
        }

        // Default or RAINY-DAY behavior
        const workedMinusBreak = hasBoth ? Math.max(0, workedRaw - 60) : 0;
        totalWorkedMin += workedMinusBreak;

        if (!hasBoth) {
          absentMin += sched.durationMin;
          continue;
        }

        // Tardiness: rainy-day 1-hour grace; if beyond grace, base from original start
        let tard: number;
        if (obsType.includes("rainy")) {
          const graceEnd = sched.start + 60;
          tard = timeIn <= graceEnd ? 0 : Math.max(0, timeIn - sched.start);
        } else {
          tard = Math.max(0, timeIn - sched.start);
        }

        const under = Math.max(0, sched.end - timeOut);
        const over = Math.max(0, workedMinusBreak - sched.durationMin);

        tardMin += tard;
        underMin += under;
        otMin += over;
        otWeekdayMin += over;
      } else {
        // Not scheduled day (weekend or off)
        if (hasBoth) {
          const workedRaw = diffMin(timeIn, timeOut);
          const workedMinusBreak = Math.max(0, workedRaw - 60);
          totalWorkedMin += workedMinusBreak;
          otMin += workedMinusBreak;
          otWeekendMin += workedMinusBreak;
        }
      }
    }

    const toH = (min: number) => Number((min / 60).toFixed(2));
    return {
      tardiness: toH(tardMin),
      undertime: toH(underMin),
      overtime: toH(otMin),
      absences: toH(absentMin),
      overtime_count_weekdays: toH(otWeekdayMin),
      overtime_count_weekends: toH(otWeekendMin),
      total_hours: toH(totalWorkedMin),
    };
  }, [employee, records, selectedMonth, observanceMap]);

  return (
    <>{children({
      selectedMonth,
      pendingMonth,
      availableMonths,
      records,
      observanceMap,
      computed,
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
