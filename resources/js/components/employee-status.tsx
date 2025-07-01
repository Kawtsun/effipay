"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
//   CommandEmpty,
  CommandGroup,
//   CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const employee_status = [
  {
    value: "Active",
    label: "Active",
  },
  {
    value: "Paid Leave",
    label: "Paid Leave",
  },
  {
    value: "Maternity Leave",
    label: "Maternity Leave",
  },
]

export function EmployeeStatus({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? employee_status.find((employee_status) => employee_status.value === value)?.label
            : "Select employee status"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          {/* <CommandInput placeholder="Search employee type..." className="h-9" /> */}
          <CommandList>
            {/* <CommandEmpty>No employee type found.</CommandEmpty> */}
            <CommandGroup>
              {employee_status.map((employee_status) => (
                <CommandItem
                  key={employee_status.value}
                  value={employee_status.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {employee_status.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === employee_status.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
