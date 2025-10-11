import * as React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, RotateCcw, UserPen } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EmployeeNameForm } from '@/components/form/EmployeeNameForm';
import { EmploymentDetailsForm } from '@/components/form/EmploymentDetailsForm';
import { WorkScheduleForm } from '@/components/form/WorkScheduleForm';
import { EarningsForm } from '@/components/form/EarningsForm';
import { ContributionsForm } from '@/components/form/ContributionsForm';
import { LoansForm } from '@/components/form/LoansForm';
import { OtherDeductionsForm } from '@/components/form/OtherDeductionsForm';
import { type WorkDayTime } from '@/components/work-days-selector';
import { type BreadcrumbItem } from '@/types';
import { formatFullName } from '@/utils/formatFullName';
import { calculateSSS, calculatePhilHealth } from '@/utils/salaryFormulas'; // Import the calculation functions

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

type EmployeeDataFromServer = {
    id: number;
    base_salary: string | number | null;
    [key: string]: any;
};

type Props = {
    employee: EmployeeDataFromServer;
    salaryDefaults: any;
    filters: Record<string, any>;
};

// --- MAIN PAGE COMPONENT ---
export default function Edit(props: Props) {
    const { employee, salaryDefaults, filters } = props;

    const toString = (value: any) => (value === null || value === undefined ? '' : String(value));

    const form = useForm<EmployeeFormData>({
        first_name: toString(employee.first_name),
        middle_name: toString(employee.middle_name),
        last_name: toString(employee.last_name),
        roles: toString(employee.roles),
        employee_types: employee.employee_types || {},
        employee_status: toString(employee.employee_status),
        college_program: toString(employee.college_program),
        work_days: employee.work_days || [],
        base_salary: toString(employee.base_salary),
        rate_per_hour: toString(employee.college_rate),
        honorarium: toString(employee.honorarium),
        sss: toString(employee.sss),
        philhealth: toString(employee.philhealth),
        pag_ibig: toString(employee.pag_ibig),
        sss_salary_loan: toString(employee.sss_salary_loan),
        sss_calamity_loan: toString(employee.sss_calamity_loan),
        pagibig_multi_loan: toString(employee.pagibig_multi_loan),
        pagibig_calamity_loan: toString(employee.pagibig_calamity_loan),
        tuition: toString(employee.tuition),
        china_bank: toString(employee.china_bank),
        tea: toString(employee.tea),
    });

    // This useEffect hook recalculates SSS and PhilHealth on component load
    // and whenever the base_salary changes.
    React.useEffect(() => {
        const baseSalary = parseFloat(form.data.base_salary);
        if (!isNaN(baseSalary)) {
            const calculatedSss = calculateSSS(baseSalary);
            const calculatedPhilhealth = calculatePhilHealth(baseSalary);
            
            // Only update if the values are different to prevent unnecessary re-renders
            if (form.data.sss !== toString(calculatedSss) || form.data.philhealth !== toString(calculatedPhilhealth)) {
                form.setData({
                    ...form.data,
                    sss: toString(calculatedSss),
                    philhealth: toString(calculatedPhilhealth),
                });
            }
        } else if (form.data.sss !== '' || form.data.philhealth !== '') {
            // Clear SSS and PhilHealth if base salary is not a number
            form.setData({
                ...form.data,
                sss: '',
                philhealth: '',
            });
        }
    }, [form.data.base_salary]); // The dependency array ensures this runs when base_salary changes

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('employees.update', employee.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Employee updated successfully! ✨');
            },
            onError: (errors) => {
                toast.error('Validation Failed 😥', {
                    description: 'Please review the form for errors highlighted in red.',
                });
            },
        });
    };
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employees',
            href: route('employees.index', filters),
        },
        {
            title: `Edit: #${employee.id} - ${formatFullName(employee.last_name, employee.first_name, employee.middle_name)}`,
            href: route('employees.edit', employee.id),
            isCurrent: true,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Employee: ${formatFullName(employee.last_name, employee.first_name, employee.middle_name)}`} />
            <div className="space-y-6 p-4 md:p-8 max-w-8xl mx-auto">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                            <UserPen className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Edit Employee</h1>
                            <p className="text-muted-foreground">Update the employee's details below.</p>
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
                        <CardFooter className="bg-card/95 border-t p-6 sticky bottom-0 backdrop-blur-sm">
                            <div className="flex justify-end gap-4 w-full">
                                <Button type="button" variant="outline" onClick={() => form.reset()}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? (
                                        <>
                                            <Spinner className="mr-2" />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Save Changes
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