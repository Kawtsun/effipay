import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { ScrollText } from 'lucide-react';
import EmployeePagination from '@/components/employee-pagination';

import { Card } from "@/components/ui/card";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Audit Logs',
        href: '/audit-logs',
    },
];

export default function AuditLogs() {
    const [loading, setLoading] = useState(false);
    const spinnerStart = useRef<number>(0);
    // Get audit logs from Inertia props
    // You must pass auditLogs, currentPage, totalPages from the backend controller
    // Example: return Inertia::render('audit-logs/index', [...])
    const { auditLogs, currentPage, totalPages } = usePage().props as unknown as {
        auditLogs: Array<{
            id: number;
            action: string;
            name: string;
            username: string;
            entity_type: string;
            entity_id: number;
            date: string;
            details?: string;
        }>;
        currentPage: number;
        totalPages: number;
    };

    // Import shadcn Card components
    // If not already imported, add these at the top:
    // import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Logs" />
            <div className="flex h-full flex-col gap-4 overflow-hidden py-6 px-2 sm:px-4 md:px-8">
                {/* HEADER */}
                <div className="flex-none">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                        <ScrollText className='h-6 w-6 text-primary'/>
                        Audit Logs
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View system audit logs and track user actions for security and compliance.
                    </p>
                </div>

                {/* AUDIT LOG ROWS */}
                <div className="flex flex-col gap-4">
                    {auditLogs.map(log => (
                        <Card key={log.id} className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                                <div className="text-base font-medium text-muted-foreground space-x-1">
                                    <span className="text-primary font-semibold">{log.username}</span>
                                    <span className="">{log.action}</span>
                                    <span className="">{log.entity_type}</span>
                                    <span className="">ID:</span>
                                    <span className="">{log.entity_id}</span>
                                    <span className="text-foreground font-bold">{log.name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(log.date).toLocaleString()}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
                <div className="mt-4 flex min-h-[56px] justify-center">
                    <EmployeePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={page => {
                            spinnerStart.current = Date.now();
                            setLoading(true);
                            router.visit(route('audit-logs.index'), {
                                method: 'get',
                                data: { page },
                                preserveState: true,
                                preserveScroll: true,
                                only: ['auditLogs', 'currentPage', 'totalPages'],
                                onFinish: () => {
                                    const elapsed = Date.now() - spinnerStart.current;
                                    const wait = Math.max(0, 400 - elapsed);
                                    setTimeout(() => setLoading(false), wait);
                                },
                            });
                        }}
                    />
                </div>
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 transition-opacity duration-300 dark:bg-black/70">
                        <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
