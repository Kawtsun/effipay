import { Button, buttonVariants } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
];

type Flash = {
    success?: string;
    // add other flash message types if needed
};

type PageProps = {
    flash?: Flash;
    // add other props if needed
};

interface Employees {
    id: number,
    employee_name: string,
    employee_type: string,
    employee_status: string,
    base_salary: number,
    overtime_pay: number,
    sss: number,
    philhealth: number,
    pag_ibig: number,
    withholding_tax: number,
}

interface EmployeesProps {
    employees: Employees[];
}

export default function Index({ employees }: EmployeesProps) {
    const { props } = usePage<PageProps>();
    const [open, setOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employees | null>(null);

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
    }, [props.flash]);

    const handleDeleteClick = (employee: Employees) => {
        setSelectedEmployee(employee);
        setOpen(true);
    };

    const confirmDelete = () => {
        if (selectedEmployee) {
            router.delete(route('employees.destroy', { employee: selectedEmployee.id }));
            setOpen(false);
            setSelectedEmployee(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className='p-4'>
                    <div className="flex justify-end">
                        <Link href={route('employees.create')}>
                            <Button>Add Employee</Button>
                        </Link>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Employee ID</TableHead>
                                <TableHead>Employee Name</TableHead>
                                <TableHead>Employee Type</TableHead>
                                <TableHead>Employee Status</TableHead>
                                <TableHead className="">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell>{employee.id}</TableCell>
                                    <TableCell>{employee.employee_name}</TableCell>
                                    <TableCell>{employee.employee_type}</TableCell>
                                    <TableCell>{employee.employee_status}</TableCell>
                                    <TableCell className='flex gap-4'>
                                        <Link
                                            className={buttonVariants({ variant: 'default' })}
                                            href={route('employees.edit', { employee: employee.id })}
                                        >
                                            Edit
                                        </Link>
                                        <Button
                                            variant={'destructive'}
                                            onClick={() => handleDeleteClick(employee)}>
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <AlertDialog open={open} onOpenChange={setOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete employee "{selectedEmployee?.employee_name}" (ID: {selectedEmployee?.id}).
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </AppLayout>
    );
}
