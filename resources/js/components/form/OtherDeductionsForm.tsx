import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { Receipt, AlertTriangle, PlusCircle, MinusCircle, PhilippinePeso } from 'lucide-react';
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
    form: UseFormReturn<EmployeeFormData>;
}

export function OtherDeductionsForm({ form }: OtherDeductionsFormProps) {
    const { data, setData, errors, clearErrors } = form;

    // State to control visibility of each deduction input
    const [showTuition, setShowTuition] = React.useState(false);
    const [showChinaBank, setShowChinaBank] = React.useState(false);
    const [showTea, setShowTea] = React.useState(false);

    // Effects to clear individual deduction data when they are hidden
    React.useEffect(() => { if (!showTuition) setData('tuition', ''); }, [showTuition, setData]);
    React.useEffect(() => { if (!showChinaBank) setData('china_bank', ''); }, [showChinaBank, setData]);
    React.useEffect(() => { if (!showTea) setData('tea', ''); }, [showTea, setData]);

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
            <div className="mt-2 flex items-center rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="ml-2 text-xs font-medium">{errors[field]}</p>
            </div>
        );
    };

    const renderToggleButton = (label: string, isShown: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => (
        <div className="flex items-center justify-between">
            <Label className="font-semibold">{label}</Label>
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