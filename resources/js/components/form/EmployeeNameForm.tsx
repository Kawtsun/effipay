import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { UserCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Define a type for the form data this component will handle.
type EmployeeFormData = {
    first_name: string;
    middle_name: string;
    last_name: string;
};

interface EmployeeNameFormProps {
    form: UseFormReturn<EmployeeFormData>;
}

export function EmployeeNameForm({ form }: EmployeeNameFormProps) {
    const { data, setData, errors } = form;

    return (
        <Card className="w-full border-gray-200 shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <UserCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <CardTitle>Employee Name</CardTitle>
                        <CardDescription>Enter the employee's legal name as it appears on official documents.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Last Name */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="last_name" className="font-semibold">Last Name</Label>
                        <Input
                            id="last_name"
                            type="text"
                            placeholder="e.g., Manzano"
                            value={data.last_name}
                            onChange={e => setData('last_name', e.target.value)}
                            required
                            className={errors.last_name ? 'border-red-500' : ''}
                        />
                        {errors.last_name && <p className="text-sm text-red-600 mt-1">{errors.last_name}</p>}
                    </div>

                    {/* First Name */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="first_name" className="font-semibold">First Name</Label>
                        <Input
                            id="first_name"
                            type="text"
                            placeholder="e.g., Isaac Rossdale"
                            value={data.first_name}
                            onChange={e => setData('first_name', e.target.value)}
                            required
                            className={errors.first_name ? 'border-red-500' : ''}
                        />
                        {errors.first_name && <p className="text-sm text-red-600 mt-1">{errors.first_name}</p>}
                    </div>

                    {/* Middle Name */}
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor="middle_name" className="font-semibold">
                            Middle Name <span className="text-gray-500 font-normal">(Optional)</span>
                        </Label>
                        <Input
                            id="middle_name"
                            type="text"
                            placeholder="e.g., Dizon"
                            value={data.middle_name}
                            onChange={e => setData('middle_name', e.target.value)}
                            className={errors.middle_name ? 'border-red-500' : ''}
                        />
                        {errors.middle_name && <p className="text-sm text-red-600 mt-1">{errors.middle_name}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}