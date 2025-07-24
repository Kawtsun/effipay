"use client"

import React, { useState, useEffect } from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter } from "lucide-react"
import { employee_status, leave_statuses } from "./employee-status"
import { Badge } from "./ui/badge"
import EmployeeCollegeRadioDepartment from './employee-college-radio-department';

interface FilterState {
  types: string[]
  statuses: string[]
  roles: string[]
  collegeProgram?: string // NEW
}

interface Props {
  selectedTypes: string[]
  selectedStatuses: string[]
  selectedRoles: string[]
  collegeProgram?: string // NEW
  onChange: (filters: FilterState) => void
}

const employee_type = [
  { value: "Full Time", label: "Full Time" },
  { value: "Part Time", label: "Part Time" },
  { value: "Provisionary", label: "Provisionary" },
  { value: "Regular", label: "Regular" },
];

export default function EmployeeFilter({
  selectedTypes,
  selectedStatuses,
  selectedRoles,
  collegeProgram: selectedCollegeProgram = '', // NEW
  onChange,
}: Props) {
  const [open, setOpen] = useState(false)

  // local draft state
  const [types, setTypes] = useState<string[]>(selectedTypes)
  const [statuses, setStatuses] = useState<string[]>(selectedStatuses)
  const [roles, setRoles] = useState<string[]>(selectedRoles)
  const [collegeProgram, setCollegeProgram] = useState<string>(selectedCollegeProgram)

  // sync draft when parent resets
  useEffect(() => {
    setTypes(selectedTypes)
  }, [selectedTypes])

  useEffect(() => {
    setStatuses(selectedStatuses)
  }, [selectedStatuses])

  useEffect(() => {
    setRoles(selectedRoles)
  }, [selectedRoles])

  useEffect(() => {
    setCollegeProgram(selectedCollegeProgram)
  }, [selectedCollegeProgram])

  // toggle single value in array
  function toggle(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  }

  // apply and close
  const handleApply = () => {
    onChange({ types, statuses, roles, collegeProgram })
    setOpen(false)
  }

  // reset and close
  const handleReset = () => {
    setTypes([])
    setStatuses([])
    setRoles([])
    setCollegeProgram('')
    onChange({ types: [], statuses: [], roles: [], collegeProgram: '' })
    setOpen(false)
  }
  const activeCount = selectedTypes.length + selectedStatuses.length + selectedRoles.length

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

        <div>
          <h4 className="text-sm font-semibold mb-1 select-none">Roles</h4>
          <p className="text-xs text-muted-foreground mb-2 select-none">
            Select one or more roles to filter by role.
          </p>
          {['administrator', 'college instructor', 'basic education instructor'].map((role) => (
            <label key={role} className="flex items-center gap-2 mb-1 text-sm select-none">
              <Checkbox
                checked={roles.includes(role)}
                onCheckedChange={() => setRoles(roles.includes(role) ? roles.filter(r => r !== role) : [...roles, role])}
                className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
              />
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </label>
          ))}
          {/* College program radio group, only show if college instructor is checked */}
          {roles.includes('college instructor') && (
            <div className="pl-4 mt-2">
              <div className="text-xs font-semibold mb-1">College Department</div>
              <EmployeeCollegeRadioDepartment
                value={collegeProgram}
                onChange={setCollegeProgram}
                className="max-h-40 overflow-y-auto pr-2"
              />
            </div>
          )}
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
