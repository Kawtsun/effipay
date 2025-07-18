// resources/js/components/employee-type.tsx

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export const employee_type = [
  { value: "Full Time", label: "Full Time" },
  { value: "Part Time", label: "Part Time" },
  { value: "Provisionary", label: "Provisionary" },
]

export function EmployeeType({
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
            {employee_type.find((et) => et.value === value)?.label ||
              "Select type"}
          </span>
          <ChevronsUpDown className="opacity-50 dark:text-gray-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0 shadow-md dark:bg-gray-800">
        <Command>
          <CommandList>
            <CommandGroup>
              {employee_type.map((et) => (
                <CommandItem
                  key={et.value}
                  value={et.value}
                  onSelect={(current) => {
                    onChange(current)  // always pick—never clear to ""
                    setOpen(false)
                  }}
                  className="dark:text-gray-100"
                >
                  {et.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === et.value ? "opacity-100" : "opacity-0"
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
