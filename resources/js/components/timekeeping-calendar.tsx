import * as React from "react";
import { useState } from "react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";

import { Button } from "./ui/button";
import { toast } from "sonner";




interface TimeKeepingCalendarProps {
  value?: string;
  onChange?: (date: string | undefined) => void;
  markedDates?: string[];
  setMarkedDates?: (dates: string[]) => void;
  originalDates?: string[];
  setOriginalDates?: (dates: string[]) => void;
}


export function TimeKeepingCalendar({ onChange, markedDates, setMarkedDates, originalDates, setOriginalDates }: TimeKeepingCalendarProps) {
  const [internalMarkedDates, internalSetMarkedDates] = useState<string[]>([]);
  const actualMarkedDates = markedDates !== undefined ? markedDates : internalMarkedDates;
  const actualSetMarkedDates = setMarkedDates !== undefined ? setMarkedDates : internalSetMarkedDates;
  const actualOriginalDates = originalDates !== undefined ? originalDates : [];
  const actualSetOriginalDates = (typeof setOriginalDates === 'function') ? setOriginalDates : undefined;

  // Format date as YYYY-MM-DD in local (Philippines) time
  function toDateString(d: Date) {
    // Convert to Asia/Manila timezone
    const offsetDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    return offsetDate.toISOString().slice(0, 10);
  }

  function handleDayClick(day: Date) {
    const dayStr = toDateString(day);
    const alreadyMarked = actualMarkedDates.includes(dayStr);
    if (alreadyMarked) {
      actualSetMarkedDates(actualMarkedDates.filter((d) => d !== dayStr));
    } else {
      actualSetMarkedDates([...actualMarkedDates, dayStr]);
    }
    if (onChange) onChange(dayStr);
  }

  function arraysEqual(a?: string[], b?: string[]) {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((v, i) => v === sortedB[i]);
  }

  async function handleSave() {
    if (actualMarkedDates.length === 0) {
      toast.error("No dates selected.");
      return;
    }
    // Convert all dates to local (Philippines) YYYY-MM-DD before saving
    const localDates = actualMarkedDates.map((d: string) => {
      const date = new Date(d);
      // Manila is UTC+8
      const manila = new Date(date.getTime() + (8 * 60 - date.getTimezoneOffset()) * 60000);
      return manila.toISOString().slice(0, 10);
    });
    // Compare with originalDates (also converted to local)
    const localOriginal = (actualOriginalDates || []).map((d: string) => {
      const date = new Date(d);
      const manila = new Date(date.getTime() + (8 * 60 - date.getTimezoneOffset()) * 60000);
      return manila.toISOString().slice(0, 10);
    });
    if (arraysEqual(localDates, localOriginal)) {
      toast.info("No changes to save.");
      return;
    }
    const res = await fetch("/observances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
      body: JSON.stringify({ dates: localDates }),
    });
    if (res.ok) {
      // Only show newly added dates in the toast
      const newDates = localDates.filter((d: string) => !localOriginal.includes(d));
      if (newDates.length > 0) {
        toast.success(`Saved days: ${newDates.join(", ")}`);
      } else {
        toast.info("No new days were added.");
      }
      // Update parent's originalDates state after successful save
      if (typeof actualSetOriginalDates === 'function') {
        actualSetOriginalDates([...localDates]);
      }
    } else {
      toast.error("Failed to save dates.");
    }
  }

  return (
    <div className="flex flex-col items-center py-4 gap-4">
      {/* Default calendar styling, no custom marked day size */}
      <ShadcnCalendar
        mode="multiple"
        selected={actualMarkedDates.map((d: string) => new Date(d))}
        onDayClick={handleDayClick}
        className="rounded-md border shadow"
      />
      <Button onClick={handleSave} className="mt-2">Save</Button>
    </div>
  );
}

