import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { type Employees } from '@/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { toast } from 'sonner';
import { useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
];

interface PageProps {
    flash: {
        message?: string;
    }
}

export default function Employees({ employees }: { employees: Employees[] }) {

    const { flash } = usePage().props as PageProps;

    const deleteEmployee = (id: number) => {
        if (confirm('Are you sure you want to delete this employee?')) {
            router.delete(route('employees.destroy', { id }));
            toast.success('Employee deleted successfully');
        };
    }

    useEffect(() => {
        if (flash.message) {
            toast.success(flash.message);
        }
    }, [flash.message]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div>
                <div className='flex justify-end m-4'>
                    <Link className={buttonVariants({ variant: 'default' })} href="/employees/create">Add Employee</Link>
                </div>
                <Table>
                    {/* <TableCaption>A list of Employees.</TableCaption> */}
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px] text-center">Employee Id</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className='text-center'>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow key={employee.id}>
                                <TableCell className='text-center'>{employee.id}</TableCell>
                                <TableCell>{employee.name}</TableCell>
                                <TableCell>{employee.type}</TableCell>
                                <TableCell>{employee.status}</TableCell>
                                <TableCell className='text-center space-x-3'>
                                    <Link className={buttonVariants({ variant: 'default' }) + ' w-20'} href={`/employees/${employee.id}/edit`}>Edit</Link>
                                    <Button className='hover:cursor-pointer' variant='destructive' onClick={() => deleteEmployee(employee.id)}>Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}
