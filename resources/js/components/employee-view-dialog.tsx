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

interface Props {
    employee: Employees | null
    onClose: () => void
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    )
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

                            <Card className="border rounded-md shadow-sm bg-white">
                                <CardHeader className="text-lg font-semibold tracking-tight border-b pb-2">
                                    #{employee.id} - {employee.employee_name}
                                </CardHeader>

                                <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm pt-4">
                                    <Info label="Status" value={employee.employee_status} />
                                    <Info label="Type" value={employee.employee_type} />
                                    <Info
                                        label="Base Salary"
                                        value={`₱${Number(employee.base_salary).toLocaleString()}`}
                                    />
                                    <Info
                                        label="Overtime Pay"
                                        value={`₱${Number(employee.overtime_pay).toLocaleString()}`}
                                    />
                                    <Info label="SSS" value={`₱${Number(employee.sss).toLocaleString()}`} />
                                    <Info
                                        label="PhilHealth"
                                        value={`₱${Number(employee.philhealth).toLocaleString()}`}
                                    />
                                    <Info
                                        label="Pag-IBIG"
                                        value={`₱${Number(employee.pag_ibig).toLocaleString()}`}
                                    />
                                    <Info
                                        label="Withholding Tax"
                                        value={`₱${Number(employee.withholding_tax).toLocaleString()}`}
                                    />
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
