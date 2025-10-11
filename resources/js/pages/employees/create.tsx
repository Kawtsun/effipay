import * as React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, RotateCcw, UserPlus } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { EmployeeNameForm } from '@/components/form/EmployeeNameForm';
import { EmploymentDetailsForm } from '@/components/form/EmploymentDetailsForm';
import { WorkScheduleForm } from '@/components/form/WorkScheduleForm';
import { EarningsForm } from '@/components/form/EarningsForm';
import { ContributionsForm } from '@/components/form/ContributionsForm';
import { LoansForm } from '@/components/form/LoansForm';
import { OtherDeductionsForm } from '@/components/form/OtherDeductionsForm';
import { type WorkDayTime } from '@/components/work-days-selector';

// --- DATA TYPES ---
type EmployeeFormData = {
    first_name: string;
    middle_name: string;
    last_name: string;
    roles: string;
    employee_types: Record<string, string>;
    employee_status: string;
    college_program: string;
    work_days: WorkDayTime[];
    base_salary: string;
    rate_per_hour: string;
    honorarium: string;
    sss: string;
    philhealth: string;
    pag_ibig: string;
    sss_salary_loan: string;
    sss_calamity_loan: string;
    pagibig_multi_loan: string;
    pagibig_calamity_loan: string;
    tuition: string;
    china_bank: string;
    tea: string;
};

type Props = {
    salaryDefaults: any;
    filters: Record<string, any>;
};

// --- MAIN PAGE COMPONENT ---
export default function Index(props: Props) {
    const { salaryDefaults, filters } = props;

    // Your useForm hook (unchanged)
    const form = useForm<EmployeeFormData>({
        first_name: '',
        middle_name: '',
        last_name: '',
        roles: '',
        employee_types: {},
        employee_status: 'Active',
        college_program: '',
        work_days: [],
        base_salary: '',
        rate_per_hour: '',
        honorarium: '',
        sss: '',
        philhealth: '',
        pag_ibig: '',
        sss_salary_loan: '',
        sss_calamity_loan: '',
        pagibig_multi_loan: '',
        pagibig_calamity_loan: '',
        tuition: '',
        china_bank: '',
        tea: '',
    });

    // Your handleSubmit function (unchanged)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('employees.store'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Employee created successfully!');
                form.reset();
            },
            onError: (errors) => {
                toast.error('Validation Failed', {
                    description: 'Please review the form for errors highlighted in red.',
                });
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Add New Employee" />
            <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                            <UserPlus className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Add New Employee</h1>
                            <p className="text-muted-foreground">Fill in the details below to create a new employee record.</p>
                        </div>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={route('employees.index', filters)}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Employees
                        </Link>
                    </Button>
                </header>
                
                <form onSubmit={handleSubmit}>
                    <Card className="shadow-lg">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                <div className="space-y-8">
                                    <EmployeeNameForm form={form} />
                                    <EmploymentDetailsForm form={form} salaryDefaults={salaryDefaults} />
                                    <WorkScheduleForm form={form} />
                                </div>
                                <div className="space-y-8">
                                    <EarningsForm form={form} />
                                    <ContributionsForm form={form} />
                                    <LoansForm form={form} />
                                    <OtherDeductionsForm form={form} />
                                </div>
                            </div>
                        </CardContent>
                        {/* --- IMPROVED STICKY FOOTER --- */}
                        <CardFooter className="border-t p-6 sticky bottom-0 bg-card/95 backdrop-blur-sm">
                            <div className="flex justify-end gap-4 w-full">
                                <Button type="button" variant="outline" onClick={() => form.reset()}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? 'Saving...' : (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Save Employee
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}