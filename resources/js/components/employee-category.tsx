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

export const employee_category = [
  { value: "Teaching", label: "Teaching" },
  { value: "Non-Teaching", label: "Non-Teaching" },
]

export function EmployeeCategory({
  value,
  onChange,
  disableActive = false,
}: {
  value: string
  onChange: (val: string) => void
  disableActive?: boolean
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
            {employee_category.find((ec) => ec.value === value)?.label ||
              "Select category"}
          </span>
          <ChevronsUpDown className="opacity-50 dark:text-gray-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0 shadow-md dark:bg-gray-800">
        <Command>
          <CommandList>
            <CommandGroup>
              {employee_category.map((ec) => (
                <CommandItem
                  key={ec.value}
                  value={ec.value}
                  onSelect={(current) => {
                    if (disableActive && current === value) return;
                    onChange(current)
                    setOpen(false)
                  }}
                  className={`dark:text-gray-100 ${disableActive && ec.value === value ? 'pointer-events-none opacity-60' : ''}`}
                >
                  {ec.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === ec.value ? "opacity-100" : "opacity-0"
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