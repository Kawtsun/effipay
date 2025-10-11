import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { HandCoins, AlertTriangle, PlusCircle, MinusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { calculateSSS, calculatePhilHealth } from '@/utils/salaryFormulas';

// Helper to format numbers with commas and specific decimal places
function formatNumber(value: string | number, decimals: number): string {
    if (value === null || value === undefined || value === '') return '';
    const num = Number(value);
    if (isNaN(num)) return '';

    const fixedValue = num.toFixed(decimals);
    const parts = fixedValue.split('.');
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

    const [pagIbigError, setPagIbigError] = React.useState<string | null>(null);
    const isAdmin = React.useMemo(() => 
        data.roles.split(',').map(r => r.trim()).includes('administrator'),
        [data.roles]
    );
    const [showSSS, setShowSSS] = React.useState(false);
    const [showPhilhealth, setShowPhilhealth] = React.useState(false);
    const [showPagibig, setShowPagibig] = React.useState(false);

    // This effect handles the calculation and clearing of SSS and PhilHealth
    React.useEffect(() => {
        const baseSalaryNum = parseFloat(data.base_salary.replace(/,/g, ''));
        
        // If the base salary is not a valid number, clear the fields
        if (isNaN(baseSalaryNum) || baseSalaryNum <= 0) {
            if (data.sss !== '' || data.philhealth !== '') {
                setData(currentData => ({
                    ...currentData,
                    sss: '',
                    philhealth: '',
                }));
            }
            return; // Exit the effect early
        }

        // If base salary is a valid number, perform the calculation
        const calculatedSss = calculateSSS(baseSalaryNum);
        const calculatedPhilhealth = calculatePhilHealth(baseSalaryNum);
        
        const formattedSss = calculatedSss.toFixed(2);
        const formattedPhilhealth = calculatedPhilhealth.toFixed(2);
        
        if (data.sss !== formattedSss || data.philhealth !== formattedPhilhealth) {
            setData(currentData => ({
                ...currentData,
                sss: formattedSss,
                philhealth: formattedPhilhealth,
            }));
        }
    }, [data.base_salary, setData, data.sss, data.philhealth]);

    // Effects to clear fields when they are hidden
    React.useEffect(() => {
        if (!isAdmin && !showSSS && data.sss !== '') {
            setData('sss', '');
        }
    }, [isAdmin, showSSS, setData, data.sss]);

    React.useEffect(() => {
        if (!isAdmin && !showPhilhealth && data.philhealth !== '') {
            setData('philhealth', '');
        }
    }, [isAdmin, showPhilhealth, setData, data.philhealth]);

    React.useEffect(() => {
        if (!isAdmin && !showPagibig && data.pag_ibig !== '') {
            setData('pag_ibig', '');
        }
    }, [isAdmin, showPagibig, setData, data.pag_ibig]);

    const handleNumericChange = (field: keyof EmployeeFormData, value: string) => {
        const rawValue = value.replace(/,/g, '');
        if (/^\d*\.?\d*$/.test(rawValue)) {
            setData(field, rawValue);
            if (errors[field]) clearErrors(field);

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
    
    const ErrorDisplay = ({ message }: { message: string | null | undefined }) => {
        if (!message) return null;
        return (
            <div className="mt-2 flex items-center rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="ml-1 h-4 w-4 shrink-0" />
                <p className="ml-2 text-xs font-medium">{message}</p>
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
                {isAdmin ? (
                    <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="sss_admin" className="font-semibold">SSS Contribution</Label>
                                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span><Input id="sss_admin" value={formatNumber(data.sss, 2)} readOnly disabled className="pl-8 bg-gray-100 cursor-not-allowed" /></div>
                                <ErrorDisplay message={errors.sss} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="philhealth_admin" className="font-semibold">PhilHealth Contribution</Label>
                                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span><Input id="philhealth_admin" value={formatNumber(data.philhealth, 2)} readOnly disabled className="pl-8 bg-gray-100 cursor-not-allowed" /></div>
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
                                    value={formatNumber(data.pag_ibig, 2)} 
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
                                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span><Input value={formatNumber(data.sss, 2)} readOnly disabled className="pl-8 bg-gray-100 cursor-not-allowed" /></div>
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
                                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span><Input value={formatNumber(data.philhealth, 2)} readOnly disabled className="pl-8 bg-gray-100 cursor-not-allowed" /></div>
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
                                                value={formatNumber(data.pag_ibig, 2)} 
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