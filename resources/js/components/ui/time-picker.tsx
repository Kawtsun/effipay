"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  className?: string
}

export function TimePicker({
  value,
  onChange,
  label,
  placeholder = "Select time",
  className,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedHour, setSelectedHour] = React.useState<number>(0)
  const [selectedMinute, setSelectedMinute] = React.useState<number>(0)
  const [isAM, setIsAM] = React.useState<boolean>(true)

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number)
      setSelectedHour(hours % 12 || 12)
      setSelectedMinute(minutes)
      setIsAM(hours < 12)
    }
  }, [value])

  const formatTime = (hour: number, minute: number, am: boolean) => {
    const displayHour = hour === 0 ? 12 : hour
    const displayMinute = minute.toString().padStart(2, '0')
    const period = am ? 'AM' : 'PM'
    return `${displayHour}:${displayMinute} ${period}`
  }

  const format24Hour = (hour: number, minute: number, am: boolean) => {
    let hour24 = hour
    if (!am && hour !== 12) hour24 += 12
    if (am && hour === 12) hour24 = 0
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  const handleTimeSelect = (hour: number, minute: number, am: boolean) => {
    setSelectedHour(hour)
    setSelectedMinute(minute)
    setIsAM(am)
    const time24 = format24Hour(hour, minute, am)
    onChange(time24)
    setIsOpen(false)
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className={cn("grid gap-2", className)}>
      {label && <Label>{label}</Label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            {value ? formatTime(selectedHour, selectedMinute, isAM) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <div className="grid grid-cols-3 gap-2">
              {/* Hours */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Hour</Label>
                <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto">
                  {hours.map((hour) => (
                    <Button
                      key={hour}
                      variant={selectedHour === hour ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeSelect(hour, selectedMinute, isAM)}
                      className="h-8"
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Minutes */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Minute</Label>
                <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto">
                  {minutes.map((minute) => (
                    <Button
                      key={minute}
                      variant={selectedMinute === minute ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTimeSelect(selectedHour, minute, isAM)}
                      className="h-8"
                    >
                      {minute.toString().padStart(2, '0')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* AM/PM */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Period</Label>
                <div className="space-y-1">
                  <Button
                    variant={isAM ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeSelect(selectedHour, selectedMinute, true)}
                    className="w-full h-8"
                  >
                    AM
                  </Button>
                  <Button
                    variant={!isAM ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeSelect(selectedHour, selectedMinute, false)}
                    className="w-full h-8"
                  >
                    PM
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
} 