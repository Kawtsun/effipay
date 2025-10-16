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
  availableMonths = []
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

  const toOption = (ym: string) => {
    const n = normalizeYm(ym)
    const [y, m] = n.split('-')
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
    return {
      value: n,
      label: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      }),
      y: parseInt(y, 10),
      m: parseInt(m, 10)
    }
  }

  const genDefaultMonths = (count = 12) => {
    const now = new Date()
    const list: Array<{ value: string; label: string; y: number; m: number }> = []
    for (let i = 0; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      list.push(toOption(ym))
    }
    return list
  }

  const monthOptions = React.useMemo(() => {
    const base = (availableMonths || []).map((m) => normalizeYm(m)).filter(Boolean) as string[]
    const mapped = base.map(toOption)
    const dedup = new Map<string, { value: string; label: string; y: number; m: number }>()
    for (const o of mapped) dedup.set(o.value, o)
    const items = dedup.size > 0 ? Array.from(dedup.values()) : genDefaultMonths(12)
    items.sort((a, b) => (b.y - a.y) || (b.m - a.m))
    return items.map(({ value, label }) => ({ value, label }))
  }, [availableMonths])

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