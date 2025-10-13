"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContentInline,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import TimePickerScrollArea from "@/components/time-picker-scroll-area"

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
  const [draftHour, setDraftHour] = React.useState<number>(0)
  const [draftMinute, setDraftMinute] = React.useState<number>(0)
  const [draftIsAM, setDraftIsAM] = React.useState<boolean>(true)

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number)
      const sh = hours % 12 || 12
      const sm = minutes
      const sam = hours < 12
      setSelectedHour(sh)
      setSelectedMinute(sm)
      setIsAM(sam)
      // initialize drafts to the committed value
      setDraftHour(sh)
      setDraftMinute(sm)
      setDraftIsAM(sam)
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

  // When interacting with the popover, update draft values only.
  const handleTimeSelect = (hour: number, minute: number, am: boolean) => {
    setDraftHour(hour)
    setDraftMinute(minute)
    setDraftIsAM(am)
  }

  const handleConfirm = () => {
    setSelectedHour(draftHour)
    setSelectedMinute(draftMinute)
    setIsAM(draftIsAM)
    const time24 = format24Hour(draftHour, draftMinute, draftIsAM)
    onChange(time24)
    setIsOpen(false)
  }

  const handleCancel = () => {
    // revert drafts to committed value and close
    setDraftHour(selectedHour)
    setDraftMinute(selectedMinute)
    setDraftIsAM(isAM)
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
  <PopoverContentInline className="w-auto p-0" align="start">
          <div className="p-3">
            <div className="grid grid-cols-3 gap-2">
              {/* Hours */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Hour</Label>
                <TimePickerScrollArea>
                  <div className="grid grid-cols-3 gap-1">
                    {hours.map((hour) => (
                      <Button
                        key={hour}
                        variant={draftHour === hour ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTimeSelect(hour, draftMinute, draftIsAM)}
                        className="h-8"
                      >
                        {hour}
                      </Button>
                    ))}
                  </div>
                </TimePickerScrollArea>
              </div>

              {/* Minutes */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Minute</Label>
                <TimePickerScrollArea>
                  <div className="grid grid-cols-3 gap-1">
                    {minutes.map((minute) => (
                      <Button
                        key={minute}
                        variant={draftMinute === minute ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTimeSelect(draftHour, minute, draftIsAM)}
                        className="h-8"
                      >
                        {minute.toString().padStart(2, '0')}
                      </Button>
                    ))}
                  </div>
                </TimePickerScrollArea>
              </div>

              {/* AM/PM */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Period</Label>
                  <div className="space-y-1">
                  <Button
                    variant={draftIsAM ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeSelect(draftHour, draftMinute, true)}
                    className="w-full h-8"
                  >
                    AM
                  </Button>
                  <Button
                    variant={!draftIsAM ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeSelect(draftHour, draftMinute, false)}
                    className="w-full h-8"
                  >
                    PM
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t px-3 py-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm}>
              OK
            </Button>
          </div>
  </PopoverContentInline>
      </Popover>
    </div>
  )
} 