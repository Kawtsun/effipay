import * as React from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Receipt, AlertTriangle, PlusCircle, MinusCircle, PhilippinePeso, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

// Helper to format numbers for display
function formatWithCommas(value: string | number): string {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    const parts = stringValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

type EmployeeFormData = {
    tuition: string;
    china_bank: string;
    tea: string;
    [key: string]: any;
};

interface OtherDeductionsFormProps {
    form: any;
    resetToken?: number; // triggers UI reset from parent
}

export function OtherDeductionsForm({ form, resetToken }: OtherDeductionsFormProps) {
    const { data, setData, errors, clearErrors } = form;

    // State to control visibility of each deduction input
    const [showTuition, setShowTuition] = React.useState(false);
    const [showChinaBank, setShowChinaBank] = React.useState(false);
    const [showTea, setShowTea] = React.useState(false);

    // Reset toggles when parent triggers reset
    React.useEffect(() => {
        if (resetToken === undefined) return;
        setShowTuition(false);
        setShowChinaBank(false);
        setShowTea(false);
    }, [resetToken]);

    // Initialize toggles based on existing form data when editing an employee.
    // If the employee already has deduction values in the database, show the
    // corresponding inputs so the user can see and edit them.
    React.useEffect(() => {
        try {
            const present = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== '';
            if (present(data.tuition)) setShowTuition(true);
            if (present(data.china_bank)) setShowChinaBank(true);
            if (present(data.tea)) setShowTea(true);
        } catch (err) {
            // Ignore if data isn't ready yet
        }
        // Run only on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Effects to clear individual deduction data when they are hidden.
    // Use previous-value refs to avoid clearing server-provided values during
    // the initial mount (the toggles are initialized from form data on mount).
    const prevTuitionRef = React.useRef(showTuition);
    React.useEffect(() => {
        if (prevTuitionRef.current && !showTuition) setData('tuition', '');
        prevTuitionRef.current = showTuition;
    }, [showTuition, setData]);

    const prevChinaRef = React.useRef(showChinaBank);
    React.useEffect(() => {
        if (prevChinaRef.current && !showChinaBank) setData('china_bank', '');
        prevChinaRef.current = showChinaBank;
    }, [showChinaBank, setData]);

    const prevTeaRef = React.useRef(showTea);
    React.useEffect(() => {
        if (prevTeaRef.current && !showTea) setData('tea', '');
        prevTeaRef.current = showTea;
    }, [showTea, setData]);

    // Handler for numeric inputs that allows negative values
    const handleNumericChange = (field: keyof EmployeeFormData, value: string) => {
        const rawValue = value.replace(/,/g, '');
        if (/^-?\d*\.?\d*$/.test(rawValue)) {
            setData(field, rawValue);
            if (errors[field]) clearErrors(field);
        }
    };
    
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
    };    const renderToggleButton = (label: string, isShown: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => (
        <div className="flex items-center justify-between">
            <Label className={`font-semibold flex items-center transition-colors ${isShown ? 'text-green-600' : ''}`}>
                {isShown && <CheckCircle className="h-4 w-4 mr-2" />}
                {label}
            </Label>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setter(prev => !prev)}
                className="text-primary hover:text-primary h-8 px-2"
            >
                {isShown ? <MinusCircle className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                <span className="ml-2">{isShown ? 'Remove' : 'Add'}</span>
            </Button>
        </div>
    );

    const renderDeductionInput = (key: keyof EmployeeFormData, isShown: boolean) => (
        <AnimatePresence>
            {isShown && (
                <motion.div key={key} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2">
                    <div className="relative">
                        <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input 
                            type="text" 
                            placeholder="0.00" 
                            value={formatWithCommas(data[key] as string)} 
                            onChange={e => handleNumericChange(key, e.target.value)} 
                            className={`pl-8 ${errors[key] ? 'border-destructive' : ''}`}
                            autoComplete="off"
                        />
                    </div>
                    <ErrorDisplay field={key} />
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <Card className="w-full shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 dark:bg-primary p-2 rounded-full">
                        <Receipt className="h-6 w-6 text-primary dark:text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle>Other Deductions</CardTitle>
                        <CardDescription>Optionally add other company deductions.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    {renderToggleButton('Tuition', showTuition, setShowTuition)}
                    {renderDeductionInput('tuition', showTuition)}
                </div>
                <div>
                    {renderToggleButton('China Bank', showChinaBank, setShowChinaBank)}
                    {renderDeductionInput('china_bank', showChinaBank)}
                </div>
                <div>
                    {renderToggleButton('TEA', showTea, setShowTea)}
                    {renderDeductionInput('tea', showTea)}
                </div>
            </CardContent>
        </Card>
    );
}