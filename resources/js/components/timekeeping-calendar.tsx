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
}


export function TimeKeepingCalendar({ onChange, markedDates, setMarkedDates }: TimeKeepingCalendarProps) {
  const [internalMarkedDates, internalSetMarkedDates] = useState<string[]>([]);
  const actualMarkedDates = markedDates !== undefined ? markedDates : internalMarkedDates;
  const actualSetMarkedDates = setMarkedDates !== undefined ? setMarkedDates : internalSetMarkedDates;

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

  async function handleSave() {
    if (actualMarkedDates.length === 0) {
      toast.error("No dates selected.");
      return;
    }
    // Convert all dates to local (Philippines) YYYY-MM-DD before saving
    const localDates = actualMarkedDates.map(d => {
      const date = new Date(d);
      // Manila is UTC+8
      const manila = new Date(date.getTime() + (8 * 60 - date.getTimezoneOffset()) * 60000);
      return manila.toISOString().slice(0, 10);
    });
    const res = await fetch("/observances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name=\"csrf-token\"]')?.getAttribute('content') || '',
      },
      body: JSON.stringify({ dates: localDates }),
    });
    if (res.ok) {
      // Show only YYYY-MM-DD for each date
  toast.success(`Saved days: ${localDates.join(", ")}`);
    } else {
      toast.error("Failed to save dates.");
    }
  }

  return (
    <div className="flex flex-col items-center py-4 gap-4">
      {/* Default calendar styling, no custom marked day size */}
      <ShadcnCalendar
        mode="multiple"
        selected={actualMarkedDates.map(d => new Date(d))}
        onDayClick={handleDayClick}
        className="rounded-md border shadow"
      />
      <Button onClick={handleSave} className="mt-2">Save</Button>
    </div>
  );
}

