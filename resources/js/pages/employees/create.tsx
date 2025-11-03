import * as React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, RotateCcw, UserPlus } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EmployeeNameForm } from '@/components/form/EmployeeNameForm';
import { EmploymentDetailsForm } from '@/components/form/EmploymentDetailsForm';
import { WorkScheduleForm } from '@/components/form/WorkScheduleForm';
import { EarningsForm } from '@/components/form/EarningsForm';
import { ContributionsForm } from '@/components/form/ContributionsForm';
import { LoansForm } from '@/components/form/LoansForm';
import { OtherDeductionsForm } from '@/components/form/OtherDeductionsForm';
import { type WorkDayTime } from '@/components/work-days-selector';
import { type BreadcrumbItem } from '@/types'; // 👈 ADDED IMPORT
import { validateNoCrossRoleOverlap } from '@/utils/validateSchedules';

// --- DATA TYPES (unchanged) ---
type EmployeeFormData = {
    first_name: string;
    middle_name: string;
    last_name: string;
    roles: string;
    employee_types: Record<string, string>;
    employee_status: string;
    college_program: string;
    work_days: Record<string, WorkDayTime[]>;
    college_work_hours: string;
    college_work_hours_by_program: Record<string, string>;
    college_work_days_by_program: Record<string, WorkDayTime[]>;
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
    salaryDefaults: unknown;
    filters: Record<string, unknown>;
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
    work_days: {},
        college_work_hours: '',
    college_work_hours_by_program: {},
    college_work_days_by_program: {},
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

    // Token to signal children to reset their local UI state
    const [resetToken, setResetToken] = React.useState(0);

    // Your handleSubmit function (unchanged)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate cross-role overlaps only on save
        const overlapCheck = validateNoCrossRoleOverlap(form.data.work_days as any);
        if (!overlapCheck.ok) {
            toast.error(overlapCheck.msg);
            return;
        }
        form.post(route('employees.store'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Employee created successfully!');
                form.reset();
            },
            onError: () => {
                toast.error('Validation Failed', {
                    description: 'Please review the form for errors highlighted in red.',
                });
            },
        });
    };

    // --- BREADCRUMBS DEFINITION ---
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employees',
            href: route('employees.index', filters), // Link back to the employees list with filters
        },
        {
            title: 'Add New Employee',
            href: route('employees.create'),
        },
    ];

    return (
        // Pass the breadcrumbs to your main AppLayout
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add New Employee" />
            <div className="flex h-full flex-col gap-4 py-6 px-2 sm:px-4 md:px-8 space-y-6 p-4 max-w-8xl mx-auto">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 dark:bg-primary p-3 rounded-full border border-primary/20">
                            <UserPlus className="h-6 w-6 text-primary dark:text-primary-foreground" />
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
                                    <EmploymentDetailsForm form={form} salaryDefaults={salaryDefaults} resetToken={resetToken} />
                                    <WorkScheduleForm form={form} />
                                </div>
                                <div className="space-y-8">
                                    <EarningsForm form={form} />
                                    <ContributionsForm form={form} resetToken={resetToken} />
                                    <LoansForm form={form} resetToken={resetToken} />
                                    <OtherDeductionsForm form={form} resetToken={resetToken} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-card/95 border-t p-6 sticky bottom-0 backdrop-blur-sm">
                            <div className="flex justify-end gap-4 w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        form.reset();
                                        setResetToken((t) => t + 1);
                                    }}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? (
                                        <>
                                            <Spinner className="mr-2" />
                                            Saving...
                                        </>
                                    ) : (
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