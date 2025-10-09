import * as React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { EmployeeNameForm } from '@/components/form/EmployeeNameForm';
import { EmploymentDetailsForm } from '@/components/form/EmploymentDetailsForm';

// --- DATA TYPES ---
type EmployeeFormData = {
    first_name: string;
    middle_name: string;
    last_name: string;
    roles: string;
    employee_type: string;
    employee_status: string;
    college_program: string;
    // ... more fields will be added later
};

type Props = {
    salaryDefaults: any; // Using 'any' for now to match original code
};

// --- MAIN PAGE COMPONENT ---
export default function CreateEmployeePage(props: Props) {
    const { salaryDefaults } = props;

    const form = useForm<EmployeeFormData>({
        first_name: '',
        middle_name: '',
        last_name: '',
        roles: '',
        employee_type: 'Full Time',
        employee_status: 'Active',
        college_program: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Submission logic will go here
        console.log(form.data);
    };

    return (
        <AppLayout>
            <Head title="Add New Employee" />
            <div className="space-y-8 p-4 md:p-8 max-w-6xl mx-auto">
                <header className="flex flex-col gap-4">
                    <div>
                        <Button asChild variant="outline" size="sm">
                            <Link href={route('employees.index')}>
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
                    {/* The form now uses a responsive two-column grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <EmployeeNameForm form={form} />
                        <EmploymentDetailsForm form={form} salaryDefaults={salaryDefaults} />
                    </div>
                    
                    {/* Other form sections will be added here */}

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                        <Button type="submit">
                            Save Employee
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}