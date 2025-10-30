
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock } from "lucide-react";
import React, { useId, useMemo, useState } from "react";

// Extended to optionally carry role and hours-only values (for college schedules)
export type WorkDayTime = {
  day: string;
  work_start_time?: string | null;
  work_end_time?: string | null;
  work_hours?: number | string | null;
  role?: string | null;
};

const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;


function formatTime12Hour(time?: string): string {
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

function getDurationText(start: string, end: string, breakMinutes = 60): string {
  if (!start || !end) return "-";
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) return "-";
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  let actualWorkMinutes = endMinutes - startMinutes;
  if (actualWorkMinutes <= 0) actualWorkMinutes += 24 * 60;
  const totalMinutes = Math.max(1, actualWorkMinutes - breakMinutes); // minus break
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0 && minutes === 0) return "-";
  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minutes`;
}

type CollegeScheduleItem = { day: string; hours_per_day: number; program_code?: string };

export function EmployeeScheduleBadges({
  workDays,
  collegeSchedules,
  initiallyOpen = false,
  variant = 'chips',
  compact = false,
  breakMinutes = 60,
}: {
  workDays: WorkDayTime[];
  // Optional: pass raw college program schedules when available
  collegeSchedules?: CollegeScheduleItem[] | Record<string, CollegeScheduleItem[]>;
  initiallyOpen?: boolean;
  variant?: 'chips' | 'list';
  compact?: boolean;
  breakMinutes?: number;
}) {
  const [show, setShow] = useState<boolean>(initiallyOpen);
  const panelId = useId();
  // Color palette for badges (Mon-Sun) with dark-mode support
  const colors = [
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
    "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300",
  ];
  // Utilities
  const toLabel = (role?: string | null) => {
    if (!role) return 'Unspecified';
    const s = String(role).trim();
    return s
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(' ');
  };

  const isTimeBased = (wd: WorkDayTime) => !!(wd.work_start_time || wd.work_end_time);

  // Merge any provided college schedules into a per-day hours map
  const collegeHoursByDay = useMemo(() => {
    const map = new Map<string, number>();
    if (!collegeSchedules) return map;
    const push = (day: string, hours: number) => {
      const key = (day || '').toLowerCase();
      if (!key) return;
      const prev = map.get(key) ?? 0;
      map.set(key, prev + (Number.isFinite(hours) ? hours : 0));
    };
    if (Array.isArray(collegeSchedules)) {
      for (const item of collegeSchedules) {
        push(item.day, item.hours_per_day);
      }
    } else if (collegeSchedules && typeof collegeSchedules === 'object') {
      Object.values(collegeSchedules).forEach((arr) => {
        (arr || []).forEach((item) => push(item.day, item.hours_per_day));
      });
    }
    return map;
  }, [collegeSchedules]);

  // Build per-program per-day hours when multiple programs exist
  const collegeHoursByProgram = useMemo(() => {
    const byProgram = new Map<string, Map<string, number>>();
    if (!collegeSchedules) return byProgram;
    const push = (code: string | undefined, day: string, hours: number) => {
      const program = (code || '').trim() || 'Unknown';
      const dayKey = (day || '').toLowerCase();
      if (!dayKey) return;
      if (!byProgram.has(program)) byProgram.set(program, new Map<string, number>());
      const m = byProgram.get(program)!;
      const prev = m.get(dayKey) ?? 0;
      m.set(dayKey, prev + (Number.isFinite(hours) ? hours : 0));
    };
    if (Array.isArray(collegeSchedules)) {
      for (const item of collegeSchedules) {
        push(item.program_code, item.day, item.hours_per_day);
      }
    } else if (collegeSchedules && typeof collegeSchedules === 'object') {
      Object.entries(collegeSchedules).forEach(([programCode, arr]) => {
        (arr || []).forEach((item) => push(item.program_code ?? programCode, item.day, item.hours_per_day));
      });
    }
    return byProgram;
  }, [collegeSchedules]);

  // Group entries by role. Non-college roles come from workDays where role is set and times exist.
  // College role: either derive from collegeSchedules if provided, else fallback to workDays entries
  // that contain role including 'college' or provide work_hours only.
  const grouped = useMemo(() => {
    const groups = new Map<string, WorkDayTime[]>();

    // 1) Add non-college and legacy items from workDays
    (workDays || []).forEach((wd) => {
      const roleKey = (wd.role || '').toLowerCase();
      const isCollegeRole = roleKey.includes('college');
  const hasTimes = isTimeBased(wd);
  const hasOnlyHours = !hasTimes && wd.work_hours !== null && wd.work_hours !== undefined;

      // If collegeSchedules are provided, we'll handle college via those; skip pure college items here
      if (isCollegeRole && collegeHoursByDay.size > 0) return;

      // When college schedules exist, ignore placeholder/stub rows from work_days that
      // have no role and only carry hours (to avoid showing an "Unspecified" group).
      if (collegeHoursByDay.size > 0) {
        const noRole = !wd.role || String(wd.role).trim() === '';
        if (noRole && hasOnlyHours) return;
      }

      const key = toLabel(wd.role);
      const arr = groups.get(key) || [];
      arr.push(wd);
      groups.set(key, arr);
    });

    // 2) Add college hours
    // Prefer per-program grouping whenever there is at least one program
    if (collegeHoursByProgram.size > 0) {
      for (const [program, dayMap] of collegeHoursByProgram.entries()) {
        const key = `${toLabel('college instructor')} [${program}]`;
        const arr = groups.get(key) || [];
        for (const [day, hours] of dayMap.entries()) {
          arr.push({ day, work_hours: hours, role: 'college instructor' });
        }
        groups.set(key, arr);
      }
    } else if (collegeHoursByDay.size > 0) {
      // Fallback: aggregate view when program codes are not available
      const key = toLabel('college instructor');
      const arr = groups.get(key) || [];
      for (const [day, hours] of collegeHoursByDay.entries()) {
        arr.push({ day, work_hours: hours, role: 'college instructor' });
      }
      groups.set(key, arr);
    }

    // 3) Ensure each group's days are sorted
    const sortedGroups = new Map<string, WorkDayTime[]>();
    for (const [role, items] of groups.entries()) {
      const sorted = [...items].sort(
        (a, b) => DAY_ORDER.indexOf(a.day as typeof DAY_ORDER[number]) - DAY_ORDER.indexOf(b.day as typeof DAY_ORDER[number])
      );
      sortedGroups.set(role, sorted);
    }
    return sortedGroups;
  }, [workDays, collegeHoursByDay, collegeHoursByProgram]);

  const count = Array.from(grouped.values()).reduce((acc, items) => acc + items.length, 0);
  if (count === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShow((v) => !v)}
          className="rounded-full h-8 px-3 flex items-center gap-2"
          aria-expanded={show}
          aria-controls={panelId}
          aria-label={`Toggle schedule (${count})`}
        >
          <span className="sr-only">Toggle schedule</span>
          <span className="text-xs">{show ? 'Hide' : 'Show'}</span>
          <span className="text-[10px] text-muted-foreground">({count})</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${show ? 'rotate-180' : ''}`} />
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {show && (
          <motion.div
            id={panelId}
            role="list"
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            style={{ overflow: 'hidden' }}
            transition={{ type: "spring", stiffness: 300, damping: 24, duration: 0.28 }}
          >
            {Array.from(grouped.entries()).map(([roleLabel, items], gIdx) => (
              <div key={roleLabel} className="flex flex-col gap-1.5">
                <div className="text-[11px] font-semibold text-muted-foreground">{roleLabel}</div>
                <div className={`flex ${variant === 'chips' ? 'flex-wrap' : 'flex-col'} ${compact ? 'gap-1.5' : 'gap-2'}`}>
                  {items.map((wd, idx) => {
                    const colorIdx = DAY_ORDER.indexOf(wd.day as typeof DAY_ORDER[number]);
                    const colorClass = colorIdx >= 0 ? colors[colorIdx] : colors[0];
                    // Match RoleBadge styling: no enforced min width, fully pill-shaped
                    const hasTimes = isTimeBased(wd);
                    const title = hasTimes
                      ? `${DAY_LABELS[wd.day] || wd.day}: ${formatTime12Hour(wd.work_start_time || '')} - ${formatTime12Hour(wd.work_end_time || '')} (${getDurationText(wd.work_start_time || '', wd.work_end_time || '', breakMinutes)})`
                      : `${DAY_LABELS[wd.day] || wd.day}: ${(Number(wd.work_hours) || 0)} hour(s)`;

                    return (
                      <motion.div
                        key={`${roleLabel}-${wd.day}-${idx}`}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ delay: (gIdx * 0.03) + (idx * 0.02), type: "spring", stiffness: 280, damping: 22 }}
                      >
                        <Badge
                          role="listitem"
                          title={title}
                          className={`inline-flex flex-wrap items-center gap-x-1.5 whitespace-normal break-words max-w-full rounded-full px-2.5 py-1 text-xs font-semibold border-0 ${colorClass}`}
                        >
                          <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />
                          <span className="font-semibold shrink-0">{DAY_LABELS[wd.day] || wd.day}:</span>
                          {hasTimes ? (
                            <span className="flex items-center gap-x-1 whitespace-nowrap">
                              <span>{formatTime12Hour(wd.work_start_time || '')} - {formatTime12Hour(wd.work_end_time || '')}</span>
                              <span className="text-[10px] text-muted-foreground">({getDurationText(wd.work_start_time || '', wd.work_end_time || '', breakMinutes)})</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-x-1 whitespace-nowrap">
                              <span>{Number(wd.work_hours || 0)} hour(s)</span>
                            </span>
                          )}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
