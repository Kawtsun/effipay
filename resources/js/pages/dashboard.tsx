// import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Users, Receipt, Wallet, LayoutDashboard } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { MonthPicker } from '@/components/ui/month-picker';
import { toast } from 'sonner';
import NetpayMonthlyChart from '@/components/netpay-monthly-chart';
import { EmployeeClassificationPie } from '@/components/employee-classification-pie';

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
    employeeClassifications?: { classification: string; count: number }[];
}

export default function Dashboard({ stats, months, selectedMonth, chart, employeeClassifications }: DashboardProps) {
    // Track if this is the first render (for animation)
    const isFirstRender = useRef(true);
    // Always call usePage at the top, and use optional chaining for fallback
    const page = usePage();
    const pieData: { classification: string; count: number }[] =
        (employeeClassifications && Array.isArray(employeeClassifications) && employeeClassifications.length > 0)
            ? employeeClassifications
            : (Array.isArray(page?.props?.employeeClassifications) ? page.props.employeeClassifications : []);
    const [availableMonths, setAvailableMonths] = useState<string[]>(months && months.length > 0 ? months : []);
    const [month, setMonth] = useState<string>(selectedMonth || (months && months.length > 0 ? months[0] : ''));
    const [localStats, setLocalStats] = useState(stats);
    // Removed unused 'series' state
    const [monthly, setMonthly] = useState<{ key: string; label: string; total: number }[]>(chart?.monthly || []);

    // After first render, set isFirstRender to false
    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    useEffect(() => {
        // Only fetch if months prop is empty (SSR/first load)
        if (!months || months.length === 0) {
            fetch('/payroll/all-available-months')
                .then(res => res.json())
                .then(data => {
                    if (data.success && Array.isArray(data.months)) {
                        if (JSON.stringify(data.months) !== JSON.stringify(availableMonths)) {
                            setAvailableMonths(data.months);
                            if (!data.months.includes(month)) {
                                setMonth(data.months[0] || '');
                            }
                        }
                        if (data.months.length === 0) {
                            toast.error('No available months to display.');
                        }
                    }
                });
        }
    }, [months, availableMonths, month]);

    useEffect(() => {
        setLocalStats(stats);
    }, [stats]);

    const handleMonthChange = async (e: React.ChangeEvent<HTMLSelectElement> | { target: { value: string } }) => {
        const m = e.target.value;
        setMonth(m);
        try {
            const res = await fetch(route('dashboard.stats', { month: m }));
            const json = await res.json();
            if (json?.success && json?.stats) {
                setLocalStats(json.stats);
                setMonthly([...(json.chart?.monthly || [])]);
            }
        } catch {
            // Optionally log error
        }
    };
    // Render dashboard content if month is set OR if there are no available months (empty selector)
    const shouldShowDashboard = month || availableMonths.length === 0;
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-hidden py-6 px-2 sm:px-4 md:px-8">
                {/* Intro like other pages */}
                <div className="flex-none">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                        <LayoutDashboard className="h-6 w-6 text-primary" />
                        Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">Quick glance at employees and payroll totals.</p>
                </div>

                {/* Month selector aligned above cards, like reports */}
                <div className="flex items-center justify-end select-none">
                    <MonthPicker
                        value={month}
                        onValueChange={(val: string) => handleMonthChange({ target: { value: val } })}
                        placeholder="Select month"
                        availableMonths={availableMonths}
                        className="w-46 min-w-0 px-2 py-1 text-sm"
                    />
                </div>

                {shouldShowDashboard && (
                    <div>
                        {/* Stats cards */}
                        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Total Employees</CardTitle>
                                        <CardDescription>All employees</CardDescription>
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
                                    <div className="text-3xl font-bold">
                                        ₱{Number(localStats.totalNetPay ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts row: Bar chart and Pie chart side by side on desktop, stacked on mobile */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch mt-4">
                            <div className="md:col-span-8 col-span-1">
                                <NetpayMonthlyChart
                                    {...(isFirstRender.current ? { key: month + '-' + availableMonths.join(',') + '-chart' } : {})}
                                    title="Overview"
                                    description="Last 12 months"
                                    data={monthly}
                                />
                            </div>
                            <div className="md:col-span-4 col-span-1 flex items-center justify-center">
                                <div className="w-full max-w-[400px]">
                                    <EmployeeClassificationPie
                                        {...(isFirstRender.current ? { key: month + '-' + availableMonths.join(',') + '-pie' } : {})}
                                        data={pieData}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
