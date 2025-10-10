import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { Landmark } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Helper to format numbers with commas for display
function formatWithCommas(value: string | number): string {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    const parts = stringValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

// Define a type for the form data this component will handle
type EmployeeFormData = {
    roles: string;
    base_salary: string;
    college_rate: string; // Changed here
    honorarium: string;
    [key: string]: any; // Allow other properties
};

interface EarningsFormProps {
    form: UseFormReturn<EmployeeFormData>;
}

export function EarningsForm({ form }: EarningsFormProps) {
    const { data, setData, errors } = form;

    // Memoize role checks for performance
    const rolesArr = React.useMemo(() => data.roles.split(',').map(r => r.trim()).filter(Boolean), [data.roles]);
    const isCollege = React.useMemo(() => rolesArr.includes('college instructor'), [rolesArr]);
    const isBasicEdu = React.useMemo(() => rolesArr.includes('basic education instructor'), [rolesArr]);
    const isAdmin = React.useMemo(() => rolesArr.includes('administrator'), [rolesArr]);

    // --- FIX: This is the corrected logic ---
    const STANDARD_ROLES = ['administrator', 'college instructor', 'basic education instructor'];
    const isOthers = React.useMemo(() => rolesArr.some(role => !STANDARD_ROLES.includes(role)), [rolesArr]);

    // Determine which fields to show based on roles
    const showBaseSalary = isAdmin || isBasicEdu || isOthers;
    const isBaseSalaryOptional = isOthers;
    const showCollegeRate = isCollege || isBasicEdu; // Changed here
    const isCollegeRateOptional = isBasicEdu; // Changed here

    // A generic handler for numeric inputs that manages commas
    const handleNumericChange = (field: keyof EmployeeFormData, value: string) => {
        const rawValue = value.replace(/,/g, '');
        if (/^\d*\.?\d*$/.test(rawValue)) {
            setData(field, rawValue);
        }
    };

    return (
        <Card className="w-full border-gray-200 shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <Landmark className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Salary & Earnings</CardTitle>
                        <CardDescription>Define the compensation for this employee.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Base Salary */}
                {showBaseSalary && (
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="base_salary" className="font-semibold">
                            Base Salary {isBaseSalaryOptional && <span className="text-gray-500 font-normal">(Optional)</span>}
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                            <Input
                                id="base_salary"
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={formatWithCommas(data.base_salary)}
                                onChange={e => handleNumericChange('base_salary', e.target.value)}
                                className={`pl-8 ${errors.base_salary ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {errors.base_salary && <p className="text-sm text-red-600 mt-1">{errors.base_salary}</p>}
                    </div>
                )}

                {/* College Rate */}
                {showCollegeRate && (
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="college_rate" className="font-semibold">
                            College Rate {isCollegeRateOptional && <span className="text-gray-500 font-normal">(Optional)</span>}
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                            <Input
                                id="college_rate"
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={formatWithCommas(data.college_rate)}
                                onChange={e => handleNumericChange('college_rate', e.target.value)}
                                className={`pl-8 ${errors.college_rate ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {errors.college_rate && <p className="text-sm text-red-600 mt-1">{errors.college_rate}</p>}
                    </div>
                )}

                {/* Honorarium */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="honorarium" className="font-semibold">
                        Honorarium {!isOthers && <span className="text-gray-500 font-normal">(Optional)</span>}
                    </Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                        <Input
                            id="honorarium"
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={formatWithCommas(data.honorarium)}
                            onChange={e => handleNumericChange('honorarium', e.target.value)}
                            className={`pl-8 ${errors.honorarium ? 'border-red-500' : ''}`}
                        />
                    </div>
                    {errors.honorarium && <p className="text-sm text-red-600 mt-1">{errors.honorarium}</p>}
                </div>
            </CardContent>
        </Card>
    );
}