import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { AlertTriangle, UserCircle, Asterisk } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type EmployeeFormData = {
    first_name: string;
    middle_name: string;
    last_name: string;
    [key: string]: any;
};

interface EmployeeNameFormProps {
    form: UseFormReturn<EmployeeFormData>;
}

export function EmployeeNameForm({ form }: EmployeeNameFormProps) {
    // THE FIX: Destructure clearErrors from the form hook
    const { data, setData, errors, clearErrors } = form;

    // A generic handler that updates the data and clears the error for that specific field
    const handleChange = (field: keyof EmployeeFormData, value: string) => {
        setData(field, value);
        // If an error exists for this field, clear it
        if (errors[field]) {
            clearErrors(field);
        }
    };

    const ErrorDisplay = ({ field }: { field: keyof typeof errors }) => {
        if (!errors[field]) {
            return null;
        }

        return (
            <div className="mt-2 flex items-center rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="ml-1 h-4 w-4 shrink-0" />
                <p className="ml-2 text-xs font-medium">
                    {errors[field]}
                </p>
            </div>
        );
    };

    return (
        <Card className="w-full shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 dark:bg-primary p-2 rounded-full">
                        <UserCircle className="h-6 w-6 text-primary dark:text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                        <CardTitle>Employee Name</CardTitle>
                        <CardDescription>Enter the employee's legal name as it appears on official documents.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Last Name */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="last_name" className="font-semibold flex items-center">
                            Last Name <Asterisk className="h-4 w-4 text-destructive ml-1" />
                        </Label>
                        <Input
                            id="last_name"
                            type="text"
                            placeholder="e.g., Manzano"
                            value={data.last_name}
                            onChange={e => handleChange('last_name', e.target.value)}
                            className={errors.last_name ? 'border-destructive' : ''}
                        />
                        <ErrorDisplay field="last_name" />
                    </div>

                    {/* First Name */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="first_name" className="font-semibold flex items-center">
                            First Name <Asterisk className="h-4 w-4 text-destructive ml-1" />
                        </Label>
                        <Input
                            id="first_name"
                            type="text"
                            placeholder="e.g., Isaac Rossdale"
                            value={data.first_name}
                            onChange={e => handleChange('first_name', e.target.value)}
                            className={errors.first_name ? 'border-destructive' : ''}
                        />
                        <ErrorDisplay field="first_name" />
                    </div>

                    {/* Middle Name */}
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor="middle_name" className="font-semibold">
                            Middle Name
                        </Label>
                        <Input
                            id="middle_name"
                            type="text"
                            placeholder="e.g., Dizon"
                            value={data.middle_name}
                            onChange={e => handleChange('middle_name', e.target.value)}
                            className={errors.middle_name ? 'border-destructive' : ''}
                        />
                        <ErrorDisplay field="middle_name" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}