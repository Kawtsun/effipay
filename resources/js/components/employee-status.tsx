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
}: {
  value: string
  onChange: (val: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <span className="text-gray-900 dark:text-gray-100">
            {employee_status.concat(leave_statuses).find((es) => es.value === value)?.label ??
              "Select status"}
          </span>
          <ChevronsUpDown className="opacity-50 dark:text-gray-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0 shadow-md dark:bg-gray-800">
        <Command>
          <CommandList>
            <CommandGroup>
              {employee_status.map((es) => (
                <CommandItem
                  key={es.value}
                  value={es.value}
                  onSelect={(current) => {
                    onChange(current)  // always select, never deselect
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
              {leave_statuses.map((es) => (
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
    </Popover>
  )
}
