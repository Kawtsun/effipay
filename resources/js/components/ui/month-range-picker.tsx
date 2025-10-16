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
  // Helpers
  const first7 = (s: string) => (s && s.length >= 7 ? s.slice(0, 7) : s);
  const normalizeYm = (ym: string) => {
    const base = first7(ym);
    const [y, m] = (base || "").split("-");
    const yi = parseInt(y || "", 10);
    const mi = parseInt(m || "", 10);
    if (Number.isNaN(yi) || Number.isNaN(mi)) return base || ym;
    return `${yi}-${String(mi).padStart(2, "0")}`;
  };

  const toOption = (ymRaw: string) => {
    const ym = normalizeYm(ymRaw);
    const [y, m] = ym.split("-");
    const yi = parseInt(y, 10);
    const mi = parseInt(m, 10) - 1; // Date month is 0-based
    const date = new Date(yi, mi, 1);
    const lastDay = new Date(yi, mi + 1, 0).getDate();
    const monthName = date.toLocaleDateString("en-US", { month: "long" });
    return {
      value: ym,
      label: `${monthName} 1 - ${lastDay}, ${y}`,
      y: yi,
      m: mi + 1,
    };
  };

  const genDefaultMonths = (count = 12) => {
    const now = new Date();
    const res: Array<{ value: string; label: string; y: number; m: number }> = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      res.push(toOption(ym));
    }
    return res;
  };

  // Build and sort options (desc), with fallback when empty
  const monthOptions = React.useMemo(() => {
    const base = (availableMonths || []).map(first7).filter(Boolean) as string[];
    const mapped = base.map(toOption);
    const map = new Map<string, { value: string; label: string; y: number; m: number }>();
    for (const o of mapped) map.set(o.value, o);
    const items = map.size > 0 ? Array.from(map.values()) : genDefaultMonths(12);
    items.sort((a, b) => (b.y - a.y) || (b.m - a.m));
    return items.map(({ value, label }) => ({ value, label }));
  }, [availableMonths]);

  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const handleValueChange = (val: string) => {
    onValueChange?.(val);
    setTimeout(() => {
      triggerRef.current?.blur();
    }, 0);
  };

  const normalizedValue = value ? normalizeYm(value) : undefined;

  return (
    <Select value={normalizedValue} onValueChange={handleValueChange}>
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
