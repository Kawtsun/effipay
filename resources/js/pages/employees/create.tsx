import * as React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { EmployeeNameForm } from '@/components/form/EmployeeNameForm';
import { EmploymentDetailsForm } from '@/components/form/EmploymentDetailsForm';

// --- DATA TYPES ---
type EmployeeFormData = {
    first_name: string;
    middle_name: string;
    last_name: string;
    roles: string;
    employee_types: Record<string, string>; // Correct structure for multiple types
    employee_status: string;
    college_program: string;
    // ... more fields will be added later
};

type Props = {
    salaryDefaults: any;
    filters: Record<string, any>; // For the 'Back' button
};

// --- MAIN PAGE COMPONENT (Renamed to Index) ---
export default function Index(props: Props) {
    const { salaryDefaults, filters } = props;

    const form = useForm<EmployeeFormData>({
        first_name: '',
        middle_name: '',
        last_name: '',
        roles: '',
        employee_types: {}, // Initialize as an empty object
        employee_status: 'Active',
        college_program: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Use Inertia's post method to submit the form data to your backend
        form.post(route('employees.store'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Employee created successfully!');
                // You can optionally reset the form on success if you want the user to add another.
                // form.reset(); 
            },
            onError: (errors) => {
                // Inertia automatically handles displaying validation errors.
                // This toast is for general feedback.
                toast.error('There was an error creating the employee. Please review the form for errors.');
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Add New Employee" />
            <div className="space-y-8 p-4 md:p-8 max-w-6xl mx-auto">
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
                        <EmployeeNameForm form={form} />
                        <EmploymentDetailsForm form={form} salaryDefaults={salaryDefaults} />
                    </div>
                    
                    {/* Other form sections will be added here */}

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