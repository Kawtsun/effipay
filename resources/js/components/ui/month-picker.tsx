"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MonthPickerProps {
  value?: string // Format: YYYY-MM
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  availableMonths?: string[] // Array of available months from API
}

export function MonthPicker({
  value,
  onValueChange,
  placeholder = "Select month",
  className,
  availableMonths
}: MonthPickerProps) {
  // Helpers
  const normalizeYm = (ym: string) => {
    const base = (ym || '').slice(0, 7)
    const [y, m] = base.split('-')
    const yi = parseInt(y || '', 10)
    const mi = parseInt(m || '', 10)
    if (Number.isNaN(yi) || Number.isNaN(mi)) return base || ym
    return `${yi}-${String(mi).padStart(2, '0')}`
  }

  const [fetchedMonths, setFetchedMonths] = React.useState<string[] | undefined>(undefined)

  // If caller didn't provide availableMonths, fetch the processed payroll months and use that.
  React.useEffect(() => {
    let mounted = true
    if (!Array.isArray(availableMonths)) {
      // fetch payroll-only months
      fetch('/payroll/processed-months')
        .then((r) => r.json())
        .then((d) => {
          if (!mounted) return
          if (d && d.success && Array.isArray(d.months)) {
            setFetchedMonths(d.months)
          } else {
            setFetchedMonths([])
          }
        })
        .catch(() => {
          if (!mounted) return
          setFetchedMonths([])
        })
    }
    return () => { mounted = false }
  }, [availableMonths])

  const monthOptions = React.useMemo(() => {
    const source = Array.isArray(availableMonths) ? availableMonths : (Array.isArray(fetchedMonths) ? fetchedMonths : undefined)
    // If source is explicitly an array:
    if (Array.isArray(source)) {
      if (source.length === 0) return []
      const mapped = source.map((m) => normalizeYm(m)).filter(Boolean) as string[]
      const dedup = new Map<string, { value: string; label: string; y: number; m: number }>()
      for (const n of mapped) {
        const [y, m] = n.split('-')
        const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
        dedup.set(n, { value: n, label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }), y: parseInt(y, 10), m: parseInt(m, 10) })
      }
      const items = Array.from(dedup.values())
      items.sort((a, b) => (b.y - a.y) || (b.m - a.m))
      return items.map(({ value, label }) => ({ value, label }))
    }

    // If source is undefined (fetch in progress or neither provided), show no months (do not fallback to last-12)
    return []
  }, [availableMonths, fetchedMonths])

  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Wrap the onValueChange to blur after change
  const handleValueChange = (val: string) => {
    onValueChange?.(val);
    // Blur the select trigger after change
    setTimeout(() => {
      triggerRef.current?.blur();
    }, 0);
  };

  const normalizedValue = value ? normalizeYm(value) : undefined

  return (
    <Select value={normalizedValue} onValueChange={handleValueChange}>
      <SelectTrigger ref={triggerRef} className={cn("w-[200px]", className)}>
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
  )
} 