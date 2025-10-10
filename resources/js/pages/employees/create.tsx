import * as React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { EmployeeNameForm } from '@/components/form/EmployeeNameForm';
import { EmploymentDetailsForm } from '@/components/form/EmploymentDetailsForm';
import { WorkScheduleForm } from '@/components/form/WorkScheduleForm';
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
};

type Props = {
    salaryDefaults: any;
    filters: Record<string, any>;
};

// --- MAIN PAGE COMPONENT ---
export default function Index(props: Props) {
    const { salaryDefaults, filters } = props;

    const form = useForm<EmployeeFormData>({
        first_name: '',
        middle_name: '',
        last_name: '',
        roles: '',
        employee_types: {},
        employee_status: 'Active',
        college_program: '',
        work_days: [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('employees.store'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Employee created successfully!'),
            onError: () => toast.error('There was an error creating the employee. Please review the form for errors.'),
        });
    };

    return (
        <AppLayout>
            <Head title="Add New Employee" />
            <div className="space-y-8 p-4 md:p-8 max-w-6xl mx-auto">
                {/* 👇 THIS HEADER SECTION IS NOW RESTORED */}
                <header className="flex flex-col gap-4">
                    <div>
                        <Button asChild variant="outline" size="sm">
                            <Link href={route('employees.index', filters)}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Employees
                            </Link>
                        </Button>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Add New Employee</h1>
                        <p className="text-muted-foreground">Fill in the details below to create a new employee record.</p>
                    </div>
                </header>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Left Column */}
                        <div className="space-y-8">
                            <EmployeeNameForm form={form} />
                            <WorkScheduleForm form={form} />
                        </div>
                        {/* Right Column */}
                        <EmploymentDetailsForm form={form} salaryDefaults={salaryDefaults} />
                    </div>
                    
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => form.reset()}>
                            Reset
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving...' : 'Save Employee'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}