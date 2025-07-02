import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
];

export default function Employees({ employees }: { employees: Employees[] }) {

    const deleteEmployee = (id: number) => {
        if (confirm('Are you sure you want to delete this employee?')) {
            router.delete(route('employees.destroy', { id }));
            toast.success('Employee deleted successfully');
        };
    }
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div>
                <Link className={buttonVariants({ variant: 'outline' })} href="/employees/create">Add Employee</Link>
                <Table>
                    <TableCaption>A list of your recent invoices.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px] text-center">Id</TableHead>
                            <TableHead>Employee Name</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow key={employee.id}>
                                <TableCell className='text-center'>{employee.id}</TableCell>
                                <TableCell>{employee.username}</TableCell>
                                <TableCell className='text-right'>
                                    <Link className={buttonVariants({ variant: 'outline' })} href={`/employees/${employee.id}/edit`}>Edit</Link>
                                    <Button variant='destructive' onClick={() => deleteEmployee(employee.id)}>Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}
