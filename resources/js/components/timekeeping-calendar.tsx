import * as React from "react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";

interface TimeKeepingCalendarProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
}

export default function TimeKeepingCalendar({ value, onChange }: TimeKeepingCalendarProps) {
  return (
    <div className="flex justify-center py-4">
      <ShadcnCalendar
        mode="single"
        selected={value}
        onSelect={onChange}
        className="rounded-md border shadow"
      />
    </div>
  );
}
