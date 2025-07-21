// resources/js/components/employee-status.tsx

"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export const employee_status = [
  { value: "Active", label: "Active" },
];

export const leave_statuses = [
  { value: "Paid Leave", label: "Paid Leave" },
  { value: "Maternity Leave", label: "Maternity Leave" },
  { value: "Sick Leave", label: "Sick Leave" },
  { value: "Study Leave", label: "Study Leave" },
];

export function EmployeeStatus({
  value,
  onChange,
  statuses,
  disabled = false
}: {
  value: string
  onChange: (val: string) => void
  statuses?: string[]
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)

  const allStatuses = [
    { value: 'Active', label: 'Active' },
    { value: 'Paid Leave', label: 'Paid Leave' },
    { value: 'Maternity Leave', label: 'Maternity Leave' },
    { value: 'Sick Leave', label: 'Sick Leave' },
    { value: 'Study Leave', label: 'Study Leave' },
  ];
  let options = allStatuses;
  if (statuses) {
    options = allStatuses.filter(s => statuses.includes(s.value));
  }

  const leaveStatuses = [
    { value: 'Paid Leave', label: 'Paid Leave' },
    { value: 'Maternity Leave', label: 'Maternity Leave' },
    { value: 'Sick Leave', label: 'Sick Leave' },
    { value: 'Study Leave', label: 'Study Leave' },
  ];
  const activeStatus = options.find((es) => es.value === value);
  return (
    <Popover open={open && !disabled} onOpenChange={d => !disabled && setOpen(d)}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={disabled}
        >
          <span className={disabled ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}>
            {activeStatus?.label ?? 'Select status'}
          </span>
          <ChevronsUpDown className="opacity-50 dark:text-gray-400" />
        </Button>
      </PopoverTrigger>
      {!disabled && (
        <PopoverContent className="w-[200px] p-0 shadow-md dark:bg-gray-800">
          <Command>
            <CommandList>
              <CommandGroup>
                {options.filter(es => es.value === 'Active').map((es) => (
                  <CommandItem
                    key={es.value}
                    value={es.value}
                    onSelect={(current) => {
                      onChange(current)
                      setOpen(false)
                    }}
                    className="dark:text-gray-100"
                  >
                    {es.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === es.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Leave">
                {leaveStatuses.filter(ls => options.some(o => o.value === ls.value)).map((es) => (
                  <CommandItem
                    key={es.value}
                    value={es.value}
                    onSelect={(current) => {
                      onChange(current)
                      setOpen(false)
                    }}
                    className="dark:text-gray-100"
                  >
                    {es.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === es.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  )
}
