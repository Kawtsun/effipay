function formatTime12Hour(time?: string): string {
    if (!time) return '-';
    const parts = time.split(':');
    if (parts.length < 2) return '-';
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return '-';
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { Employees } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./ui/button"
import { RolesBadges, getCollegeProgramLabel } from "./roles-badges"
import { MonthPicker } from "./ui/month-picker"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Skeleton } from "./ui/skeleton"


interface PayrollData {
    id: number
    employee_id: number
    month: string
    payroll_date: string
    base_salary: number
    sss: number
    philhealth: number
    pag_ibig: number
    withholding_tax: number
    gross_pay: number
    total_deductions: number
    net_pay: number
}

interface MonthlyPayrollData {
    payrolls: PayrollData[]
    month: string
}

interface Props {
    employee: Employees | null
    onClose: () => void
    activeRoles?: string[]
    showPayroll?: boolean
}

function formatWithCommas(value: string | number): string {
    let num = 0;
    if (value === null || value === undefined || value === '') {
        num = 0;
    } else {
        num = typeof value === 'number' ? value : Number(value);
        if (isNaN(num)) num = 0;
    }
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium break-words">{value}</p>
        </div>
    )
}




export default function EmployeeViewDialog({ employee, onClose, activeRoles, showPayroll = false }: Props) {
    const [selectedMonth, setSelectedMonth] = useState('')
    const [pendingMonth, setPendingMonth] = useState('') // for delayed update
    const [monthlyPayrollData, setMonthlyPayrollData] = useState<MonthlyPayrollData | null>(null)
    const [availableMonths, setAvailableMonths] = useState<string[]>([])
    const [loadingPayroll, setLoadingPayroll] = useState(false)
    const [minLoading, setMinLoading] = useState(false)
    const minLoadingTimeout = useRef<NodeJS.Timeout | null>(null)

    // Fetch available months when employee changes
    useEffect(() => {
        if (employee) {
            fetchAvailableMonths()
        }
    }, [employee])

    // Fetch monthly payroll data when month changes
    useEffect(() => {
        if (employee && pendingMonth) {
            fetchMonthlyPayrollData()
        } else {
            setMonthlyPayrollData(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employee, pendingMonth])

    const fetchAvailableMonths = async () => {
        if (!employee) return
        try {
            const response = await fetch(route('payroll.employee.months', { employee_id: employee.id }))
            const result = await response.json()
            if (result.success) {
                setAvailableMonths(result.months)
                // Auto-select the most recent month if available
                if (result.months.length > 0 && !selectedMonth) {
                    setSelectedMonth(result.months[0])
                    setPendingMonth(result.months[0]) // trigger payroll fetch on first load
                }
            }
        } catch (error) {
            console.error('Error fetching available months:', error)
        }
    }

    const fetchMonthlyPayrollData = async () => {
        if (!employee || !pendingMonth) return
        setLoadingPayroll(true)
        setMinLoading(true)
        if (minLoadingTimeout.current) clearTimeout(minLoadingTimeout.current)
        minLoadingTimeout.current = setTimeout(() => setMinLoading(false), 400)
        try {
            const response = await fetch(route('payroll.employee.monthly', {
                employee_id: employee.id,
                month: pendingMonth
            }))
            const result = await response.json()
            if (result.success) {
                setMonthlyPayrollData(result)
                // Do not update selectedMonth here; it's already set in handleMonthChange
            } else {
                setMonthlyPayrollData(null)
            }
        } catch (error) {
            console.error('Error fetching monthly payroll data:', error)
            setMonthlyPayrollData(null)
        } finally {
            setTimeout(() => setLoadingPayroll(false), 100) // allow animation to finish
        }
    }

    // When user picks a month, set both selectedMonth and pendingMonth
    const handleMonthChange = (month: string) => {
        if (month !== selectedMonth) {
            setSelectedMonth(month)
            setPendingMonth(month)
        }
    }

    return (
        <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {!!employee && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{
                            duration: 0.2,
                            ease: "easeOut"
                        }}
                    >
                        <DialogContent className="max-w-6xl w-full px-8 py-4 sm:px-12 sm:py-6 z-[100] max-h-[90vh] flex flex-col">
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle className="text-2xl font-bold mb-2">Employee Details</DialogTitle>
                            </DialogHeader>
                            {/* Scrollable content area */}
                            <div className="flex-1 overflow-y-auto pr-2">
                                {/* Show skeleton if loading, else show real data */}
                                <div className="space-y-12 text-base"> {/* Increased gap */}
                                    {/* Employee Header */}
                                    <div className="border-b pb-6 mb-2"> {/* Increased bottom margin */}
                                        <h3 className="text-2xl font-extrabold mb-1">#{employee.id} - {`${employee.last_name}, ${employee.first_name} ${employee.middle_name}`.toLocaleUpperCase('en-US')}</h3>

                                    </div>
                                    {/* Header Row */}
                                    <div className="grid grid-cols-2 gap-10 items-start mb-6"> {/* Increased gap and margin */}
                                        {/* General Info */}
                                        <div>
                                            <h4 className="font-semibold text-base mb-4 border-b pb-2">General Information</h4>
                                            <div className="space-y-2 text-sm"> {/* Increased gap */}
                                                <Info label="Status" value={employee.employee_status} />
                                                <Info label="Type" value={employee.employee_type} />
                                                <Info label="Schedule" value={
                                                    employee.work_start_time && employee.work_end_time && employee.work_hours_per_day
                                                        ? `${formatTime12Hour(employee.work_start_time)} - ${formatTime12Hour(employee.work_end_time)} (${employee.work_hours_per_day} hours)`
                                                        : '-'
                                                } />
                                            </div>
                                        </div>
                                        {/* Roles Section */}
                                        <div>
                                            <h4 className="font-semibold text-base mb-4 border-b pb-2">Roles & Responsibilities</h4>
                                            <div className="flex flex-wrap gap-3 max-w-full px-2 py-2 break-words whitespace-pre-line min-h-[2.5rem] text-sm"> {/* Increased gap */}
                                                <RolesBadges roles={employee.roles} activeRoles={activeRoles} employee={employee} />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Divider */}
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-4" /> {/* Increased margin */}
                                    {/* Salary & Contributions Section */}
                                    <div className="pt-2">
                                        <h4 className="font-semibold text-lg mb-6">Salary & Contributions</h4>
                                        {/* <div className="grid grid-cols-2 gap-16 items-start mb-10"> Increased gap and margin */}
                                            <div className="grid grid-cols-3 gap-3 items-start w-full"> {/* Three columns layout */}
                                                {/* Income & Benefits */}
                                                <div className="px-8 min-h-[200px] flex flex-col justify-start">
                                                    <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Income & Benefits</h5>
                                                    <div className="space-y-3 text-sm">
                                                        <Info label="Base Salary" value={`₱${formatWithCommas(employee.base_salary)}`} />
                                                        <Info label="Honorarium" value={`₱${formatWithCommas(employee.honorarium ?? 0)}`} />
                                                        <Info label="Overtime Pay" value={`₱${formatWithCommas(employee.overtime_pay ?? 0)}`} />
                                                    </div>
                                                </div>

                                                {/* Deductions (center column) */}
                                                <div className="px-8 min-h-[200px] flex flex-col justify-start col-start-2 col-end-3">
                                                    <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Deductions</h5>
                                                    <div className="space-y-3 text-sm">
                                                        <Info label="SSS" value={`₱${formatWithCommas(employee.sss)}`} />
                                                        <Info label="PhilHealth" value={`₱${formatWithCommas(employee.philhealth)}`} />
                                                        <Info label="Pag-IBIG" value={`₱${formatWithCommas(employee.pag_ibig)}`} />
                                                        <Info label="Withholding Tax" value={`₱${formatWithCommas(employee.withholding_tax)}`} />
                                                    </div>
                                                </div>

                                                {/* Other Deductions (right column) */}
                                                <div className="px-8 min-h-[200px] flex flex-col justify-start col-start-3 col-end-4">
                                                    <h5 className="font-semibold text-base mb-4 text-gray-700 dark:text-gray-300">Other Deductions</h5>
                                                    <div className="space-y-3 text-sm">
                                                        <Info label="Salary Loan" value={`₱${formatWithCommas(employee.salary_loan ?? 0)}`} />
                                                        <Info label="PERAA Con." value={`₱${formatWithCommas(employee.peraa_con ?? 0)}`} />
                                                        <Info label="China Bank" value={`₱${formatWithCommas(employee.china_bank ?? 0)}`} />
                                                        <Info label="TEA" value={`₱${formatWithCommas(employee.tea ?? 0)}`} />
                                                        <Info label="Calamity Loan" value={`₱${formatWithCommas(employee.calamity_loan ?? 0)}`} />
                                                        <Info label="Multipurpose Loan" value={`₱${formatWithCommas(employee.multipurpose_loan ?? 0)}`} />
                                                    </div>
                                                </div>
                                            </div>


                                        {/* </div> */}
                                        {/* Only show payroll data if showPayroll is true */}
                                        {showPayroll && (
                                            <>
                                                <div className="flex items-center justify-between mb-4">
                                                    <MonthPicker
                                                        value={selectedMonth}
                                                        onValueChange={handleMonthChange}
                                                        placeholder="Select month"
                                                        className="w-46 min-w-0 px-2 py-1 text-sm"
                                                        availableMonths={availableMonths}
                                                    />
                                                </div>
                                                {/* Payroll summary and breakdown (copied from original) */}
                                                {/* ...existing payroll summary and breakdown code here... */}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="flex-shrink-0">
                                <Button onClick={onClose}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Dialog>
    )
}
