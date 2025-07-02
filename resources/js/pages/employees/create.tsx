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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Add New Employees',
        href: '/employees/create',
    },
];

export default function Index() {

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        type: '',
        status: '',
    });

    const HandleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('employees.store'));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Employees" />
            <div className='flex h-full flex-1 flex-col rounded-x1 p-6 pt-3'>
                <form onSubmit={HandleSubmit} className='space-y-6'>
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
                    <Button type='submit'>Add Employee</Button>
                </form>
            </div>
        </AppLayout>
    );
}
