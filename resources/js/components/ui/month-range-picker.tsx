import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthRangePickerProps {
  value?: string; // Format: YYYY-MM
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  availableMonths?: string[]; // Array of available months from API
}

export function MonthRangePicker({
  value,
  onValueChange,
  placeholder = "Select month",
  className,
  availableMonths = [],
}: MonthRangePickerProps) {
  // Format months as "August 1 - 31, 2025"
  const monthOptions = availableMonths.length > 0
    ? availableMonths.map((month) => {
        const [year, monthNum] = month.split("-");
        const y = parseInt(year);
        const m = parseInt(monthNum) - 1;
        const date = new Date(y, m, 1);
        const lastDay = new Date(y, m + 1, 0).getDate();
        const monthName = date.toLocaleDateString("en-US", { month: "long" });
        return {
          value: month,
          label: `${monthName} 1 - ${lastDay}, ${year}`,
        };
      })
    : [];

  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const handleValueChange = (val: string) => {
    onValueChange?.(val);
    setTimeout(() => {
      triggerRef.current?.blur();
    }, 0);
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger ref={triggerRef} className={cn("w-[240px]", className)}>
        <CalendarIcon className="mr-2 h-4 w-4" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {monthOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
