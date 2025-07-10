import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Wallet } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Salary',
        href: '/salary',
    },
];

export default function index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Salary" />
            <div className="flex h-full flex-col gap-4 overflow-hidden py-6 px-8">
                {/* HEADER */}
                <div className="flex-none">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                        <Wallet className="h-6 w-6 text-primary" />
                        Salary
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Configure your organization’s salary structures, allowances, deductions, and payroll settings.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
