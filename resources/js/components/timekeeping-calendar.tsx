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

  function toDateString(d: Date) {
    return d.toISOString().slice(0, 10);
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
    const res = await fetch("/observances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name=\"csrf-token\"]')?.getAttribute('content') || '',
      },
      body: JSON.stringify({ dates: actualMarkedDates }),
    });
    if (res.ok) {
      // Show only YYYY-MM-DD for each date
      const formatted = actualMarkedDates.map(d => d.slice(0, 10)).join(", ");
      toast.success(`Saved days: ${formatted}`);
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

