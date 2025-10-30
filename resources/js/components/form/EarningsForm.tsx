import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { Landmark, AlertTriangle, Info, Asterisk, PhilippinePeso, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    const { data, setData, errors, clearErrors } = form;

    const rolesArr = React.useMemo(() => (data.roles || '').split(',').map((r: string) => r.trim()).filter(Boolean), [data.roles]);
    // Lower-cased roles for consistent, case-insensitive checks
    const rolesLower = React.useMemo(() => rolesArr.map((r: string) => String(r).toLowerCase()), [rolesArr]);
    const isCollege = React.useMemo(() => rolesLower.some((r: string) => r.includes('college')), [rolesLower]);
    // Detect basic education by matching common variants
    const isBasicEdu = React.useMemo(
        () => rolesLower.some((r: string) => r.includes('basic') && r.includes('education') || r.includes('basic-education') || r === 'basic education'),
        [rolesLower]
    );
    // Detect administrator by common substrings/variants
    const isAdmin = React.useMemo(() => rolesLower.some((r: string) => r.includes('admin') || r.includes('administrator')), [rolesLower]);
    const STANDARD_ROLES = React.useMemo(() => ['administrator', 'college instructor', 'basic education instructor'], []);
    const isOthers = React.useMemo(() => rolesLower.some((role: string) => !STANDARD_ROLES.includes(role)), [rolesLower, STANDARD_ROLES]);
    const isOnlyOthers = isOthers && !(isAdmin || isBasicEdu || isCollege)
    const showBaseSalary = isAdmin || isBasicEdu || isOthers;
    // Base salary is required when Administrator or Basic Education roles are present.
    const isBaseSalaryRequired = isAdmin || isBasicEdu;
    // Base salary is optional only when the selected role is 'others' and
    // there are no administrator or basic education roles selected.
    // (isBaseSalaryOptional is not used directly; compute inline where needed if needed later)
    const showRatePerHour = isCollege || isBasicEdu;
    const isRatePerHourOptional = isBasicEdu && !isCollege;
    const showHonorariumOptional = !isOthers || (isAdmin && isOthers);

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
            <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    {errors[field]}
                </AlertDescription>
            </Alert>
        );
    };

    const motionProps = {
        initial: { opacity: 0, height: 0, marginTop: 0 },
        animate: { opacity: 1, height: 'auto', marginTop: 0 },
        exit: { opacity: 0, height: 0, marginTop: 0 },
        transition: { duration: 0.3, ease: 'easeInOut' as const },
        className: 'overflow-hidden',
    };

    const honorariumField = (
        <div className="flex flex-col gap-2">
            <Label htmlFor="honorarium" className="font-semibold flex items-center">
                Honorarium {!showHonorariumOptional && <Asterisk className="h-4 w-4 text-destructive ml-1" />}
            </Label>
            <div className="relative">
                <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
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
    );

    const baseSalaryField = (
        <div className="flex flex-col gap-2">
                <Label htmlFor="base_salary" className="font-semibold flex items-center">
                Base Salary {isBaseSalaryRequired && <Asterisk className="h-4 w-4 text-destructive ml-1" />}
            </Label>
            <div className="relative">
                <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
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
    );

    return (
        <Card className="w-full shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 dark:bg-primary p-2 rounded-full">
                        <Banknote className="h-6 w-6 text-primary dark:text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle>Earnings</CardTitle>
                        <CardDescription>Define the earnings for this employee.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <AnimatePresence mode="wait">
                    {rolesArr.length === 0 ? (
                        <motion.div key="no-roles-alert" {...motionProps}>
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Please select an employee role first to set their salary and earnings.
                                </AlertDescription>
                            </Alert>
                        </motion.div>
                    ) : (
                        <motion.div key="earning-fields" {...motionProps} className="space-y-6">
                            {isOnlyOthers ? (
                                <>
                                    {honorariumField}
                                    {showBaseSalary && baseSalaryField}
                                </>
                            ) : (
                                <>
                                    {showBaseSalary && baseSalaryField}
                                    {showRatePerHour && (
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="rate_per_hour" className="font-semibold flex items-center">
                                                Rate Per Hour {!isRatePerHourOptional && <Asterisk className="h-4 w-4 text-destructive ml-1" />}
                                            </Label>
                                            <div className="relative">
                                                <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
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
                                    {honorariumField}
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}