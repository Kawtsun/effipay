import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Users, Receipt, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MonthPicker } from '@/components/ui/month-picker';
import NetpayMonthlyChart from '@/components/netpay-monthly-chart';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

type DashboardProps = {
    stats: { totalEmployees: number; processedPayroll: number; totalNetPay: number };
    months: string[];
    selectedMonth?: string;
    chart?: { perEmployee: { name: string; net_pay: number }[]; monthly: { key: string; label: string; total: number }[] };
}

export default function Dashboard({ stats, months, selectedMonth, chart }: DashboardProps) {
    const [month, setMonth] = useState<string>(selectedMonth || months?.[0] || '');
    const [localStats, setLocalStats] = useState(stats);
    const [series, setSeries] = useState<{ name: string; value: number }[]>(chart?.perEmployee?.map(r => ({ name: r.name, value: r.net_pay })) || []);
    const [monthly, setMonthly] = useState<{ key: string; label: string; total: number }[]>(chart?.monthly || []);

    useEffect(() => {
        setLocalStats(stats);
    }, [stats]);

    const handleMonthChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const m = e.target.value;
        setMonth(m);
        try {
            const res = await fetch(route('dashboard.stats', { month: m }));
            const json = await res.json();
            if (json?.success && json?.stats) {
                setLocalStats(json.stats);
                const rows = json.chart?.perEmployee || [];
                setSeries(rows.map((r: any) => ({ name: r.name, value: r.net_pay })));
                // Always create a new array reference for monthly
                setMonthly([...(json.chart?.monthly || [])]);
            }
        } catch (_) {}
    }
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-hidden py-6 px-2 sm:px-4 md:px-8">
                {/* Intro like other pages */}
                <div className="flex-none">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                        <Receipt className="h-6 w-6 text-primary" />
                        Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">Quick glance at employees and payroll totals.</p>
                </div>

                {/* Month selector aligned above cards, like reports */}
                <div className="flex items-center justify-end">
                    <MonthPicker
                        value={month}
                        onValueChange={(val) => handleMonthChange({ target: { value: val } } as any)}
                        placeholder="Select month"
                        availableMonths={months}
                        className="w-46 min-w-0 px-2 py-1 text-sm"
                    />
                </div>

                {/* Stats cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Total Employees</CardTitle>
                                <CardDescription>All active employees</CardDescription>
                            </div>
                            <Users className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{localStats.totalEmployees?.toLocaleString?.() ?? 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Processed Payroll</CardTitle>
                                <CardDescription>Count for selected month</CardDescription>
                            </div>
                            <Receipt className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{localStats.processedPayroll?.toLocaleString?.() ?? 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Employees' Net Pay</CardTitle>
                                <CardDescription>Total for selected month</CardDescription>
                            </div>
                            <Wallet className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">₱{(localStats.totalNetPay ?? 0).toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Overview bar chart (last 12 months) using shadcn Chart + recharts */}
                <div className="max-w-full">
                    <NetpayMonthlyChart 
                        title="Overview" 
                        description="Last 12 months" 
                        data={monthly} 
                    />
                </div>
            </div>
        </AppLayout>
    );
}
