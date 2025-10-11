import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { HandCoins, AlertTriangle, Lightbulb, PlusCircle, MinusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { calculateSSS, calculatePhilHealth } from '@/utils/salaryFormulas';

// Helper to format numbers for display
function formatWithCommas(value: string | number): string {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    const parts = stringValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

type EmployeeFormData = {
    roles: string;
    base_salary: string;
    sss: string;
    philhealth: string;
    pag_ibig: string;
    [key: string]: any;
};

interface ContributionsFormProps {
    form: UseFormReturn<EmployeeFormData>;
}

export function ContributionsForm({ form }: ContributionsFormProps) {
    const { data, setData, errors, clearErrors } = form;

    // State for client-side validation of Pag-IBIG
    const [pagIbigError, setPagIbigError] = React.useState<string | null>(null);

    // Your original state logic (unchanged)
    const isAdmin = React.useMemo(() => 
        data.roles.split(',').map(r => r.trim()).includes('administrator'),
        [data.roles]
    );
    const [showSSS, setShowSSS] = React.useState(false);
    const [showPhilhealth, setShowPhilhealth] = React.useState(false);
    const [showPagibig, setShowPagibig] = React.useState(false);

    // Your original useEffects (unchanged)
    React.useEffect(() => {
        const baseSalaryNum = parseFloat(data.base_salary.replace(/,/g, '')) || 0;
        if (baseSalaryNum > 0) {
            setData(currentData => ({
                ...currentData,
                sss: String(calculateSSS(baseSalaryNum)),
                philhealth: String(calculatePhilHealth(baseSalaryNum)),
            }));
        }
    }, [data.base_salary, setData]);
    
    React.useEffect(() => {
        if (!isAdmin && !showSSS) setData('sss', '');
    }, [isAdmin, showSSS, setData]);

    React.useEffect(() => {
        if (!isAdmin && !showPhilhealth) setData('philhealth', '');
    }, [isAdmin, showPhilhealth, setData]);

    React.useEffect(() => {
        if (!isAdmin && !showPagibig) setData('pag_ibig', '');
    }, [isAdmin, showPagibig, setData]);

    // Updated handler to include client-side Pag-IBIG validation
    const handleNumericChange = (field: keyof EmployeeFormData, value: string) => {
        const rawValue = value.replace(/,/g, '');
        if (/^\d*\.?\d*$/.test(rawValue)) {
            setData(field, rawValue);
            if (errors[field]) clearErrors(field);

            // Client-side validation logic for Pag-IBIG
            if (field === 'pag_ibig') {
                const numValue = parseFloat(rawValue);
                if (rawValue.trim() !== '' && (numValue < 200 || numValue > 2500)) {
                    setPagIbigError('Pag-IBIG must be between ₱200 and ₱2,500.');
                } else {
                    setPagIbigError(null);
                }
            }
        }
    };
    
    // Updated ErrorDisplay to accept a direct message string
    const ErrorDisplay = ({ message }: { message: string | null | undefined }) => {
        if (!message) return null;
        return (
            <div className="mt-2 flex items-center rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="ml-1 h-4 w-4 shrink-0" />
                <p className="ml-2 text-xs font-medium">{message}</p>
            </div>
        );
    };

    // Your original renderToggleButton function (unchanged)
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

    return (
        <Card className="w-full border-gray-200 shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full"><HandCoins className="h-6 w-6 text-primary" /></div>
                    <div>
                        <CardTitle>Statutory Contributions</CardTitle>
                        <CardDescription>
                            {isAdmin ? "Contributions are required for Administrators." : "Optionally add government-mandated contributions."}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Your original render logic (unchanged) */}
                {isAdmin ? (
                    <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="sss_admin" className="font-semibold">SSS Contribution</Label>
                                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span><Input id="sss_admin" value={formatWithCommas(data.sss)} readOnly disabled className="pl-8 bg-gray-100 cursor-not-allowed" /></div>
                                <ErrorDisplay message={errors.sss} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="philhealth_admin" className="font-semibold">PhilHealth Contribution</Label>
                                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span><Input id="philhealth_admin" value={formatWithCommas(data.philhealth)} readOnly disabled className="pl-8 bg-gray-100 cursor-not-allowed" /></div>
                                <ErrorDisplay message={errors.philhealth} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="pag_ibig_admin" className="font-semibold">Pag-IBIG Contribution</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                <Input 
                                    id="pag_ibig_admin" 
                                    type="text" 
                                    placeholder="Min 200.00" 
                                    value={formatWithCommas(data.pag_ibig)} 
                                    onChange={e => handleNumericChange('pag_ibig', e.target.value)} 
                                    className={`pl-8 ${errors.pag_ibig || pagIbigError ? 'border-destructive' : ''}`} 
                                />
                            </div>
                            <ErrorDisplay message={errors.pag_ibig || pagIbigError} />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* SSS Section */}
                        <div>
                            {renderToggleButton('SSS Contribution', showSSS, setShowSSS)}
                            <AnimatePresence>
                                {showSSS && (
                                    <motion.div key="sss-input" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2">
                                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span><Input value={formatWithCommas(data.sss)} readOnly disabled className="pl-8 bg-gray-100 cursor-not-allowed" /></div>
                                        <ErrorDisplay message={errors.sss} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {/* PhilHealth Section */}
                        <div>
                            {renderToggleButton('PhilHealth Contribution', showPhilhealth, setShowPhilhealth)}
                            <AnimatePresence>
                                {showPhilhealth && (
                                     <motion.div key="philhealth-input" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2">
                                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span><Input value={formatWithCommas(data.philhealth)} readOnly disabled className="pl-8 bg-gray-100 cursor-not-allowed" /></div>
                                        <ErrorDisplay message={errors.philhealth} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {/* Pag-IBIG Section */}
                        <div>
                            {renderToggleButton('Pag-IBIG Contribution', showPagibig, setShowPagibig)}
                             <AnimatePresence>
                                {showPagibig && (
                                     <motion.div key="pagibig-input" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                            <Input 
                                                type="text" 
                                                placeholder="Min 200.00" 
                                                value={formatWithCommas(data.pag_ibig)} 
                                                onChange={e => handleNumericChange('pag_ibig', e.target.value)} 
                                                className={`pl-8 ${errors.pag_ibig || pagIbigError ? 'border-destructive' : ''}`} 
                                            />
                                        </div>
                                        <ErrorDisplay message={errors.pag_ibig || pagIbigError} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}