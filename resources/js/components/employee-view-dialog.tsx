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
import { Badge } from "./ui/badge"
import { Shield, GraduationCap, Book } from 'lucide-react'
import { MonthPicker } from "./ui/month-picker"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface PayrollData {
    id: number
    employee_id: number
    month: string
    payroll_date: string
    base_salary: number
    overtime_pay: number
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
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium break-words">{value}</p>
        </div>
    )
}

const COLLEGE_PROGRAMS = [
  { value: 'BSBA', label: 'Bachelor of Science in Business Administration' },
  { value: 'BSA', label: 'Bachelor of Science in Accountancy' },
  { value: 'COELA', label: 'College of Education and Liberal Arts' },
  { value: 'BSCRIM', label: 'Bachelor of Science in Criminology' },
  { value: 'BSCS', label: 'Bachelor of Science in Computer Science' },
  { value: 'JD', label: 'Juris Doctor' },
  { value: 'BSN', label: 'Bachelor of Science in Nursing' },
  { value: 'RLE', label: 'Related Learning Experience' },
  { value: 'CG', label: 'Career Guidance or Computer Graphics' },
  { value: 'BSPT', label: 'Bachelor of Science in Physical Therapy' },
  { value: 'GSP', label: 'GSIS Scholarship' },
  { value: 'MBA', label: 'Master of Business Administration' },
];
function getCollegeProgramLabel(acronym: string) {
  const found = COLLEGE_PROGRAMS.find(p => p.value === acronym);
  return found ? found.label : acronym;
}

function RolesBadges({ roles, activeRoles, employee }: { roles: string; activeRoles?: string[]; employee: Employees }) {
    if (!roles) return null;
    let rolesArr = roles.split(',').map(r => r.trim()).filter(Boolean);
    const order = ['administrator', 'college instructor', 'basic education instructor'];
    // If activeRoles prop is provided, order roles so filtered roles come first
    const activeRolesArr = activeRoles || [];
    if (activeRolesArr.length > 0) {
        const filtered = activeRolesArr.filter(r => rolesArr.includes(r));
        const rest = rolesArr.filter(r => !filtered.includes(r));
        rolesArr = [...filtered, ...rest];
    } else {
        rolesArr = order.filter(r => rolesArr.includes(r));
    }
    // Render all roles as badges, no tooltip
    return (
        <div className="flex flex-wrap gap-2 max-w-lg px-4 py-2 break-words whitespace-pre-line">
            {rolesArr.map(role => {
                let color: 'secondary' | 'info' | 'purple' | 'warning' = 'secondary';
                let icon = null;
                let extra = null;
                if (role === 'administrator') {
                    color = 'info';
                    icon = <Shield className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                } else if (role === 'college instructor') {
                    color = 'purple';
                    icon = <GraduationCap className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                    if (employee && employee.college_program) {
                        extra = <span className="ml-1 text-xs font-semibold text-white">[{employee.college_program}] {getCollegeProgramLabel(employee.college_program)}</span>;
                    }
                } else if (role === 'basic education instructor') {
                    color = 'warning';
                    icon = <Book className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                }
                return (
                    <Badge key={role} variant={color} className="capitalize flex items-center">
                        {icon}{role.replace(/\b\w/g, c => c.toUpperCase())}{extra}
                    </Badge>
                );
            })}
        </div>
    );
}

