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
  // Minimal monthly summary rates (used for college fallback)
  const [summaryRates, setSummaryRates] = React.useState<{
    rate_per_hour?: number;
    college_rate?: number;
  } | null>(null);

  // Loading flags for skeleton control
  const [recordsLoading, setRecordsLoading] = React.useState(false);
  const [observancesLoading, setObservancesLoading] = React.useState(false);
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

  // Fetch monthly summary (for college rate fallback parity with old dialog)
  React.useEffect(() => {
    if (!employee || !selectedMonth) {
      setSummaryRates(null);
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
            setSummaryRates({ rate_per_hour: rh, college_rate: cr });
          } else {
            setSummaryRates(null);
          }
        })
        .catch(() => setSummaryRates(null))
        .finally(() => setSummaryLoading(false));
    } catch {
      setSummaryRates(null);
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
  const anyBackendLoading = !selectedMonth || recordsLoading || observancesLoading || summaryLoading;
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
    // Determine role context up-front for special handling
    const rolesStr = String(employee.roles ?? "").toLowerCase();
    const roleTokens = rolesStr.split(/[\,\n]+/).map((s) => s.trim()).filter(Boolean);
  const isCollege = rolesStr.includes("college instructor");
  const isCollegeOnly = isCollege && (roleTokens.length > 0 ? roleTokens.every((t) => t.includes("college instructor")) : true);
  // Multi-role employee who also has a College Instructor role
  const isCollegeMulti = isCollege && !isCollegeOnly;
    const workDaysRaw: unknown = (employee as { work_days?: WorkDayTime[] | unknown }).work_days;
    const workDays: WorkDay[] = Array.isArray(workDaysRaw)
      ? (workDaysRaw as Array<WorkDayTime>).map((wd) => ({
          day: String(wd?.day ?? ""),
          work_start_time: (wd?.work_start_time as string | null | undefined) ?? undefined,
          work_end_time: (wd?.work_end_time as string | null | undefined) ?? undefined,
          work_hours: (wd?.work_hours as number | null | undefined) ?? undefined,
          role: (wd?.role as string | null | undefined) ?? undefined,
        }))
      : [];

  // Build schedule map by weekday code (mon..sun)
  // When schedules come from college program hours (no start/end), mark noTimes=true and carry duration only.
  // Also tag entries that originate from a College Instructor role so we can treat deficits as Absences for multi-role.
  const schedByCode: Record<string, {
      // Merged admin span primarily for tardy/under computation
      start: number; end: number; durationMin: number;
      // Flag for days that only have program hours without explicit times
      noTimes?: boolean;
      // True if any time-based window on the day is flagged college
      isCollege?: boolean;
      // Program hours-only extra minutes for college on that day
      extraCollegeDurMin?: number;
      // Keep granular windows to compute overlap precisely
      timeWindows?: Array<{ start: number; end: number; isCollege: boolean }>;
    }> = {};
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
    const normalizeDayKey = (raw?: string | null) => {
      const s = String(raw ?? '').trim().toLowerCase();
      if (!s) return '';
      // Accept full names and short codes
      if (["mon","monday"].includes(s)) return "mon";
      if (["tue","tuesday"].includes(s)) return "tue";
      if (["wed","wednesday"].includes(s)) return "wed";
      if (["thu","thursday"].includes(s)) return "thu";
      if (["fri","friday"].includes(s)) return "fri";
      if (["sat","saturday"].includes(s)) return "sat";
      if (["sun","sunday"].includes(s)) return "sun";
      return s;
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

    // Observance helper: normalize into whole/half with optional suspension start time
    const getObservanceInfo = (dateStr: string) => {
      const obs = observanceMap[dateStr];
      const type = obs?.type?.toLowerCase?.() || "";
      const startMinVal = hmToMin(obs?.start_time);
      const hasStart = !Number.isNaN(startMinVal);
      const isHalfByKeyword = type.includes("half") || type.includes("eve");
      const isWholeByKeyword = type.includes("whole");
      const isHalf = hasStart || isHalfByKeyword;
      // Consider keyword 'holiday' as whole day when no explicit half signal
      const isWhole = isWholeByKeyword || (!isHalf && type.includes("holiday"));
      return { isHalf, isWhole, startMin: hasStart ? startMinVal : undefined } as const;
    };

    for (const wd of workDays) {
      const start = hmToMin(wd.work_start_time || undefined);
      const end = hmToMin(wd.work_end_time || undefined);
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      const raw = diffMin(start, end);
      const durationMin = Math.max(0, raw - 60); // minus 1 hour break to match schedule display
      const roleStr = String(wd.role ?? '').toLowerCase();
      const fromCollegeRole = roleStr.includes('college instructor');
      // Normalize weekday key to match codeFromDate mapping (mon..sun)
      const codeKey = normalizeDayKey(wd.day);
      if (!codeKey) continue;
      if (!schedByCode[codeKey]) {
        schedByCode[codeKey] = { start, end, durationMin, isCollege: fromCollegeRole, timeWindows: [{ start, end, isCollege: fromCollegeRole }] };
      } else {
        // Merge overlapping or adjacent time-based schedules into a single span for the day
        const prev = schedByCode[codeKey];
        const mergedStart = Math.min(prev.start, start);
        const mergedEnd = Math.max(prev.end, end);
        const mergedRaw = diffMin(mergedStart, mergedEnd);
        const mergedDuration = Math.max(0, mergedRaw - 60); // subtract only one lunch break per day
        const windows = Array.isArray(prev.timeWindows) ? prev.timeWindows.slice() : [];
        windows.push({ start, end, isCollege: fromCollegeRole });
        schedByCode[codeKey] = {
          start: mergedStart,
          end: mergedEnd,
          durationMin: mergedDuration,
          isCollege: Boolean(prev.isCollege || fromCollegeRole),
          extraCollegeDurMin: prev.extraCollegeDurMin,
          timeWindows: windows,
        };
      }
    }

    // Merge in college program schedules (hours-only) so absences can be computed for college instructors
    try {
      const collegeSchedulesRaw = (employee as unknown as { college_schedules?: Array<{ day: string; hours_per_day: number; program_code?: string }> | Record<string, Array<{ day: string; hours_per_day: number; program_code?: string }>> }).college_schedules;
      if (collegeSchedulesRaw) {
        const pushHours = (day: string, hours: number) => {
          const code = normalizeDayKey(day);
          if (!code) return;
          const mins = Math.max(0, Number(hours) * 60);
          if (!schedByCode[code]) {
            // No time-based schedule: create duration-only schedule
            schedByCode[code] = { start: NaN, end: NaN, durationMin: mins, noTimes: true, isCollege: true };
          } else {
            // Computation safeguard: collapse duplicate college hours per weekday by MAX, not SUM
            const existing = schedByCode[code] as any;
            if (existing.noTimes) {
              existing.durationMin = Math.max(Number(existing.durationMin ?? 0), mins);
            } else {
              const extra = Number(existing.extraCollegeDurMin ?? 0);
              existing.extraCollegeDurMin = Math.max(extra, mins);
            }
            // IMPORTANT: Do NOT flip the time-based schedule to 'college'.
            // 'isCollege' should only be true when the explicit time-based schedule came from a College Instructor role.
            // Presence of extra college hours is tracked by 'extraCollegeDurMin' and should not alter isCollege.
          }
        };
        if (Array.isArray(collegeSchedulesRaw)) {
          collegeSchedulesRaw.forEach((item) => pushHours(item?.day as string, Number(item?.hours_per_day ?? 0)));
        } else if (collegeSchedulesRaw && typeof collegeSchedulesRaw === 'object') {
          Object.values(collegeSchedulesRaw as Record<string, Array<{ day: string; hours_per_day: number }>>).forEach((arr) => {
            (arr || []).forEach((item) => pushHours(item?.day as string, Number(item?.hours_per_day ?? 0)));
          });
        }
      }
    } catch (e) {
      // Non-fatal: just skip if shape doesn't match
      // console.debug('college_schedules merge skipped', e);
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
  let otObservanceMin = 0;
  let totalWorkedMin = 0;
  // Tracks only the portion of attendance that falls within any college schedule (time-based or program hours)
  let collegePaidMin = 0;

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
  const obsRaw = observanceMap[dateStr];
  const obsType = obsRaw?.type?.toLowerCase?.() || "";
  const obsInfo = getObservanceInfo(dateStr);

        // If schedule has no explicit start/end (college hours-only), treat expectations by duration only.
        if (sched.noTimes) {
          const expectedDuration = Math.max(0, sched.durationMin);
          const workedMinusBreak = hasBoth ? Math.max(0, workedRaw - 60) : 0;
          // Whole-day/half-day observances: approximate by scaling expectations
          if (obsInfo.isWhole) {
            // No absence expectation on whole-day observances; any work counts as overtime (use full clocked hours)
            totalWorkedMin += workedRaw;
            if (hasBoth && !isCollegeOnly) {
              // Only non-college roles accrue overtime here
              otMin += workedRaw;
              if (code === 'sat' || code === 'sun') otWeekendMin += workedRaw; else otWeekdayMin += workedRaw;
            }
            // College-paid hours do not accrue on whole-day observances (no college schedule expectations)
            continue;
          }
          if (obsInfo.isHalf) {
            // Treat half-day observances as no expectation at all: any work is overtime; no absences (use full clocked hours).
            totalWorkedMin += workedRaw;
            if (hasBoth) {
              otMin += workedRaw;
              if (code === 'sat' || code === 'sun') otWeekendMin += workedRaw; else otWeekdayMin += workedRaw;
            }
            // No college-paid hours on half-day observances
            continue;
          }
          // Default day: duration-only expectation
          if (!hasBoth) {
            absentMin += expectedDuration;
            continue;
          }
          totalWorkedMin += workedMinusBreak;
          // College-paid: cap by expected duration for college-only hour schedules
          collegePaidMin += Math.min(workedMinusBreak, expectedDuration);
          if (isCollegeOnly || isCollegeMulti) {
            // College schedules: deficit -> Absences
            const deficit = Math.max(0, expectedDuration - workedMinusBreak);
            absentMin += deficit;
            // For multi-role, still allow overtime when exceeding expected duration
            if (!isCollegeOnly) {
              const over = Math.max(0, workedMinusBreak - expectedDuration);
              otMin += over;
              if (code === 'sat' || code === 'sun') otWeekendMin += over; else otWeekdayMin += over;
            }
          } else {
            const under = Math.max(0, expectedDuration - workedMinusBreak);
            const over = Math.max(0, workedMinusBreak - expectedDuration);
            underMin += under;
            otMin += over;
            if (code === 'sat' || code === 'sun') otWeekendMin += over; else otWeekdayMin += over;
          }
          continue;
        }

        // WHOLE-DAY: No absences/tardy/undertime; any work counts as overtime (observance is non-working -> double pay bucket)
        if (obsInfo.isWhole) {
          // Whole-day observance: no expectation; full clocked hours are overtime
          if (hasBoth) {
            totalWorkedMin += workedRaw;
            otMin += workedRaw;
            otObservanceMin += workedRaw;
          }
          // No college-paid hours on whole-day observances
          continue;
        }

        // HALF-DAY: Treat as no expectation; any work is overtime; no absences
        if (obsInfo.isHalf) {
          if (hasBoth) {
            totalWorkedMin += workedRaw;
            otMin += workedRaw;
            otObservanceMin += workedRaw; // observance treated as double pay bucket
          }
          // No college-paid hours on half-day observances
          continue;
        }

        // Default or RAINY-DAY behavior
        const workedMinusBreak = hasBoth ? Math.max(0, workedRaw - 60) : 0;
        totalWorkedMin += workedMinusBreak;

        if (!hasBoth) {
          // If this is a multi-role day with extra college hours, expected is max(admin, college)
          const expected = (isCollegeMulti && sched.extraCollegeDurMin && sched.extraCollegeDurMin > 0)
            ? Math.max(sched.durationMin, sched.extraCollegeDurMin)
            : sched.durationMin;
          absentMin += expected;
          continue;
        }

        // College-paid hours on time-based schedules: count only the actual overlap with college windows
        let dayCollegePaid = 0;
        const windows = Array.isArray(sched.timeWindows) ? sched.timeWindows.filter(w => w && w.isCollege) : [];
        if (windows.length > 0 && hasBoth) {
          const overlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) => {
            // simple same-day overlap; inputs are minutes [0,1440)
            const s = Math.max(aStart, bStart);
            const e = Math.min(aEnd, bEnd);
            return Math.max(0, e - s);
          };
          let overlappedMin = 0;
          let overlappedAfterBreakMin = 0;
          const breakEnd = 13 * 60; // 13:00
          for (const w of windows) {
            const o = overlap(timeIn, timeOut, w.start, w.end);
            overlappedMin += o;
            // Portion of this window occurring after 13:00
            if (timeOut > breakEnd && w.end > breakEnd) {
              const oAfter = overlap(timeIn, timeOut, Math.max(w.start, breakEnd), w.end);
              overlappedAfterBreakMin += oAfter;
            }
          }
          // Apply the same lunch rule within overlapped portion (cap to overlapped minutes)
          if (overlappedMin > 0 && timeOut > 13 * 60 && overlappedAfterBreakMin > 0) {
            const lunchDeduct = Math.min(60, overlappedAfterBreakMin, overlappedMin);
            overlappedMin = Math.max(0, overlappedMin - lunchDeduct);
          }
          // Guard with actually-worked minutes after global lunch deduction
          overlappedMin = Math.min(overlappedMin, workedMinusBreak);
          dayCollegePaid += overlappedMin;
        }

        // Also account for program-only college hours on the same day
        if ((sched.extraCollegeDurMin ?? 0) > 0 && hasBoth) {
          const remaining = Math.max(0, workedMinusBreak - dayCollegePaid);
          dayCollegePaid += Math.min(remaining, sched.extraCollegeDurMin!);
        }

        collegePaidMin += dayCollegePaid;

        // College-dominant expectation rule:
        // - College-only employees
        // - OR multi-role days where the time-based schedule is from College, OR the extra college hours exceed the admin span.
        // In those cases, treat shortfall as Absences (college policy) and suppress tardiness/undertime.
        // Otherwise (e.g., admin span >= extra college hours), compute regular tardiness/undertime for the admin schedule.
        if (isCollegeOnly || (isCollegeMulti && (sched.isCollege || (sched.extraCollegeDurMin ?? 0) > sched.durationMin))) {
          // College-only: treat shortfall as absence; suppress tardiness/undertime/OT
          const expected = (isCollegeMulti && (sched.extraCollegeDurMin ?? 0) > 0)
            ? Math.max(sched.durationMin, sched.extraCollegeDurMin || 0)
            : sched.durationMin;
          const deficit = Math.max(0, expected - workedMinusBreak);
          absentMin += deficit;
          // Preserve overtime for multi-role college schedules
          if (!isCollegeOnly) {
            const over = Math.max(0, workedMinusBreak - expected);
            otMin += over;
            if (code === 'sat' || code === 'sun') otWeekendMin += over; else otWeekdayMin += over;
          }
          continue;
        }

        // Non-college: full time-based breakdown applies
        let tard: number;
        if (obsType.includes("rainy")) {
          const graceEnd = sched.start + 60;
          tard = timeIn <= graceEnd ? 0 : Math.max(0, timeIn - sched.start);
        } else {
          tard = Math.max(0, timeIn - sched.start);
        }

  const under = Math.max(0, sched.end - timeOut);
  // Overtime should be based on time past the scheduled end, independent of tardiness
  const over = Math.max(0, timeOut - sched.end);

        tardMin += tard;
        underMin += under;
        otMin += over;
        if (code === 'sat' || code === 'sun') otWeekendMin += over; else otWeekdayMin += over;
      } else {
        // Not scheduled day (weekend or off)
        if (hasBoth) {
          const workedRaw = diffMin(timeIn, timeOut);
          const workedMinusBreak = Math.max(0, workedRaw - 60);
          totalWorkedMin += workedMinusBreak;
          if (!isCollegeOnly) {
            otMin += workedMinusBreak;
            if (code === 'sat' || code === 'sun') otWeekendMin += workedMinusBreak; else otWeekdayMin += workedMinusBreak;
          }
          // No college-paid hours on unscheduled days
        }
      }
    }

    const toH = (min: number) => Number((min / 60).toFixed(2));

    // --- Compute rate context (align with old TimeKeepingViewDialog/backend) ---
    // Prefer explicit employee.work_hours_per_day; fallback to schedule-derived average; else 8
    const schedDurations = Object.values(schedByCode).map((s) => s.durationMin);
    const avgDurationMin = schedDurations.length > 0 ? (schedDurations.reduce((a, b) => a + b, 0) / schedDurations.length) : (8 * 60);
    const inferredHoursPerDay = Math.max(1, Number((avgDurationMin / 60).toFixed(2)));
    const workHoursPerDayField = Number((employee as Employees).work_hours_per_day ?? NaN);
    const hoursPerDay = Number.isFinite(workHoursPerDayField) && workHoursPerDayField > 0 ? workHoursPerDayField : inferredHoursPerDay;

  // rolesStr and isCollege already computed above

    const baseSalary = Number(employee.base_salary ?? 0) || 0;
    // Resolve college rate: employee.college_rate -> summary.college_rate -> summary.rate_per_hour
    const collegeRate = (() => {
      const fromEmp = employee.college_rate !== undefined && employee.college_rate !== null ? Number(employee.college_rate) : undefined;
      if (typeof fromEmp === 'number' && Number.isFinite(fromEmp) && fromEmp > 0) return fromEmp;
      const fromSummaryCR = Number(summaryRates?.college_rate ?? NaN);
      if (Number.isFinite(fromSummaryCR) && fromSummaryCR > 0) return fromSummaryCR;
      const fromSummaryRH = Number(summaryRates?.rate_per_hour ?? NaN);
      if (Number.isFinite(fromSummaryRH) && fromSummaryRH > 0) return fromSummaryRH;
      return undefined;
    })();

    // IMPORTANT: For non-college, exclude honorarium in rate_per_day to match old logic/backend
    const ratePerDay = isCollege ? undefined : Number(((baseSalary * 12) / 288).toFixed(2));
    const ratePerHour = isCollege
      ? (collegeRate ?? 0)
      : Number((((ratePerDay ?? 0)) / (hoursPerDay || 8)).toFixed(2));

    return {
      tardiness: toH(tardMin),
      undertime: toH(underMin),
      overtime: toH(otMin),
      absences: toH(absentMin),
      overtime_count_weekdays: toH(otWeekdayMin),
      overtime_count_weekends: toH(otWeekendMin),
      overtime_count_observances: toH(otObservanceMin),
      total_hours: toH(totalWorkedMin),
      college_paid_hours: toH(collegePaidMin),
      rate_per_hour: ratePerHour,
      rate_per_day: ratePerDay,
      college_rate: collegeRate,
    };
  }, [employee, records, selectedMonth, observanceMap, summaryRates]);

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
  const ratePerDay = (monthly * 12) / 288;
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
