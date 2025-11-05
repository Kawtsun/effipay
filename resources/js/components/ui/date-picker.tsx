"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string // Format: YYYY-MM-DD
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: (date: Date) => boolean
}

export function DatePicker({ 
  value, 
  onValueChange, 
  placeholder = "Pick a date", 
  className,
  disabled 
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )

  React.useEffect(() => {
    if (value) {
      setDate(new Date(value))
    }
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate && onValueChange) {
      const dateString = format(selectedDate, 'yyyy-MM-dd')
      onValueChange(dateString)
    }
  }

  const defaultDisabled = (date: Date) => {
    // Only allow 15th and 30th of each month, and no future dates
    const day = date.getDate()
    const today = new Date()
    return date > today || (day !== 15 && day !== 30)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start" 
        side="bottom"
        sideOffset={4}
        style={{ zIndex: 20000 }}
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          disabled={disabled || defaultDisabled}
        />
      </PopoverContent>
    </Popover>
  )
} 