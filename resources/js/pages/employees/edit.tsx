import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { type Employees } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { toast } from 'sonner';
import { useForm } from '@inertiajs/react'
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import * as React from "react"
import { EmployeeType } from '@/components/employee-type';
import { EmployeeStatus } from '@/components/employee-status';
import InputError from '@/components/input-error';

interface Employee{
    id: number;
    name: string;
    type: string;
    status: string;
}

interface Props {
    employee: Employee;
}

export default function Edit({employee}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Edit Employees',
        href: '/employees',
    },
    {
        title: `${employee.id} - ${employee.name}`,
        href: route('employees.edit', { employee: employee.id}),
    },
];

    const { data, setData, put, processing, errors } = useForm({
        name: employee.name,
        type: employee.type,
        status: employee.status,
    });

    const HandleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('employees.update', employee.id))
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Update Employees" />
            <div className='flex h-full flex-1 flex-col rounded-x1 p-6 pt-3'>
                <form onSubmit={HandleUpdate} className='space-y-6'>
                    <div>
                        <Label htmlFor='employeeName'>Employee Name</Label>
                        <Input placeholder='Insert Name' value={data.name} onChange={(e) => setData('name', e.target.value)}></Input>
                        
                        <InputError message={errors.name} />
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='employeeType'>Type of Employee</Label>
                        <EmployeeType value={data.type} onChange={val => setData('type', val)}></EmployeeType>

                        <InputError message={errors.type} />
                    </div>
                    <div className='flex flex-col gap-2'>
                        <Label htmlFor='employeeStatus'>Employee Status</Label>
                        <EmployeeStatus value={data.status} onChange={val => setData('status', val)}></EmployeeStatus>

                        <InputError message={errors.status} />
                    </div>
                    <Button type='submit'>Update Employee</Button>
                </form>
            </div>
        </AppLayout>
    );
}
