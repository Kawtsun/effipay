import * as React from "react";
import { useState } from "react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";







interface TimeKeepingCalendarProps {
  value?: string;
  onChange?: (date: string | undefined) => void;
  markedDates?: string[];
  setMarkedDates?: (dates: string[]) => void;
  originalDates?: string[];
  setOriginalDates?: (dates: string[]) => void;
  onSave?: (args: { addedDates: string[]; removedDates: string[]; localDates: string[]; localOriginal: string[] }) => Promise<boolean>;
}


export function TimeKeepingCalendar({ onChange, markedDates = [], setMarkedDates }: TimeKeepingCalendarProps) {
  // Use only props for marked/original dates (fully controlled)


  // Format date as YYYY-MM-DD in local (Philippines) time
  function toDateString(d: Date) {
    // Convert to Asia/Manila timezone
    const offsetDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    return offsetDate.toISOString().slice(0, 10);
  }

  function handleDayClick(day: Date) {
    const dayStr = toDateString(day);
    // Always convert all dates to YYYY-MM-DD before storing
    const normalizedMarked = markedDates.map(d => toDateString(new Date(d)));
    const alreadyMarked = normalizedMarked.includes(dayStr);
    let newDates;
    if (alreadyMarked) {
      newDates = normalizedMarked.filter((d) => d !== dayStr);
    } else {
      newDates = [...normalizedMarked, dayStr];
    }
    console.log('DEBUG handleDayClick newDates:', newDates);
    if (setMarkedDates) setMarkedDates(newDates);
    if (onChange) onChange(dayStr);
  }





  return (
    <div className="flex flex-col items-center py-4 gap-4">
      {/* Default calendar styling, no custom marked day size */}
      <ShadcnCalendar
        mode="multiple"
  selected={markedDates.map((d: string) => new Date(d))}
        onDayClick={handleDayClick}
        className="rounded-md border shadow"
      />
    </div>
  );
}

