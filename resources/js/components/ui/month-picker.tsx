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
  // Use available months from API if provided, otherwise generate default options
  const monthOptions = availableMonths.length > 0 
    ? availableMonths.map(month => {
        const [year, monthNum] = month.split('-')
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
        return {
          value: month,
          label: date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
          })
        }
      })
    : []

  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Wrap the onValueChange to blur after change
  const handleValueChange = (val: string) => {
    onValueChange?.(val);
    // Blur the select trigger after change
    setTimeout(() => {
      triggerRef.current?.blur();
    }, 0);
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
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