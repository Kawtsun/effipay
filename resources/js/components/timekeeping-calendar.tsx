
import { toast } from 'sonner';
import * as React from "react";
import { useState } from "react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";









interface TimeKeepingCalendarProps {
  value?: string;
  onChange?: (date: string | undefined) => void;
  markedDates?: string[];
  setMarkedDates?: (dates: string[]) => void;
  automatedDates?: string[];
  singleSelect?: boolean; // if true, only one date is selected at a time
}

export function TimeKeepingCalendar({ onChange, markedDates = [], setMarkedDates, automatedDates = [], singleSelect = false }: TimeKeepingCalendarProps) {
  // Use only props for marked/original dates (fully controlled)


  // Format date as YYYY-MM-DD in local (Philippines) time
  function toDateString(d: Date) {
    // Convert to Asia/Manila timezone
    const offsetDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    return offsetDate.toISOString().slice(0, 10);
  }

  // Compute automated days for quick lookup
  const automatedSet = new Set((automatedDates || []).map(d => toDateString(new Date(d))));

  function handleDayClick(day: Date) {
    const dayStr = toDateString(day);
    if (automatedSet.has(dayStr)) {
      toast.info('This date is a public holiday and cannot be changed.');
      return;
    }
    // Single-select mode selects one primary day but does not clear existing marked dates
    if (singleSelect) {
      const normalizedMarked = markedDates.map(d => toDateString(new Date(d)));
      const isPrimary = normalizedMarked[0];
      // Toggle if clicking the same primary day; otherwise replace primary but keep the rest
      let newDates: string[];
      if (isPrimary === dayStr) {
        newDates = normalizedMarked.slice(1); // remove primary
      } else {
        newDates = [dayStr, ...normalizedMarked.filter(d => d !== dayStr)];
      }
      if (setMarkedDates) setMarkedDates(newDates);
      if (onChange) onChange(dayStr);
      return;
    }

    // Multi-select toggle behavior (legacy)
    const normalizedMarked = markedDates.map(d => toDateString(new Date(d)));
    const alreadyMarked = normalizedMarked.includes(dayStr);
    const newDates = alreadyMarked
      ? normalizedMarked.filter((d) => d !== dayStr)
      : [...normalizedMarked, dayStr];
    if (setMarkedDates) setMarkedDates(newDates);
    if (onChange) onChange(dayStr);
  }





  // Only block toggling automated dates, no custom styling
  return (
    <div className="flex flex-col items-center py-4 gap-4">
      {singleSelect ? (
        <ShadcnCalendar
          mode="single"
          selected={markedDates[0] ? new Date(markedDates[0]) : undefined}
          onDayClick={handleDayClick}
          className="rounded-md border shadow"
        />
      ) : (
        <ShadcnCalendar
          mode="multiple"
          selected={markedDates.map((d: string) => new Date(d))}
          onDayClick={handleDayClick}
          className="rounded-md border shadow"
        />
      )}
    </div>
  );
}

