import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { Landmark, AlertTriangle } from 'lucide-react';
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
    rate_per_hour: string; // The form sends this, controller maps to college_rate
    honorarium: string;
    [key: string]: any; // Allow other properties
};

interface EarningsFormProps {
    form: UseFormReturn<EmployeeFormData>;
}

export function EarningsForm({ form }: EarningsFormProps) {
    // THE FIX: Destructure clearErrors from the form hook
    const { data, setData, errors, clearErrors } = form;

    // Your original logic (unchanged)
    const rolesArr = React.useMemo(() => data.roles.split(',').map(r => r.trim()).filter(Boolean), [data.roles]);
    const isCollege = React.useMemo(() => rolesArr.includes('college instructor'), [rolesArr]);
    const isBasicEdu = React.useMemo(() => rolesArr.includes('basic education instructor'), [rolesArr]);
    const isAdmin = React.useMemo(() => rolesArr.includes('administrator'), [rolesArr]);
    const STANDARD_ROLES = ['administrator', 'college instructor', 'basic education instructor'];
    const isOthers = React.useMemo(() => rolesArr.some(role => !STANDARD_ROLES.includes(role)), [rolesArr]);
    const showBaseSalary = isAdmin || isBasicEdu || isOthers;
    const isBaseSalaryOptional = isOthers;
    // Renamed to rate_per_hour to match your form state
    const showRatePerHour = isCollege || isBasicEdu; 
    const isRatePerHourOptional = isBasicEdu; 

    // THE FIX: Updated handler to clear errors on change
    const handleNumericChange = (field: keyof EmployeeFormData, value: string) => {
        const rawValue = value.replace(/,/g, '');
        if (/^\d*\.?\d*$/.test(rawValue)) {
            setData(field, rawValue);
            if (errors[field]) {
                clearErrors(field);
            }
        }
    };
    
    // Custom Error Display Component
    const ErrorDisplay = ({ field }: { field: keyof typeof errors }) => {
        if (!errors[field]) return null;
        return (
            <div className="mt-2 flex items-center rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="ml-1 h-4 w-4 shrink-0" />
                <p className="ml-2 text-xs font-medium">{errors[field]}</p>
            </div>
        );
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
                                className={`pl-8 ${errors.base_salary ? 'border-destructive' : ''}`}
                            />
                        </div>
                        <ErrorDisplay field="base_salary" />
                    </div>
                )}

                {/* Rate Per Hour */}
                {showRatePerHour && (
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="rate_per_hour" className="font-semibold">
                           Rate Per Hour {isRatePerHourOptional && <span className="text-gray-500 font-normal">(Optional)</span>}
                        </Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                            <Input
                                id="rate_per_hour"
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={formatWithCommas(data.rate_per_hour)}
                                onChange={e => handleNumericChange('rate_per_hour', e.target.value)}
                                className={`pl-8 ${errors.rate_per_hour ? 'border-destructive' : ''}`}
                            />
                        </div>
                        <ErrorDisplay field="rate_per_hour" />
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
                            className={`pl-8 ${errors.honorarium ? 'border-destructive' : ''}`}
                        />
                    </div>
                    <ErrorDisplay field="honorarium" />
                </div>
            </CardContent>
        </Card>
    );
}