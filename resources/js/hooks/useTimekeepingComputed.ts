import * as React from "react";
import type { Employees } from "@/types";

export type ObservanceMap = Record<string, { type?: string; start_time?: string }>

export type TimeKeepingMetrics = {
  tardiness: number;
  undertime: number;
  overtime: number;
  absences: number;
  overtime_count_weekdays: number;
  overtime_count_weekends: number;
  overtime_count_observances: number;
  total_hours: number;
  college_paid_hours?: number;
  rate_per_hour?: number;
  rate_per_day?: number;
  college_rate?: number;
};

/**
 * useTimekeepingComputed
 * Fetches BTR records + observances + summary rates and computes metrics using the
 * same logic as the TimeKeepingDataProvider so other views (e.g., Report) can match it.
 */
export function useTimekeepingComputed(employee: Employees | null, month: string | null) {
  const [records, setRecords] = React.useState<Array<Record<string, unknown>>>([]);
  const [observanceMap, setObservanceMap] = React.useState<ObservanceMap>({});
  const [summaryRates, setSummaryRates] = React.useState<{ rate_per_hour?: number; college_rate?: number } | null>(null);
  const [loading, setLoading] = React.useState(false);
  // Leave dates within the selected month; used to exclude tardy/under/absences when on leave
  const [leaveDatesSet, setLeaveDatesSet] = React.useState<Record<string, true>>({});

  React.useEffect(() => {
  if (!employee || !month) {
      setRecords([]);
      setObservanceMap({});
      setSummaryRates(null);
      setLeaveDatesSet({});
      return;
    }
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const [recRes, obsRes, sumRes, leavesRes] = await Promise.all([
          fetch(`/api/timekeeping/records?employee_id=${employee!.id}&month=${month}`).then(r => r.json()).catch(() => ({ records: [] })),
          fetch(`/observances`).then(r => r.json()).catch(() => ([])),
          (async () => {
            try {
              const url = typeof route === 'function'
                ? route("timekeeping.employee.monthly-summary", { employee_id: employee!.id, month: String(month) })
                : `/timekeeping/employee/${employee!.id}/monthly-summary?month=${encodeURIComponent(String(month))}`;
              return await fetch(url).then(r => r.json());
            } catch {
              return null;
            }
          })(),
          fetch(`/api/leaves?employee_id=${employee!.id}`).then(r => r.json()).catch(() => ({ leaves: [] })),
        ]);
        if (cancelled) return;
        const recs = Array.isArray(recRes?.records) ? recRes.records : [];
        setRecords(recs);
        const arr = Array.isArray(obsRes) ? obsRes : (Array.isArray(obsRes?.observances) ? obsRes.observances : []);
        const map: ObservanceMap = {};
        for (const o of arr) {
          const d = (o?.date || "").slice(0, 10);
          if (!d || (month && d.slice(0, 7) !== month.slice(0, 7))) continue;
          map[d] = { type: o?.type || o?.label, start_time: o?.start_time };
        }
        setObservanceMap(map);
        const sr = sumRes && sumRes.success ? {
          rate_per_hour: typeof sumRes.rate_per_hour === 'number' ? sumRes.rate_per_hour
            : (typeof sumRes.rate_per_hour === 'string' && sumRes.rate_per_hour !== '' ? Number(sumRes.rate_per_hour) : undefined),
          college_rate: typeof sumRes.college_rate === 'number' ? sumRes.college_rate
            : (typeof sumRes.college_rate === 'string' && sumRes.college_rate !== '' ? Number(sumRes.college_rate) : undefined),
        } : null;
        setSummaryRates(sr);

        // Build leave date set for the target month
        const rows: Array<{ leave_start_day?: string; leave_end_day?: string | null }> = Array.isArray(leavesRes?.leaves) ? leavesRes.leaves : [];
        const [yStr, mStr] = String(month).split("-");
        const y = Number(yStr), m = Number(mStr);
        if (y && m) {
          const first = new Date(y, m - 1, 1);
          const last = new Date(y, m, 0);
          const inMonth = (d: Date) => d >= first && d <= last;
          const set: Record<string, true> = {};
          for (const r of rows) {
            const sStr = r?.leave_start_day ? String(r.leave_start_day).slice(0, 10) : '';
            const eStrRaw = r?.leave_end_day ? String(r.leave_end_day) : sStr;
            if (!sStr) continue;
            const s = new Date(`${sStr}T00:00:00`);
            const e = new Date(`${(eStrRaw || sStr).slice(0,10)}T00:00:00`);
            // iterate from max(s, first) to min(e, last)
            const start = s < first ? first : s;
            const end = e > last ? last : e;
            if (!inMonth(start) && !inMonth(end)) continue;
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              set[key] = true;
            }
          }
          setLeaveDatesSet(set);
        } else {
          setLeaveDatesSet({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [employee, month]);

  const computed = React.useMemo<TimeKeepingMetrics | null>(() => {
    if (!employee || !month) return null;

    type WorkDayTime = { day: string; work_start_time?: string | null; work_end_time?: string | null; work_hours?: number | null; role?: string | null; };

    const rolesStr = String(employee.roles ?? "").toLowerCase();
    const roleTokens = rolesStr.split(/[\,\n]+/).map(s => s.trim()).filter(Boolean);
    const isCollege = rolesStr.includes("college instructor");
    const isCollegeOnly = isCollege && (roleTokens.length > 0 ? roleTokens.every(t => t.includes("college instructor")) : true);
    const isCollegeMulti = isCollege && !isCollegeOnly;

    const workDaysRaw: unknown = (employee as { work_days?: WorkDayTime[] | unknown }).work_days;
    const workDays: WorkDayTime[] = Array.isArray(workDaysRaw) ? (workDaysRaw as WorkDayTime[]) : [];

    const hmToMin = (t?: string) => {
      if (!t) return NaN; const p = t.split(":"); if (p.length < 2) return NaN; const h = Number(p[0]), m = Number(p[1]); return (Number.isNaN(h) || Number.isNaN(m)) ? NaN : h*60+m;
    };
    const diffMin = (a: number, b: number) => { let d = b - a; if (d <= 0) d += 24*60; return d; };
    const parseClock = (raw?: unknown): number => { if (!raw || typeof raw !== "string") return NaN; const s = raw.trim();
      const ampm = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)$/i); if (ampm) { let h = Number(ampm[1]); const m = Number(ampm[2]); const ap = ampm[3].toUpperCase(); if (ap==="PM"&&h<12) h+=12; if(ap==="AM"&&h===12) h=0; return h*60+m; }
      const hm = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/); if (hm) { const h = Number(hm[1]), m = Number(hm[2]); return h*60+m; }
      return NaN; };
    const codeFromDate = (d: Date) => ["sun","mon","tue","wed","thu","fri","sat"][d.getDay()];
    const normalizeDayKey = (raw?: string | null) => { const s = String(raw ?? '').trim().toLowerCase(); if (!s) return '';
      if (["mon","monday"].includes(s)) return "mon"; if (["tue","tuesday"].includes(s)) return "tue"; if (["wed","wednesday"].includes(s)) return "wed";
      if (["thu","thursday"].includes(s)) return "thu"; if (["fri","friday"].includes(s)) return "fri"; if (["sat","saturday"].includes(s)) return "sat"; if (["sun","sunday"].includes(s)) return "sun"; return s; };

    const getObservanceInfo = (dateStr: string) => {
      const obs = observanceMap[dateStr];
      const type = obs?.type?.toLowerCase?.() || "";
      const startMinVal = hmToMin(obs?.start_time);
      const hasStart = !Number.isNaN(startMinVal);
      const isHalfByKeyword = type.includes("half") || type.includes("eve");
      const isWholeByKeyword = type.includes("whole");
      const isHalf = hasStart || isHalfByKeyword;
      const isWhole = isWholeByKeyword || (!isHalf && type.includes("holiday"));
      return { isHalf, isWhole, startMin: hasStart ? startMinVal : undefined } as const;
    };

  const schedByCode: Record<string, { start: number; end: number; durationMin: number; noTimes?: boolean; isCollege?: boolean; extraCollegeDurMin?: number }> = {};
  // Track explicit College Instructor time windows (from work_days role) and extra college minutes (from college_schedules without times)
  const collegeTimesByCode: Record<string, { start: number; end: number; durationMin: number }> = {};
  const collegeExtraMinByCode: Record<string, number> = {};
    for (const wd of workDays) {
      const start = hmToMin(wd.work_start_time || undefined);
      const end = hmToMin(wd.work_end_time || undefined);
      if (Number.isNaN(start) || Number.isNaN(end)) continue;
      const raw = diffMin(start, end);
      const durationMin = Math.max(0, raw - 60);
      const roleStr = String(wd.role ?? '').toLowerCase();
      const fromCollegeRole = roleStr.includes('college instructor');
      // Normalize day key to align with codeFromDate() values (mon..sun)
      const codeKey = normalizeDayKey(wd.day);
      if (!codeKey) continue;
      if (!schedByCode[codeKey]) {
        schedByCode[codeKey] = { start, end, durationMin, isCollege: fromCollegeRole };
      } else {
        const prev = schedByCode[codeKey];
        const mergedStart = Math.min(prev.start, start);
        const mergedEnd = Math.max(prev.end, end);
        const mergedRaw = diffMin(mergedStart, mergedEnd);
        const mergedDuration = Math.max(0, mergedRaw - 60);
        schedByCode[codeKey] = { start: mergedStart, end: mergedEnd, durationMin: mergedDuration, isCollege: Boolean(prev.isCollege || fromCollegeRole), extraCollegeDurMin: prev.extraCollegeDurMin };
      }
      if (fromCollegeRole) {
        collegeTimesByCode[codeKey] = { start, end, durationMin };
      }
    }

    try {
      const collegeSchedulesRaw = (employee as unknown as { college_schedules?: Array<{ day: string; hours_per_day: number; program_code?: string }> | Record<string, Array<{ day: string; hours_per_day: number; program_code?: string }>> }).college_schedules;
      if (collegeSchedulesRaw) {
        const pushHours = (day: string, hours: number) => {
          const code = normalizeDayKey(day); if (!code) return; const mins = Math.max(0, Number(hours) * 60);
          if (!schedByCode[code]) {
            schedByCode[code] = { start: NaN, end: NaN, durationMin: mins, noTimes: true, isCollege: true };
          } else {
            const existing = schedByCode[code];
            existing.extraCollegeDurMin = (existing.extraCollegeDurMin ?? 0) + mins;
            // do not flip isCollege here; keep origin of time-based schedule
          }
          collegeExtraMinByCode[code] = (collegeExtraMinByCode[code] ?? 0) + mins;
        };
        if (Array.isArray(collegeSchedulesRaw)) {
          collegeSchedulesRaw.forEach(item => pushHours(item?.day as string, Number(item?.hours_per_day ?? 0)));
        } else if (collegeSchedulesRaw && typeof collegeSchedulesRaw === 'object') {
          Object.values(collegeSchedulesRaw as Record<string, Array<{ day: string; hours_per_day: number }>>).forEach(arr => {
            (arr || []).forEach(item => pushHours(item?.day as string, Number(item?.hours_per_day ?? 0)));
          });
        }
      }
    } catch {}

    const map: Record<string, { clock_in?: string | null; clock_out?: string | null; time_in?: string | null; time_out?: string | null }> = {};
    for (const r of records) {
      const rec = r as Record<string, unknown>;
      const rd = typeof rec.date === "string" ? rec.date : undefined;
      if (rd) {
        map[rd] = { clock_in: (rec.clock_in as string | null | undefined) ?? undefined, clock_out: (rec.clock_out as string | null | undefined) ?? undefined, time_in: (rec.time_in as string | null | undefined) ?? undefined, time_out: (rec.time_out as string | null | undefined) ?? undefined };
      }
    }

    const [yStr, mStr] = month.split("-");
    const y = Number(yStr), m = Number(mStr);
    if (!y || !m) return null;
    const daysInMonth = new Date(y, m, 0).getDate();

  let tardMin = 0, underMin = 0, absentMin = 0, otMin = 0, otWeekdayMin = 0, otWeekendMin = 0, otObservanceMin = 0, totalWorkedMin = 0, collegePaidMin = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yStr}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const d = new Date(`${dateStr}T00:00:00`);
      // Skip all metrics on leave days (no tardy/undertime/absences counted)
      if (leaveDatesSet[dateStr]) {
        continue;
      }
      const code = codeFromDate(d);
      const sched = schedByCode[code];
      const rec = map[dateStr];
      const timeIn = parseClock(rec?.clock_in ?? rec?.time_in);
      const timeOut = parseClock(rec?.clock_out ?? rec?.time_out);
      const hasBoth = !Number.isNaN(timeIn) && !Number.isNaN(timeOut);
      const obsInfo = getObservanceInfo(dateStr);

      if (sched) {
        const workedRaw = hasBoth ? diffMin(timeIn, timeOut) : 0;
        if (sched.noTimes) {
          const expectedDuration = Math.max(0, sched.durationMin);
          const workedMinusBreak = hasBoth ? Math.max(0, workedRaw - 60) : 0;
          if (obsInfo.isWhole || obsInfo.isHalf) {
            totalWorkedMin += workedRaw;
            if (hasBoth) {
              otMin += workedRaw; otObservanceMin += workedRaw; // Observance: double pay bucket
            }
            continue;
          }
          if (!hasBoth) { absentMin += expectedDuration; continue; }
          totalWorkedMin += workedMinusBreak;
          // College/GSP paid hours for no-times entries: cap actual worked by expected college minutes
          collegePaidMin += Math.min(workedMinusBreak, expectedDuration);
          if (isCollegeOnly || isCollegeMulti) {
            const deficit = Math.max(0, expectedDuration - workedMinusBreak);
            absentMin += deficit;
            if (!isCollegeOnly) {
              const over = Math.max(0, workedMinusBreak - expectedDuration);
              otMin += over; if (code === 'sat' || code === 'sun') otWeekendMin += over; else otWeekdayMin += over;
            }
          } else {
            const under = Math.max(0, expectedDuration - workedMinusBreak);
            const over = Math.max(0, workedMinusBreak - expectedDuration);
            underMin += under; otMin += over; if (code === 'sat' || code === 'sun') otWeekendMin += over; else otWeekdayMin += over;
          }
          continue;
        }

  if (obsInfo.isWhole) { if (hasBoth) { totalWorkedMin += workedRaw; otMin += workedRaw; otObservanceMin += workedRaw; } continue; }
  if (obsInfo.isHalf) { if (hasBoth) { totalWorkedMin += workedRaw; otMin += workedRaw; otObservanceMin += workedRaw; } continue; }

        const workedMinusBreak = hasBoth ? Math.max(0, workedRaw - 60) : 0;
        totalWorkedMin += workedMinusBreak;
        if (!hasBoth) { const expected = (isCollegeMulti && sched.extraCollegeDurMin && sched.extraCollegeDurMin > 0) ? Math.max(sched.durationMin, sched.extraCollegeDurMin) : sched.durationMin; absentMin += expected; continue; }

        // Compute College/GSP paid minutes within schedule windows and/or extra minutes
        if (!obsInfo.isWhole && !obsInfo.isHalf) {
          let paidToday = 0;
          const cSpec = collegeTimesByCode[code];
          if (cSpec) {
            // overlap between [timeIn,timeOut] and [cSpec.start,cSpec.end], considering potential overnight
            const calcOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) => {
              let in1 = aStart, out1 = aEnd, s1 = bStart, e1 = bEnd;
              if (out1 <= in1) out1 += 24 * 60;
              if (e1 <= s1) e1 += 24 * 60;
              const left = Math.max(in1, s1);
              const right = Math.min(out1, e1);
              return Math.max(0, right - left);
            };
            let overlap = hasBoth ? calcOverlap(timeIn, timeOut, cSpec.start, cSpec.end) : 0;
            // Apply lunch deduction if overlap crosses 1 PM
            const fixedBreakEnd = 13 * 60; // 13:00
            const normalize = (val: number, ref: number) => { let v = val; if (v <= ref) v += 24 * 60; return v; };
            const outNorm = normalize(timeOut, timeIn);
            const endNorm = normalize(cSpec.end, cSpec.start);
            const overlapEndCandidate = Math.min(outNorm, endNorm);
            if (overlap > 0 && overlapEndCandidate > fixedBreakEnd) {
              overlap = Math.max(0, overlap - 60);
            }
            paidToday += Math.min(overlap, cSpec.durationMin);
          }
          // Extra college minutes (no times): cap by remaining workedMinusBreak
          const extra = collegeExtraMinByCode[code] ?? 0;
          if (extra > 0) {
            const remain = Math.max(0, workedMinusBreak - paidToday);
            paidToday += Math.min(remain, extra);
          }
          collegePaidMin += paidToday;
        }

        if (isCollegeOnly || (isCollegeMulti && (sched.isCollege || (sched.extraCollegeDurMin ?? 0) > sched.durationMin))) {
          const expected = (isCollegeMulti && (sched.extraCollegeDurMin ?? 0) > 0) ? Math.max(sched.durationMin, sched.extraCollegeDurMin || 0) : sched.durationMin;
          const deficit = Math.max(0, expected - workedMinusBreak);
          absentMin += deficit;
          if (!isCollegeOnly) { const over = Math.max(0, workedMinusBreak - expected); otMin += over; otWeekdayMin += over; }
          continue;
        }

        const tard = Math.max(0, timeIn - sched.start);
        const under = Math.max(0, sched.end - timeOut);
        const over = Math.max(0, workedMinusBreak - sched.durationMin);
        tardMin += tard; underMin += under; otMin += over; if (code==='sat'||code==='sun') otWeekendMin += over; else otWeekdayMin += over;
      } else {
        if (hasBoth) { const workedRaw = diffMin(timeIn, timeOut); const workedMinusBreak = Math.max(0, workedRaw - 60); totalWorkedMin += workedMinusBreak; if (!isCollegeOnly) { otMin += workedMinusBreak; if (code==='sat'||code==='sun') otWeekendMin += workedMinusBreak; else otWeekdayMin += workedMinusBreak; } }
      }
    }

    const toH = (min: number) => Number((min/60).toFixed(2));

    const baseSalary = Number(employee.base_salary ?? 0) || 0;
    const schedDurations = Object.values(schedByCode).map(s => s.durationMin);
    const avgDurationMin = schedDurations.length > 0 ? (schedDurations.reduce((a,b)=>a+b,0) / schedDurations.length) : (8*60);
    const inferredHoursPerDay = Math.max(1, Number((avgDurationMin/60).toFixed(2)));
    const hoursPerDayField = Number((employee as Employees).work_hours_per_day ?? NaN);
    const hoursPerDay = Number.isFinite(hoursPerDayField) && hoursPerDayField > 0 ? hoursPerDayField : inferredHoursPerDay;

    const collegeRate = (() => {
      const fromEmp = employee.college_rate !== undefined && employee.college_rate !== null ? Number(employee.college_rate) : undefined;
      if (typeof fromEmp === 'number' && Number.isFinite(fromEmp) && fromEmp > 0) return fromEmp;
      const fromSummaryCR = Number(summaryRates?.college_rate ?? NaN);
      if (Number.isFinite(fromSummaryCR) && fromSummaryCR > 0) return fromSummaryCR;
      const fromSummaryRH = Number(summaryRates?.rate_per_hour ?? NaN);
      if (Number.isFinite(fromSummaryRH) && fromSummaryRH > 0) return fromSummaryRH;
      return undefined;
    })();

    const ratePerDay = isCollege ? undefined : Number(((baseSalary * 12) / 288).toFixed(2));
    const ratePerHour = isCollege ? (collegeRate ?? 0) : Number((((ratePerDay ?? 0)) / (hoursPerDay || 8)).toFixed(2));

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
  }, [employee, month, records, observanceMap, summaryRates]);

  return { computed, loading };
}
