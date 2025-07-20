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
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium break-words">{value}</p>
        </div>
    )
}

function RolesBadges({ roles }: { roles: string }) {
    if (!roles) return null;
    const rolesArr = roles.split(',').map(r => r.trim()).filter(Boolean);
    const badge = (role: string) => {
        let color: 'secondary' | 'info' | 'purple' | 'warning' = 'secondary';
        let icon = null;
        if (role === 'administrator') {
            color = 'info';
            icon = <Shield className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
        } else if (role === 'college instructor') {
            color = 'purple';
            icon = <GraduationCap className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
        } else if (role === 'basic education instructor') {
            color = 'warning';
            icon = <Book className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
        }
        return (
            <Badge key={role} variant={color} className="mr-1 capitalize flex items-center">
                {icon}{role}
            </Badge>
        );
    };
    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {rolesArr.map(role => badge(role))}
        </div>
    );
}

export default function EmployeeViewDialog({ employee, onClose }: Props) {

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
                                            <Info label="Category" value={employee.employee_category} />
                                        </div>
                                    </div>
                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold text-base mb-2 border-b pb-1">Roles</h4>
                                        <RolesBadges roles={employee.roles} />
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
