import { Button, buttonVariants } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Employees } from "@/types";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import EmployeeDelete from "@/components/employee-delete";
import EmployeePagination from "@/components/employee-pagination";

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

interface EmployeesProps {
    employees: Employees[];
    currentPage: number;
    totalPages: number;
}

export default function Index({ employees, currentPage, totalPages }: EmployeesProps) {
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
                    <EmployeeDelete
                        open={open}
                        setOpen={setOpen}
                        employee={selectedEmployee}
                    />
                    <div className="mt-4 flex justify-center">
                        <EmployeePagination currentPage={currentPage} totalPages={totalPages} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}