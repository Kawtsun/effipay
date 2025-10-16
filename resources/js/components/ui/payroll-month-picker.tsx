"use client"

import * as React from "react"
import { format, getYear, getMonth, setMonth, setYear } from "date-fns"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// --- Helper Data for Dropdowns ---

const CURRENT_DATE = new Date(); // Assumed to be Oct 2025 based on context
const CURRENT_YEAR = getYear(CURRENT_DATE); // 2025
const MIN_YEAR = 2020; // Start year for the dropdown
const MAX_YEAR = CURRENT_YEAR;

const years = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

const months = Array.from({ length: 12 }, (_, i) => ({
    value: i, // 0 for Jan, 11 for Dec
    label: format(setMonth(new Date(), i), 'MMMM'),
}));

// Props now expect a 'YYYY-MM-DD' string (to satisfy the database)
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
    const initialDate = value ? new Date(value) : new Date();

    const [selectedDate, setSelectedDate] = React.useState(initialDate);
    const [isOpen, setIsOpen] = React.useState(false);

    // --- Handlers for Dropdown Changes ---

    const handleMonthChange = (monthIndexString: string) => {
        const monthIndex = parseInt(monthIndexString);
        let newDate = setMonth(selectedDate, monthIndex);
        setSelectedDate(newDate);

        // CRITICAL FIX: Close the main popover immediately after month selection
        setIsOpen(false);
    };

    const handleYearChange = (yearString: string) => {
        const year = parseInt(yearString);
        let newDate = setYear(selectedDate, year);
        setSelectedDate(newDate);

        // CRITICAL FIX: Close the main popover immediately after year selection
        setIsOpen(false);
    };

    // --- Effect to Handle External Value Prop Changes ---
    React.useEffect(() => {
        if (value) {
            setSelectedDate(new Date(value));
        }
    }, [value])

    // --- Effect to Sync Selection when Popover Closes (Now redundant, but kept for cleanup) ---
    React.useEffect(() => {
        // This runs when setIsOpen(false) is called in the handlers
        if (!isOpen && onValueChange && selectedDate) {
            // Format to 'YYYY-MM-DD' (always using the first day of the month)
            const newMonthString = format(selectedDate, 'yyyy-MM-01');
            onValueChange(newMonthString);
        }
    }, [isOpen, selectedDate, onValueChange])


    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        className,
                        !value && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {/* Display the selected month/year */}
                    {value ? format(new Date(value), "MMMM yyyy") : placeholder}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[300px] p-4 flex justify-between space-x-2">

                {/* 1. Month Dropdown */}
                <Select
                    value={getMonth(selectedDate).toString()}
                    onValueChange={handleMonthChange}
                >
                    <SelectTrigger className="w-1/2">
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    {/* Max height for all months to be visible */}
                    <SelectContent className="max-h-100">
                        {months.map((month) => (
                            <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* 2. Year Dropdown */}
                <Select
                    value={getYear(selectedDate).toString()}
                    onValueChange={handleYearChange}
                >
                    <SelectTrigger className="w-1/2">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                                {year}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </PopoverContent>
        </Popover>
    )
}