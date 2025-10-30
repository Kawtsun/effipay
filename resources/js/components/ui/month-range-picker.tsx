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
  availableMonths,
}: MonthRangePickerProps) {
  // Helpers

  const [fetchedMonths, setFetchedMonths] = React.useState<string[] | undefined>(undefined);

  // If availableMonths isn't provided by caller, fetch payroll-only months
  React.useEffect(() => {
    let mounted = true;
    if (!Array.isArray(availableMonths)) {
      fetch('/payroll/processed-months')
        .then((r) => r.json())
        .then((d) => {
          if (!mounted) return;
          if (d && d.success && Array.isArray(d.months)) setFetchedMonths(d.months);
          else setFetchedMonths([]);
        })
        .catch(() => { if (mounted) setFetchedMonths([]); });
    }
    return () => { mounted = false };
  }, [availableMonths]);

  // Build and sort options (desc). If source array is empty -> no months. If undefined -> fetch in progress -> no months.
  const monthOptions = React.useMemo(() => {
    const source = Array.isArray(availableMonths)
      ? availableMonths
      : (Array.isArray(fetchedMonths) ? fetchedMonths : undefined);
    if (!Array.isArray(source) || source.length === 0) return [];

    const map = new Map<string, { value: string; label: string; y: number; m: number }>();
    for (const raw of source) {
      if (!raw) continue;
      const base = raw && raw.length >= 7 ? raw.slice(0, 7) : raw;
      const [y, m] = (base || "").split("-");
      const yi = parseInt(y || "", 10);
      const mi = parseInt(m || "", 10);
      const ym = (Number.isNaN(yi) || Number.isNaN(mi)) ? (base || raw) : `${yi}-${String(mi).padStart(2, "0")}`;

      const [yy, mm] = ym.split("-");
      const yyi = parseInt(yy || "", 10);
      const mmi = parseInt(mm || "", 10) - 1; // Date month 0-based
      if (Number.isNaN(yyi) || Number.isNaN(mmi)) continue;
      const date = new Date(yyi, mmi, 1);
      const lastDay = new Date(yyi, mmi + 1, 0).getDate();
      const monthName = date.toLocaleDateString("en-US", { month: "long" });
      const label = `${monthName} 1 - ${lastDay}, ${yy}`;
      map.set(ym, { value: ym, label, y: yyi, m: mmi + 1 });
    }

    const items = Array.from(map.values());
    items.sort((a, b) => (b.y - a.y) || (b.m - a.m));
    return items.map(({ value, label }) => ({ value, label }));
  }, [availableMonths, fetchedMonths]);

  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const handleValueChange = (val: string) => {
    onValueChange?.(val);
    setTimeout(() => {
      triggerRef.current?.blur();
    }, 0);
  };

  const normalizedValue = value ? (value && value.length >= 7 ? value.slice(0, 7) : value) : undefined;

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