export default function EmployeeViewDialog({ employee, onClose, activeRoles }: Props) {
    const [selectedMonth, setSelectedMonth] = useState('')
    const [monthlyPayrollData, setMonthlyPayrollData] = useState<MonthlyPayrollData | null>(null)
    const [availableMonths, setAvailableMonths] = useState<string[]>([])
    const [loadingPayroll, setLoadingPayroll] = useState(false)

    // Fetch available months when employee changes
    useEffect(() => {
        if (employee) {
            fetchAvailableMonths()
        }
    }, [employee])

    // Fetch monthly payroll data when month changes
    useEffect(() => {
        if (employee && selectedMonth) {
            fetchMonthlyPayrollData()
        } else {
            setMonthlyPayrollData(null)
        }
    }, [employee, selectedMonth])

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
                }
            }
        } catch (error) {
            console.error('Error fetching available months:', error)
        }
    }

    const fetchMonthlyPayrollData = async () => {
        if (!employee || !selectedMonth) return
        
        setLoadingPayroll(true)
        try {
            console.log('Fetching monthly payroll data for:', { employee_id: employee.id, month: selectedMonth })
            const response = await fetch(route('payroll.employee.monthly', { 
                employee_id: employee.id, 
                month: selectedMonth 
            }))
            const result = await response.json()
            console.log('Monthly payroll API response:', result)
            
            if (result.success) {
                setMonthlyPayrollData(result)
            } else {
                setMonthlyPayrollData(null)
                toast.error('No payroll data found for this month')
            }
        } catch (error) {
            console.error('Error fetching monthly payroll data:', error)
            setMonthlyPayrollData(null)
        } finally {
            setLoadingPayroll(false)
        }
    }

    return (
        <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
            <AnimatePresence>
                {!!employee && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                    >
                        <DialogContent className="max-w-[98vw] w-[98vw]">
                            <DialogHeader>
                                <DialogTitle>Employee Details</DialogTitle>
                            </DialogHeader>

                                                        <div className="space-y-6 text-sm">
                                {/* Employee Header */}
                                <div className="border-b pb-4">
                                    <h3 className="text-lg font-semibold">#{employee.id} - {employee.employee_name}</h3>
                                </div>
                                
                                {/* Header Row */}
                                <div className="grid grid-cols-3 gap-6">
                                        {/* General Info */}
                                        <div>
                                            <h4 className="font-semibold text-base mb-3 border-b pb-2">General Information</h4>
                                            <div className="space-y-2">
                                                <Info label="Status" value={employee.employee_status} />
                                                <Info label="Type" value={employee.employee_type} />
                                            </div>
                                        </div>
                                        
                                        {/* Roles Section */}
                                        <div>
                                            <h4 className="font-semibold text-base mb-3 border-b pb-2">Roles & Responsibilities</h4>
                                            <RolesBadges roles={employee.roles} activeRoles={activeRoles} employee={employee} />
                                        </div>

                                        {/* Month Selector */}
                                        <div>
                                            <h4 className="font-semibold text-base mb-3 border-b pb-2">Payroll Period</h4>
                                            <div className="flex items-center gap-3">
                                                <MonthPicker
                                                    value={selectedMonth}
                                                    onValueChange={setSelectedMonth}
                                                    placeholder="Select month"
                                                    className="w-full"
                                                    availableMonths={availableMonths}
                                                />
                                                {loadingPayroll && (
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                        Loading...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Salary & Contributions Section */}
                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold text-base mb-4">Salary & Contributions</h4>
                                        
                                        {monthlyPayrollData ? (
                                            <div className="space-y-6">
                                                {/* Summary Cards */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <div className="text-xs text-gray-600 font-medium mb-1">Gross Pay</div>
                                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                            ₱{Number(monthlyPayrollData.payrolls[0].gross_pay).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                                        <div className="text-xs text-green-600 font-medium mb-1">Total Net Pay</div>
                                                        <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                                            ₱{Number(monthlyPayrollData.payrolls[0].gross_pay - monthlyPayrollData.payrolls[0].total_deductions).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                                        <div className="text-xs text-blue-600 font-medium mb-1">Per Payroll</div>
                                                        <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                                                            ₱{Number((monthlyPayrollData.payrolls[0].gross_pay - monthlyPayrollData.payrolls[0].total_deductions) / monthlyPayrollData.payrolls.length).toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-blue-600 mt-1">
                                                            {monthlyPayrollData.payrolls.map((payroll, index) => (
                                                                <div key={payroll.id} className="flex items-center gap-1">
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                    {new Date(payroll.payroll_date).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    })}
                                                                    {index < monthlyPayrollData.payrolls.length - 1 && <span className="text-blue-400">•</span>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Detailed Breakdown */}
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <h5 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300">Income & Benefits</h5>
                                                        <div className="space-y-3">
                                                            <Info label="Base Salary" value={`₱${Number(monthlyPayrollData.payrolls[0].base_salary).toLocaleString()}`} />
                                                            <Info label="Overtime Pay" value={`₱${Number(monthlyPayrollData.payrolls[0].overtime_pay).toLocaleString()}`} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h5 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300">Deductions</h5>
                                                        <div className="space-y-3">
                                                            <Info label="SSS" value={`₱${Number(monthlyPayrollData.payrolls[0].sss).toLocaleString()}`} />
                                                            <Info label="PhilHealth" value={`₱${Number(monthlyPayrollData.payrolls[0].philhealth).toLocaleString()}`} />
                                                            <Info label="Pag-IBIG" value={`₱${Number(monthlyPayrollData.payrolls[0].pag_ibig).toLocaleString()}`} />
                                                            <Info label="Withholding Tax" value={`₱${Number(monthlyPayrollData.payrolls[0].withholding_tax).toLocaleString()}`} />
                                                        </div>
                                                    </div>
                                                </div>


                                                
                                                
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {/* Default Summary Cards */}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                                        <div className="text-xs text-blue-600 font-medium mb-1">Monthly Net Pay</div>
                                                        <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                                                            ₱{Number(employee.base_salary + employee.overtime_pay - employee.sss - employee.philhealth - employee.pag_ibig - employee.withholding_tax).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <div className="text-xs text-gray-600 font-medium mb-1">Base Salary</div>
                                                        <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                                            ₱{Number(employee.base_salary).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                                                        <div className="text-xs text-orange-600 font-medium mb-1">Total Deductions</div>
                                                        <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                                                            ₱{Number(employee.sss + employee.philhealth + employee.pag_ibig + employee.withholding_tax).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Detailed Breakdown */}
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <h5 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300">Income & Benefits</h5>
                                                        <div className="space-y-3">
                                                            <Info label="Base Salary" value={`₱${Number(employee.base_salary).toLocaleString()}`} />
                                                            <Info label="Overtime Pay" value={`₱${Number(employee.overtime_pay).toLocaleString()}`} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h5 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300">Deductions</h5>
                                                        <div className="space-y-3">
                                                            <Info label="SSS" value={`₱${Number(employee.sss).toLocaleString()}`} />
                                                            <Info label="PhilHealth" value={`₱${Number(employee.philhealth).toLocaleString()}`} />
                                                            <Info label="Pag-IBIG" value={`₱${Number(employee.pag_ibig).toLocaleString()}`} />
                                                            <Info label="Withholding Tax" value={`₱${Number(employee.withholding_tax).toLocaleString()}`} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Summary Totals */}
                                                <div className="border-t pt-4">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                                            <div className="text-xs text-gray-600 font-medium mb-1">Gross Pay</div>
                                                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                                ₱{Number(employee.base_salary + employee.overtime_pay).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                                            <div className="text-xs text-red-600 font-medium mb-1">Total Deductions</div>
                                                            <div className="text-lg font-bold text-red-700 dark:text-red-300">
                                                                ₱{Number(employee.sss + employee.philhealth + employee.pag_ibig + employee.withholding_tax).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                                            <div className="text-xs text-green-600 font-medium mb-1">Net Pay</div>
                                                            <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                                                ₱{Number(employee.base_salary + employee.overtime_pay - employee.sss - employee.philhealth - employee.pag_ibig - employee.withholding_tax).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {availableMonths.length === 0 && (
                                                    <div className="border-t pt-4">
                                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                            <div className="text-center text-sm text-yellow-700 dark:text-yellow-300">
                                                                <div className="font-medium mb-1">No payroll data available</div>
                                                                <div className="text-xs">Run payroll first to see calculated values for specific months.</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                            </div>
                            <DialogFooter> <Button onClick={onClose}>Close</Button> </DialogFooter>
                        </DialogContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Dialog>
    )
}
