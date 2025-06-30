import { Button } from '@/components/ui/button';
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
                <div className="flex justify-end">
                    <Link href={route('employees.index')}>
                        <Button>Go Back</Button>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
