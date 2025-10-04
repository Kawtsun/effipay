
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, MinusCircle } from "lucide-react";
import React, { useState } from "react";

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

function getDurationText(start: string, end: string): string {
  if (!start || !end) return "-";
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) return "-";
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  let actualWorkMinutes = endMinutes - startMinutes;
  if (actualWorkMinutes <= 0) actualWorkMinutes += 24 * 60;
  const totalMinutes = Math.max(1, actualWorkMinutes - 60); // minus 1 hour for break
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0 && minutes === 0) return "-";
  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minutes`;
}


export function EmployeeScheduleBadges({ workDays }: { workDays: WorkDayTime[] }) {
  const [show, setShow] = useState(false);
  if (!workDays || workDays.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  // Color palette for badges (Mon-Sun)
  const colors = [
    "bg-blue-100 text-blue-800 border-blue-300",
    "bg-green-100 text-green-800 border-green-300",
    "bg-yellow-100 text-yellow-800 border-yellow-300",
    "bg-orange-100 text-orange-800 border-orange-300",
    "bg-purple-100 text-purple-800 border-purple-300",
    "bg-pink-100 text-pink-800 border-pink-300",
    "bg-gray-100 text-gray-800 border-gray-300",
  ];
  const dayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return (
    <div>
      <div className="mb-2 flex gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setShow((v) => !v)}
          className="rounded-full w-8 h-8 flex items-center justify-center"
          aria-label={show ? "Hide Schedule" : "Show Schedule"}
        >
          {show ? <MinusCircle className="w-5 h-5 text-red-500" /> : <PlusCircle className="w-5 h-5 text-green-600" />}
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {show && (
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, scale: 0.95, y: -10, height: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.95, y: -10, height: 0 }}
            style={{ overflow: 'hidden' }}
            transition={{ type: "spring", stiffness: 300, damping: 24, duration: 0.32 }}
          >
            {workDays.map((wd, idx) => {
              const colorIdx = dayOrder.indexOf(wd.day);
              const colorClass = colorIdx >= 0 ? colors[colorIdx] : colors[0];
              return (
                <motion.div
                  key={wd.day}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: idx * 0.04, type: "spring", stiffness: 300, damping: 24 }}
                >
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 text-xs font-medium border ${colorClass} min-w-[250px] justify-start flex`}
                  >
                    <span className="font-semibold mr-1">{DAY_LABELS[wd.day] || wd.day}:</span>
                    {formatTime12Hour(wd.work_start_time)} - {formatTime12Hour(wd.work_end_time)}
                    <span className="ml-2 text-[11px] text-muted-foreground">({getDurationText(wd.work_start_time, wd.work_end_time)})</span>
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
