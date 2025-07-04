import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { router } from "@inertiajs/react";
import { Employees } from "@/types"; // Adjust import if needed

import { FC } from "react";
import { buttonVariants } from "./ui/button";

interface EmployeeDeleteProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    employee: Employees | null;
    onDeleted?: () => void;
}

const EmployeeDelete: FC<EmployeeDeleteProps> = ({ open, setOpen, employee, onDeleted }) => {
    const confirmDelete = () => {
        if (employee) {
            router.delete(route('employees.destroy', { employee: employee.id }), {
                onSuccess: () => {
                    setOpen(false);
                    if (onDeleted) onDeleted();
                }
            });
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete employee "{employee?.employee_name}" (ID: {employee?.id}).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: 'destructive' })}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default EmployeeDelete;
