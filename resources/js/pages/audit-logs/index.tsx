import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ScrollText } from 'lucide-react';
import { useState } from 'react';
import EmployeePagination from '@/components/employee-pagination';

import { Card } from "@/components/ui/card";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Audit Logs',
        href: '/audit-logs',
    },
];

export default function AuditLogs() {
    // Mock audit log data (simplified)
    // Pagination state (mocked for now)
    const LOGS_PER_PAGE = 5;
    const [currentPage, setCurrentPage] = useState(1);
    const totalLogs = 12; // Example: total logs in DB
    const totalPages = Math.ceil(totalLogs / LOGS_PER_PAGE);

    // Mock audit log data (show only logs for current page)
    const allAuditLogs = [
        {
            id: 1,
            action: 'edited',
            employeeId: '0001',
            employeeName: 'Sakiko Togawa',
            admin: 'Admin',
            timestamp: '2025/22/03 10:11:12',
        },
        {
            id: 2,
            action: 'edited',
            employeeId: '0003',
            employeeName: 'Mutsumi Wakaba',
            admin: 'Admin',
            timestamp: '2025/22/03 10:11:12',
        },
        {
            id: 3,
            action: 'deleted',
            employeeId: '0002',
            employeeName: 'Uika Misumi',
            admin: 'Admin',
            timestamp: '2025/22/03 10:11:12',
        },
        {
            id: 4,
            action: 'created',
            employeeId: '0004',
            employeeName: 'Yuka Terasaki',
            admin: 'Admin',
            timestamp: '2025/22/03 10:12:01',
        },
        {
            id: 5,
            action: 'edited',
            employeeId: '0005',
            employeeName: 'Moe Kamikokuryo',
            admin: 'Admin',
            timestamp: '2025/22/03 10:13:45',
        },
        // Add more mock logs for pagination demo
        {
            id: 6,
            action: 'created',
            employeeId: '0006',
            employeeName: 'Rina Ikoma',
            admin: 'Admin',
            timestamp: '2025/22/03 10:14:01',
        },
        {
            id: 7,
            action: 'edited',
            employeeId: '0007',
            employeeName: 'Ayaka Wada',
            admin: 'Admin',
            timestamp: '2025/22/03 10:15:12',
        },
        {
            id: 8,
            action: 'deleted',
            employeeId: '0008',
            employeeName: 'Nanami Hashimoto',
            admin: 'Admin',
            timestamp: '2025/22/03 10:16:12',
        },
        {
            id: 9,
            action: 'created',
            employeeId: '0009',
            employeeName: 'Sayuri Matsumura',
            admin: 'Admin',
            timestamp: '2025/22/03 10:17:01',
        },
        {
            id: 10,
            action: 'edited',
            employeeId: '0010',
            employeeName: 'Mai Shiraishi',
            admin: 'Admin',
            timestamp: '2025/22/03 10:18:45',
        },
        {
            id: 11,
            action: 'created',
            employeeId: '0011',
            employeeName: 'Erika Ikuta',
            admin: 'Admin',
            timestamp: '2025/22/03 10:19:01',
        },
        {
            id: 12,
            action: 'edited',
            employeeId: '0012',
            employeeName: 'Minami Hoshino',
            admin: 'Admin',
            timestamp: '2025/22/03 10:20:12',
        },
    ];

    const auditLogs = allAuditLogs.slice((currentPage - 1) * LOGS_PER_PAGE, currentPage * LOGS_PER_PAGE);

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
                            <div className="text-base">
                                {log.admin} {log.action} Employee <span className="font-semibold">{log.employeeId} ({log.employeeName})</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">Last {log.timestamp}</div>
                        </Card>
                    ))}
                </div>
                <div className="mt-4 flex min-h-[56px] justify-center">
                    <EmployeePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            </div>
        </AppLayout>
    );
}
