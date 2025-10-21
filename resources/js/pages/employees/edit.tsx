import * as React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, RotateCcw, UserPen } from 'lucide-react';
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
    // WorkScheduleForm expects a per-role map of days
    work_days: Record<string, WorkDayTime[]>;
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

type EmployeeDataFromServer = {
    id: number;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    roles?: string | null;
    employee_types?: Record<string, string> | null;
    employee_status?: string | null;
    college_program?: string | null;
    // Older records may store this as a flat array; newer UI uses a per-role map
    work_days?: WorkDayTime[] | Record<string, WorkDayTime[]> | null;
    college_work_hours_by_program?: Record<string, string> | null;
    college_work_days_by_program?: Record<string, WorkDayTime[]> | null;
    base_salary?: string | number | null;
    college_rate?: string | number | null;
    rate_per_hour?: string | number | null;
    honorarium?: string | number | null;
    sss?: string | number | null;
    philhealth?: string | number | null;
    pag_ibig?: string | number | null;
    sss_salary_loan?: string | number | null;
    sss_calamity_loan?: string | number | null;
    pagibig_multi_loan?: string | number | null;
    pagibig_calamity_loan?: string | number | null;
    tuition?: string | number | null;
    china_bank?: string | number | null;
    tea?: string | number | null;
};

type Props = {
    employee: EmployeeDataFromServer;
    salaryDefaults: unknown;
    filters: Record<string, unknown>;
};

// --- MAIN PAGE COMPONENT ---
export default function Edit(props: Props) {
    const { employee, salaryDefaults, filters } = props;

    const toString = (value: unknown) => (value === null || value === undefined ? '' : String(value));

    // Derive roles array from employee to prefill work_days per role
    const rolesArr = React.useMemo(
        () =>
            toString(employee.roles)
                .split(',')
                .map(r => r.trim())
                .filter(Boolean),
        [employee.roles]
    );

    // Normalize server-provided work_days into a per-role map expected by WorkScheduleForm
    const initialWorkDaysByRole: Record<string, WorkDayTime[]> = React.useMemo(() => {
        const raw = employee.work_days as unknown;
        // If it's already an object map, pass-through
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            return raw as Record<string, WorkDayTime[]>;
        }
        // If it's an array (legacy), attach to the employee's role(s)
        const arr = Array.isArray(raw) ? (raw as WorkDayTime[]) : [];
        if (rolesArr.length === 1) {
            return { [rolesArr[0]]: arr };
        }
        if (rolesArr.length > 1 && arr.length > 0) {
            const map: Record<string, WorkDayTime[]> = {};
            rolesArr.forEach(role => {
                map[role] = arr;
            });
            return map;
        }
        return {};
    }, [employee.work_days, rolesArr]);

    const form = useForm<EmployeeFormData>({
        first_name: toString(employee.first_name),
        middle_name: toString(employee.middle_name),
        last_name: toString(employee.last_name),
        roles: toString(employee.roles),
        employee_types: employee.employee_types || ({} as Record<string, string>),
        employee_status: toString(employee.employee_status),
        college_program: toString(employee.college_program),
    work_days: initialWorkDaysByRole,
    college_work_hours_by_program: (employee.college_work_hours_by_program || {}) as Record<string, string>,
    college_work_days_by_program: (employee.college_work_days_by_program || {}) as Record<string, WorkDayTime[]>,
        base_salary: toString(employee.base_salary),
    rate_per_hour: toString(employee.college_rate ?? employee.rate_per_hour),
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

    // Token to signal children to reset their local UI state (mirrors create page behavior)
    const [resetToken, setResetToken] = React.useState(0);

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
    }, [form, form.data.base_salary]); // The dependency array ensures this runs when base_salary changes

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put(route('employees.update', employee.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Employee updated successfully! ✨');
            },
            onError: () => {
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
            title: `Edit: #${employee.id} - ${formatFullName(toString(employee.last_name), toString(employee.first_name), toString(employee.middle_name))}`,
            href: route('employees.edit', employee.id),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Employee: ${formatFullName(toString(employee.last_name), toString(employee.first_name), toString(employee.middle_name))}`} />
            <div className="flex h-full flex-col gap-4 py-6 px-2 sm:px-4 md:px-8 space-y-6 p-4 max-w-8xl mx-auto">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 dark:bg-primary p-3 rounded-full border border-primary/20">
                            <UserPen className="h-6 w-6 text-primary dark:text-primary-foreground" />
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
                                        // Explicitly clear all form fields to mimic the create page reset behavior
                                        form.setData({
                                            first_name: '',
                                            middle_name: '',
                                            last_name: '',
                                            roles: '',
                                            employee_types: {},
                                            employee_status: 'Active',
                                            college_program: '',
                                            work_days: {},
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
                                        // Notify child components to reset any internal state
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