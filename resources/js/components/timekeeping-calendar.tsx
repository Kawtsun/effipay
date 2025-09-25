import * as React from "react";
import { useState } from "react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";

import { Button } from "./ui/button";
import { toast } from "sonner";


interface TimeKeepingCalendarProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
}

export default function TimeKeepingCalendar({ value, onChange }: TimeKeepingCalendarProps) {
  const [markedDates, setMarkedDates] = useState<Date[]>([]);
  const [lastSelected, setLastSelected] = useState<Date | undefined>(undefined);

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function handleDayClick(day: Date) {
    const alreadyMarked = markedDates.some(d => isSameDay(d, day));
    if (alreadyMarked) {
      setMarkedDates(markedDates.filter(d => !isSameDay(d, day)));
    } else {
      setMarkedDates([...markedDates, day]);
    }
    setLastSelected(day);
    if (onChange) onChange(day);
  }

  async function handleSave() {
    if (markedDates.length === 0) {
      toast.error("No dates selected.");
      return;
    }
    function formatLocalDate(d: Date) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const res = await fetch("/observances", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
      },
      body: JSON.stringify({ dates: markedDates.map(formatLocalDate) }),
    });
    if (res.ok) {
      const days = markedDates.map(d => d.getDate()).sort((a, b) => a - b).join(", ");
      toast.success(`Saved days: ${days}`);
    } else {
      toast.error("Failed to save dates.");
    }
  }

  return (
    <div className="flex flex-col items-center py-4 gap-4">
      {/* Default calendar styling, no custom marked day size */}
      <ShadcnCalendar
        mode="multiple"
        selected={markedDates}
        onDayClick={handleDayClick}
        className="rounded-md border shadow"
      />
      <Button onClick={handleSave} className="mt-2">Save</Button>
    </div>
  );
}
