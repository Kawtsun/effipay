import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { ScrollText } from 'lucide-react';
import EmployeePagination from '@/components/employee-pagination';

import { Card } from "@/components/ui/card";
import { AuditLogsActionFilter } from '@/components/audit-logs-action-filter';

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
    const { auditLogs, currentPage, totalPages, action: initialAction } = usePage().props as unknown as {
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
        action?: string;
    };

    const [selectedAction, setSelectedAction] = useState<string>(initialAction ?? 'All');
    

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Logs" />
            <div className="flex h-full flex-col gap-4 overflow-hidden py-6 px-2 sm:px-4 md:px-8">
                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 dark:bg-primary p-3 rounded-full border border-primary/20 dark:border-primary">
                        <ScrollText className="h-6 w-6 text-primary dark:text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
                        <p className="text-muted-foreground">View system audit logs and track user actions for security and compliance.</p>
                    </div>
                </div>

                {/* Top controls: Action filter */}
                <div className="flex flex-wrap gap-2 items-center">
                    <AuditLogsActionFilter
                        value={selectedAction}
                        onSelect={(value) => {
                            setSelectedAction(value);
                            spinnerStart.current = Date.now();
                            setLoading(true);
                            const data: any = {};
                            if (value && value.toLowerCase() !== 'all') (data as any).action = value;
                            router.visit(route('audit-logs.index'), {
                                method: 'get',
                                data,
                                preserveState: true,
                                preserveScroll: true,
                                only: ['auditLogs','currentPage','totalPages','action'],
                                onFinish: () => {
                                    const elapsed = Date.now() - spinnerStart.current;
                                    const wait = Math.max(0, 400 - elapsed);
                                    setTimeout(() => setLoading(false), wait);
                                },
                            });
                        }}
                    />
                </div>

                {/* AUDIT LOG ROWS */}
                <div className="flex flex-col gap-4">
                    {auditLogs.map(log => {
                        const isMonth = /^\d{4}-\d{2}$/.test(log.name ?? '');
                        const actionLower = (log.action || '').toLowerCase();
                        const isImport = actionLower.includes('import');
                        const isAdjustment = actionLower === 'payroll adjustment';
                        const isPrintPayslip = actionLower === 'print payslip';
                        const isPrintBtr = actionLower === 'print btr';
                        let details: any = null;
                        let fileName: string | null = null;
                        try {
                            if (log.details) {
                                details = JSON.parse(log.details);
                                if (details && typeof details.file_name === 'string' && details.file_name.length) {
                                    fileName = details.file_name;
                                }
                            }
                        } catch {}
                        return (
                        <Card key={log.id} className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                                <div className="text-base font-medium text-muted-foreground space-x-1">
                                    {(() => {
                                        // Build row content based on action/entity
                                        const idBadge = log.entity_id ? (
                                            <span className="inline-flex items-center rounded-full border bg-accent/20 text-accent-foreground px-2 py-0.5 text-[11px] align-middle">
                                                employee ID #<span className="font-bold ml-1">{log.entity_id}</span>
                                            </span>
                                        ) : null;

                                        if (isAdjustment && details) {
                                            return (
                                                <>
                                                    <span className="text-primary font-semibold">{log.username}</span>
                                                    <span>{log.action}</span>
                                                    {log.entity_id ? (
                                                        idBadge
                                                    ) : (
                                                        <span className="text-foreground font-bold">{log.name}</span>
                                                    )}
                                                    {details.type ? (<><span>type:</span><span className="text-foreground font-bold">{details.type}</span></>) : null}
                                                    {details.month ? (<><span>month:</span><span className="text-foreground font-bold">{details.month}</span></>) : null}
                                                    {typeof details.amount !== 'undefined' ? (<><span>amount:</span><span className="text-foreground font-bold">{new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(details.amount)}</span></>) : null}
                                                </>
                                            );
                                        }

                                        if (isPrintPayslip || isPrintBtr) {
                                            return (
                                                <>
                                                    <span className="text-primary font-semibold">{log.username}</span>
                                                    <span>{log.action}</span>
                                                    {idBadge}
                                                    {isMonth ? (<><span>month:</span><span className="text-foreground font-bold">{log.name}</span></>) : null}
                                                </>
                                            );
                                        }

                                        if (log.entity_type === 'employee') {
                                            return (
                                                <>
                                                    <span className="text-primary font-semibold">{log.username}</span>
                                                    <span>{log.action}</span>
                                                    <span>employee</span>
                                                    {idBadge}
                                                    <span className="text-foreground font-bold">{log.name}</span>
                                                </>
                                            );
                                        }

                                        if (log.entity_type === 'salary') {
                                            return (
                                                <>
                                                    <span className="text-primary font-semibold">{log.username}</span>
                                                    <span>{log.action}</span>
                                                    <span>salary default</span>
                                                    <span>type:</span>
                                                    <span className="font-bold text-foreground">{log.name}</span>
                                                </>
                                            );
                                        }

                                        if (log.entity_type === 'timekeeping' && isImport && isMonth) {
                                            return (
                                                <>
                                                    <span className="text-primary font-semibold">{log.username}</span>
                                                    <span>{log.action}</span>
                                                    <span>month:</span>
                                                    <span className="text-foreground font-bold">{log.name}</span>
                                                    {fileName ? (<><span>file:</span><span className="text-foreground font-bold">{fileName}</span></>) : null}
                                                </>
                                            );
                                        }

                                        if (log.entity_type === 'users' && isImport) {
                                            return (
                                                <>
                                                    <span className="text-primary font-semibold">{log.username}</span>
                                                    <span>{log.action}</span>
                                                    <span>file:</span>
                                                    <span className="text-foreground font-bold">{log.name}</span>
                                                </>
                                            );
                                        }

                                        return (
                                            <>
                                                <span className="text-primary font-semibold">{log.username}</span>
                                                <span>{log.action}</span>
                                                {log.entity_type && !actionLower.includes((log.entity_type || '').toLowerCase()) ? (<span>{log.entity_type}</span>) : null}
                                                {idBadge}
                                                <span className="text-foreground font-bold">{log.name}</span>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(log.date).toLocaleString()}
                                </div>
                            </div>
                        </Card>
                        );
                    })}
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
                                data: {
                                    page,
                                    ...(selectedAction && selectedAction.toLowerCase() !== 'all' ? { action: selectedAction } : {}),
                                },
                                preserveState: true,
                                preserveScroll: true,
                                only: ['auditLogs', 'currentPage', 'totalPages', 'action'],
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
