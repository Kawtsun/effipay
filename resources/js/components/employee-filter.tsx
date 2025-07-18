"use client"

import React, { useState, useEffect } from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter } from "lucide-react"
import { employee_type } from "./employee-type"
import { employee_status, leave_statuses } from "./employee-status"
import { Badge } from "./ui/badge"

interface FilterState {
  types: string[]
  statuses: string[]
}

interface Props {
  selectedTypes: string[]
  selectedStatuses: string[]
  onChange: (filters: FilterState) => void
}

export default function EmployeeFilter({
  selectedTypes,
  selectedStatuses,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false)

  // local draft state
  const [types, setTypes] = useState<string[]>(selectedTypes)
  const [statuses, setStatuses] = useState<string[]>(selectedStatuses)

  // sync draft when parent resets
  useEffect(() => {
    setTypes(selectedTypes)
  }, [selectedTypes])

  useEffect(() => {
    setStatuses(selectedStatuses)
  }, [selectedStatuses])

  // toggle single value in array
  function toggle(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  }

  // apply and close
  const handleApply = () => {
    onChange({ types, statuses })
    setOpen(false)
  }

  // reset and close
  const handleReset = () => {
    setTypes([])
    setStatuses([])
    onChange({ types: [], statuses: [] })
    setOpen(false)
  }
  const activeCount = selectedTypes.length + selectedStatuses.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-full"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>


      <PopoverContent className="w-64 p-4 space-y-5">
        <div>
          <h4 className="text-sm font-semibold mb-1 select-none">Employee Type</h4>
          <p className="text-xs text-muted-foreground mb-2 select-none">
            Select one or more types to filter by employment classification.
          </p>
          {employee_type.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 mb-1 text-sm select-none">
              <Checkbox
                checked={types.includes(value)}
                onCheckedChange={() => setTypes(toggle(types, value))}
                className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
              />

              {label}
            </label>
          ))}
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-1 select-none">Employee Status</h4>
          <p className="text-xs text-muted-foreground mb-2 select-none">
            Filter employees by their current work status.
          </p>
          {employee_status.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 mb-1 text-sm select-none">
              <Checkbox
                checked={statuses.includes(value)}
                onCheckedChange={() => setStatuses(toggle(statuses, value))}
                className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
              />
              {label}
            </label>
          ))}
          <div className="mt-2 mb-1 text-xs font-semibold text-muted-foreground select-none">Leave</div>
          {leave_statuses.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 mb-1 text-sm select-none">
              <Checkbox
                checked={statuses.includes(value)}
                onCheckedChange={() => setStatuses(toggle(statuses, value))}
                className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t mt-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>

    </Popover>
  )
}
