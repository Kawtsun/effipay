
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock } from "lucide-react";
import React, { useId, useMemo, useState } from "react";

export type WorkDayTime = {
  day: string;
  work_start_time: string;
  work_end_time: string;
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

export function EmployeeScheduleBadges({ workDays, initiallyOpen = false, variant = 'chips', compact = false, breakMinutes = 60 }: { workDays: WorkDayTime[]; initiallyOpen?: boolean; variant?: 'chips' | 'list'; compact?: boolean; breakMinutes?: number }) {
  const [show, setShow] = useState<boolean>(initiallyOpen);
  const panelId = useId();
  // Color palette for badges (Mon-Sun) with dark-mode support
  const colors = [
    "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-400/30",
    "bg-green-100 text-green-800 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-400/30",
    "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-400/30",
    "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-400/30",
    "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-400/30",
    "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-500/15 dark:text-pink-300 dark:border-pink-400/30",
    "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-400/30",
  ];
  // Sort by weekday order for a consistent display
  const sorted = useMemo(() => {
    if (!Array.isArray(workDays)) return [] as WorkDayTime[];
    return [...workDays].sort((a, b) => DAY_ORDER.indexOf(a.day as typeof DAY_ORDER[number]) - DAY_ORDER.indexOf(b.day as typeof DAY_ORDER[number]));
  }, [workDays]);

  const count = sorted.length;
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
            className={`flex ${variant === 'chips' ? 'flex-wrap' : 'flex-col'} ${compact ? 'gap-1.5' : 'gap-2'}`}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            style={{ overflow: 'hidden' }}
            transition={{ type: "spring", stiffness: 300, damping: 24, duration: 0.28 }}
          >
            {sorted.map((wd, idx) => {
              const colorIdx = DAY_ORDER.indexOf(wd.day as typeof DAY_ORDER[number]);
              const colorClass = colorIdx >= 0 ? colors[colorIdx] : colors[0];
              const minW = compact ? 'min-w-[200px]' : 'min-w-[240px]';
              return (
                <motion.div
                  key={`${wd.day}-${wd.work_start_time}-${wd.work_end_time}`}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: idx * 0.03, type: "spring", stiffness: 280, damping: 22 }}
                >
                  <Badge
                    role="listitem"
                    variant="outline"
                    title={`${DAY_LABELS[wd.day] || wd.day}: ${formatTime12Hour(wd.work_start_time)} - ${formatTime12Hour(wd.work_end_time)} (${getDurationText(wd.work_start_time, wd.work_end_time, breakMinutes)})`}
                    className={`px-2.5 py-1 text-[11px] font-medium border ${colorClass} ${minW} justify-start flex items-center`}
                  >
                    <span className="font-semibold mr-1 whitespace-nowrap">{DAY_LABELS[wd.day] || wd.day}:</span>
                    <Clock className="w-3.5 h-3.5 mr-1 opacity-70" />
                    <span className="whitespace-nowrap">{formatTime12Hour(wd.work_start_time)} - {formatTime12Hour(wd.work_end_time)}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground whitespace-nowrap">({getDurationText(wd.work_start_time, wd.work_end_time, breakMinutes)})</span>
                  </Badge>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
