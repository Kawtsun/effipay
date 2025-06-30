import { EmployeeStatus } from '@/components/employee-status';
import { EmployeeType } from '@/components/employee-type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Add Employee',
        href: '/employees/create',
    },
];

export default function create() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Employees" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div>
                    <Link href={route('employees.index')}>
                        <Button>Go Back</Button>
                    </Link>
                </div>
                <div className='w-2/5 p-4'>
                    <form className='container mx-auto space-y-4'>
                        <div className="flex flex-col gap-3">
                            <h1 className='font-bold text-xl'>Employee Information</h1>
                            <Label htmlFor="employee_name">
                                Employee Name
                            </Label>
                            <Input
                                id="employee_name"
                                type="text"
                                required
                                tabIndex={1}
                                placeholder="Name"
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="employee_type">
                                Employee Type
                            </Label>
                            <EmployeeType />
                        </div>
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="employee_status">
                                Employee Status
                            </Label>
                            <EmployeeStatus />
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
