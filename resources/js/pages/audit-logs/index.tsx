import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { Loader2, Search as SearchIcon, X } from 'lucide-react';
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
    const { auditLogs, currentPage, totalPages, q: initialQ } = usePage().props as unknown as {
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
        q?: string;
    };

    const [q, setQ] = useState<string>(initialQ ?? '');
    const debounceRef = useRef<number | null>(null);
    const firstLoadRef = useRef<boolean>(true);

    useEffect(() => {
        setQ(initialQ ?? '');
    }, [initialQ]);

    // Debounced, reactive search
    useEffect(() => {
        if (firstLoadRef.current) {
            firstLoadRef.current = false;
            return;
        }
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }
        debounceRef.current = window.setTimeout(() => {
            spinnerStart.current = Date.now();
            setLoading(true);
            const data = q ? { q } : {};
            router.visit(route('audit-logs.index'), {
                method: 'get',
                data,
                preserveState: true,
                preserveScroll: true,
                only: ['auditLogs', 'currentPage', 'totalPages', 'q'],
                onFinish: () => {
                    const elapsed = Date.now() - spinnerStart.current;
                    const wait = Math.max(0, 400 - elapsed);
                    setTimeout(() => setLoading(false), wait);
                },
            });
        }, 350);
        return () => {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
            }
        };
    }, [q]);

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

                {/* SEARCH BAR - reactive with inline clear */}
                <div className="relative w-100">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search"
                        className="w-full rounded-full border bg-background pl-9 pr-9 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {q?.length ? (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onClick={() => setQ('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>

                {/* AUDIT LOG ROWS */}
                <div className="flex flex-col gap-4">
                    {auditLogs.map(log => {
                        const isMonth = /^\d{4}-\d{2}$/.test(log.name ?? '');
                        const isImport = (log.action || '').toLowerCase().includes('import');
                        const isAdjustment = (log.action || '').toLowerCase() === 'payroll adjustment';
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
                                    {isAdjustment && details ? (
                                        <>
                                            <span className="text-primary font-semibold">{log.username}</span>
                                            <span className="">{log.action}</span>
                                            <span className="">employee:</span>
                                            <span className="text-foreground font-bold">{log.name}</span>
                                            {details.type ? (
                                                <>
                                                    <span className="">type:</span>
                                                    <span className="text-foreground font-bold">{details.type}</span>
                                                </>
                                            ) : null}
                                            {details.month ? (
                                                <>
                                                    <span className="">month:</span>
                                                    <span className="text-foreground font-bold">{details.month}</span>
                                                </>
                                            ) : null}
                                            {typeof details.amount !== 'undefined' ? (
                                                <>
                                                    <span className="">amount:</span>
                                                    <span className="text-foreground font-bold">{new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(details.amount)}</span>
                                                </>
                                            ) : null}
                                        </>
                                    ) : log.entity_type === 'employee' ? (
                                        <>
                                            <span className="text-primary font-semibold">{log.username}</span>
                                            <span className="">{log.action}</span>
                                            <span className="">employee</span>
                                            <span className="">ID:</span>
                                            <span className="">{log.entity_id}</span>
                                            <span className="text-foreground font-bold">{log.name}</span>
                                        </>
                                    ) : log.entity_type === 'salary' ? (
                                        <>
                                            <span className="text-primary font-semibold">{log.username}</span>
                                            <span className="">{log.action}</span>
                                            <span className="">salary default</span>
                                            <span className="">type:</span>
                                            <span className="font-bold text-foreground">{log.name}</span>
                                        </>
                                    ) : log.entity_type === 'timekeeping' && isImport && isMonth ? (
                                        <>
                                            <span className="text-primary font-semibold">{log.username}</span>
                                            <span className="">{log.action}</span>
                                            {/* avoid repeating entity_type 'timekeeping' */}
                                            <span className="">month:</span>
                                            <span className="text-foreground font-bold">{log.name}</span>
                                            {fileName ? (
                                                <>
                                                    <span className="">file:</span>
                                                    <span className="text-foreground font-bold">{fileName}</span>
                                                </>
                                            ) : null}
                                        </>
                                    ) : log.entity_type === 'users' && isImport ? (
                                        <>
                                            <span className="text-primary font-semibold">{log.username}</span>
                                            <span className="">{log.action}</span>
                                            {/* avoid redundant 'users' repeat */}
                                            <span className="">file:</span>
                                            <span className="text-foreground font-bold">{log.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-primary font-semibold">{log.username}</span>
                                            <span className="">{log.action}</span>
                                            {/* Show entity_type when it's informative and not redundant with action */}
                                            {log.entity_type && (
                                                <span className="">{log.entity_type}</span>
                                            )}
                                            {/* Only show ID if present */}
                                            {log.entity_id ? (
                                                <>
                                                    <span className="">ID:</span>
                                                    <span className="font-bold text-foreground">{log.entity_id}</span>
                                                </>
                                            ) : null}
                                            <span className="text-foreground font-bold">{log.name}</span>
                                        </>
                                    )}
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
                                data: { page, q },
                                preserveState: true,
                                preserveScroll: true,
                                only: ['auditLogs', 'currentPage', 'totalPages', 'q'],
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
