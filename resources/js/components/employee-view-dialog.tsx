import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Employees } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Shield, GraduationCap, Book } from 'lucide-react'

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
    const order = ['college instructor', 'basic education instructor', 'administrator'];
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
        <div className="flex flex-wrap gap-2">
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
                        extra = <span className="ml-1 text-xs font-semibold text-white">[{getCollegeProgramLabel(employee.college_program)}]</span>;
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
                        <DialogContent
                            className="max-w-md"
                            aria-describedby="employee-desc"
                        >
                            <DialogHeader>
                                <DialogTitle>Employee Details</DialogTitle>
                            </DialogHeader>

                            <Card className="border rounded-md shadow-sm bg-white dark:bg-card dark:border-border dark:text-card-foreground p-0">
                                <CardHeader className="text-lg font-semibold tracking-tight border-b bg-muted dark:bg-muted dark:border-border dark:text-foreground rounded-t-md px-6 py-3">
                                    #{employee.id} - {employee.employee_name}
                                </CardHeader>

                                <CardContent className="grid grid-cols-1 gap-y-6 text-sm pt-4 pb-6 px-6">
                                    {/* General Info */}
                                    <div>
                                        <h4 className="font-semibold text-base mb-2 border-b pb-1">General Information</h4>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                            <Info label="Status" value={employee.employee_status} />
                                            <Info label="Type" value={employee.employee_type} />
                                        </div>
                                    </div>
                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold text-base mb-2 border-b pb-1">Roles</h4>
                                        <RolesBadges roles={employee.roles} activeRoles={activeRoles} employee={employee} />
                                    </div>
                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold text-base mb-2 border-b pb-1">Salary & Contributions</h4>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                            <Info label="Base Salary" value={`₱${Number(employee.base_salary).toLocaleString()}`} />
                                            <Info label="Overtime Pay" value={`₱${Number(employee.overtime_pay).toLocaleString()}`} />
                                            <Info label="SSS" value={`₱${Number(employee.sss).toLocaleString()}`} />
                                            <Info label="PhilHealth" value={`₱${Number(employee.philhealth).toLocaleString()}`} />
                                            <Info label="Pag-IBIG" value={`₱${Number(employee.pag_ibig).toLocaleString()}`} />
                                            <Info label="Withholding Tax" value={`₱${Number(employee.withholding_tax).toLocaleString()}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <DialogFooter> <Button onClick={onClose}>Close</Button> </DialogFooter>
                        </DialogContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Dialog>
    )
}
