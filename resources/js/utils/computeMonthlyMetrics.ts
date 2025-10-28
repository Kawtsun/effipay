import type { Employees } from "@/types";
import type { WorkDayTime } from "@/components/employee-schedule-badges";

export type TimeRecordLike = {
  date: string;
  clock_in?: string | null;
  clock_out?: string | null;
  time_in?: string | null;
  time_out?: string | null;
};

export type ObservanceEntry = { date?: string; type?: string; label?: string; start_time?: string };

export type MonthlyMetrics = {
  tardiness: number;
  undertime: number;
  overtime: number;
  absences: number;
  overtime_count_weekdays: number;
  overtime_count_weekends: number;
  total_hours: number;
};

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

const parseClock = (raw?: unknown): number => {
  if (!raw || typeof raw !== "string") return NaN;
  const s = raw.trim();
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

function codeFromDate(d: Date) {
  const idx = d.getDay(); // 0..6 Sun..Sat
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][idx];
}

function toH(min: number) { return Number((min / 60).toFixed(2)); }

/**
 * Compute monthly metrics to match TimeKeepingDataProvider logic.
 * Optionally pass pre-fetched observances to avoid extra network calls in batch.
 */
export async function computeMonthlyMetrics(
  employee: Employees,
  selectedMonth: string,
  records: TimeRecordLike[],
  observances?: ObservanceEntry[]
): Promise<MonthlyMetrics> {
  // Build schedule map by weekday code (mon..sun)
  type WorkDay = { day: string; work_start_time?: string | null; work_end_time?: string | null };
  const workDaysRaw: unknown = (employee as { work_days?: WorkDayTime[] | unknown }).work_days;
  const workDays: WorkDay[] = Array.isArray(workDaysRaw) ? (workDaysRaw as WorkDayTime[]).map((wd) => ({
    day: String(wd?.day ?? ""),
    work_start_time: wd?.work_start_time || undefined,
    work_end_time: wd?.work_end_time || undefined,
  })) : [];

  const schedByCode: Record<string, { start: number; end: number; durationMin: number }> = {};
  for (const wd of workDays) {
    const start = hmToMin(wd.work_start_time || undefined);
    const end = hmToMin(wd.work_end_time || undefined);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    const raw = diffMin(start, end);
    const durationMin = Math.max(0, raw - 60); // minus 1 hour break
    schedByCode[wd.day] = { start, end, durationMin };
  }

  // Map records by date
  const map: Record<string, { clock_in?: string | null; clock_out?: string | null; time_in?: string | null; time_out?: string | null }> = {};
  for (const r of records) {
    const rd = typeof r.date === "string" ? r.date : undefined;
    if (!rd) continue;
    map[rd] = { clock_in: r.clock_in ?? undefined, clock_out: r.clock_out ?? undefined, time_in: r.time_in ?? undefined, time_out: r.time_out ?? undefined };
  }

  // Observances for the month
  let obsArr: ObservanceEntry[] = observances ?? [];
  if (!observances) {
    try {
      const res = await fetch("/observances");
      const payload = await res.json();
      obsArr = Array.isArray(payload) ? payload : (Array.isArray(payload?.observances) ? payload.observances : []);
    } catch {
      obsArr = [];
    }
  }
  const obsMap: Record<string, { type?: string; start_time?: string }> = {};
  for (const o of obsArr) {
    const d = (o?.date || "").slice(0, 10);
    if (!d || d.slice(0, 7) !== selectedMonth) continue;
    obsMap[d] = { type: o?.type || o?.label, start_time: o?.start_time };
  }

  const [yStr, mStr] = selectedMonth.split("-");
  const y = Number(yStr), m = Number(mStr);
  const daysInMonth = (!y || !m) ? 0 : new Date(y, m, 0).getDate();

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
      const workedRaw = hasBoth ? diffMin(timeIn, timeOut) : 0;
      const obs = obsMap[dateStr];
      const obsType = obs?.type?.toLowerCase?.() || "";

      if (obsType.includes("whole")) {
        const workedMinusBreak = hasBoth ? Math.max(0, workedRaw - 60) : 0;
        totalWorkedMin += workedMinusBreak;
        if (hasBoth) {
          otMin += workedMinusBreak;
          otWeekendMin += workedMinusBreak;
        }
        continue;
      }

      if (obsType.includes("half")) {
        const suspMinVal = hmToMin(obs?.start_time);
        const suspMin = Number.isNaN(suspMinVal) ? 12 * 60 : suspMinVal; // default 12:00
        const expectedEnd = Math.max(sched.start, Math.min(suspMin, sched.end));
        const expectedDuration = Math.max(0, expectedEnd - sched.start);

        if (!hasBoth) {
          absentMin += expectedDuration;
          continue;
        }

        totalWorkedMin += workedRaw; // no lunch deduction for half-day expectation
        const tard = Math.max(0, timeIn - sched.start);
        const under = Math.max(0, expectedEnd - timeOut);
        const over = Math.max(0, timeOut - Math.max(timeIn, expectedEnd));

        tardMin += tard;
        underMin += under;
        otMin += over;
        otWeekdayMin += over;
        continue;
      }

      // Default or rainy-day (1-hr grace only affects tardy computation)
      const workedMinusBreak = hasBoth ? Math.max(0, workedRaw - 60) : 0;
      totalWorkedMin += workedMinusBreak;

      if (!hasBoth) {
        absentMin += sched.durationMin;
        continue;
      }

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
      // Non-scheduled day (weekend/off)
      if (hasBoth) {
        const workedRaw = diffMin(timeIn, timeOut);
        const workedMinusBreak = Math.max(0, workedRaw - 60);
        totalWorkedMin += workedMinusBreak;
        otMin += workedMinusBreak;
        otWeekendMin += workedMinusBreak;
      }
    }
  }

  return {
    tardiness: toH(tardMin),
    undertime: toH(underMin),
    overtime: toH(otMin),
    absences: toH(absentMin),
    overtime_count_weekdays: toH(otWeekdayMin),
    overtime_count_weekends: toH(otWeekendMin),
    total_hours: toH(totalWorkedMin),
  };
}
