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

// Props now expect a 'YYYY-MM' string
interface PayrollMonthPickerProps {
    value?: string
    onValueChange?: (value: string) => void
    placeholder?: string
    className?: string
}

export function PayrollMonthPicker({
    value,
    onValueChange,
    placeholder = "Select payroll month",
    className
}: PayrollMonthPickerProps) {
    const [month, setMonth] = React.useState<Date | undefined>(
        value ? new Date(value + '-01') : undefined
    )
    const [isOpen, setIsOpen] = React.useState(false); // Control popover visibility

    React.useEffect(() => {
        if (value) {
            setMonth(new Date(value + '-01'))
        } else {
            setMonth(undefined)
        }
    }, [value])

    const handleSelect = (selectedDate: Date | undefined) => {
        if (selectedDate && onValueChange) {
            setMonth(selectedDate);
            const monthString = format(selectedDate, 'yyyy-MM'); // Format to 'YYYY-MM'
            onValueChange(monthString);
            setIsOpen(false); // Close the popover on selection
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !month && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {/* Display format changed to 'Month Year' */}
                    {month ? format(month, "MMMM yyyy") : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={month}
                    onSelect={handleSelect}
                    initialFocus
                    // When the user navigates months without picking, update the view
                    onMonthChange={setMonth}
                />
            </PopoverContent>
        </Popover>
    )
}