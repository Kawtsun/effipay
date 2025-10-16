import * as React from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HandCoins, AlertTriangle, PlusCircle, MinusCircle, PhilippinePeso, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Helper to format numbers with commas for display
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
    form: any;
    resetToken?: number; // triggers UI reset from parent
}

export function ContributionsForm({ form, resetToken }: ContributionsFormProps) {
    const { data, setData, errors, clearErrors } = form;

    const [pagIbigError, setPagIbigError] = React.useState<string | null>(null);
    const isAdmin = React.useMemo(() =>
        data.roles.split(',').map((r: string) => r.trim()).includes('administrator'),
        [data.roles]
    );
    const [showSSS, setShowSSS] = React.useState(false);
    const [showPhilhealth, setShowPhilhealth] = React.useState(false);
    const [showPagibig, setShowPagibig] = React.useState(false);

    // Reset all UI toggles and local validation state when parent triggers reset
    React.useEffect(() => {
        if (resetToken === undefined) return;
        setShowSSS(false);
        setShowPhilhealth(false);
        setShowPagibig(false);
        setPagIbigError(null);
    }, [resetToken]);

    // Effects to clear fields when they are hidden
    React.useEffect(() => {
        if (!isAdmin && !showSSS) {
            setData('sss', '');
        } else if (!isAdmin && showSSS) {
            setData('sss', '0'); // Set to a placeholder value when added
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, showSSS]);

    React.useEffect(() => {
        if (!isAdmin && !showPhilhealth) {
            setData('philhealth', '');
        } else if (!isAdmin && showPhilhealth) {
            setData('philhealth', '0'); // Set to a placeholder value when added
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, showPhilhealth]);

    React.useEffect(() => {
        if (!isAdmin && !showPagibig) {
            setData('pag_ibig', '');
        } else if (!isAdmin && showPagibig) {
            setData('pag_ibig', '200.00'); // Default to min value
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, showPagibig]);

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

    const renderToggleButton = (
        label: string,
        isShown: boolean,
        setter: React.Dispatch<React.SetStateAction<boolean>>,
        tooltipText?: string
    ) => (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Label className={`font-semibold flex items-center transition-colors ${isShown ? 'text-green-600' : ''}`}>
                    {isShown && <CheckCircle className="h-4 w-4 mr-2" />}
                    {label}
                </Label>
                {tooltipText && (
                    <Tooltip>
                        <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{tooltipText}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            <Button
                type="button"
                variant={isShown ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setter(prev => !prev)}
                className={`h-8 px-2 ${isShown ? 'text-primary hover:text-primary' : 'text-primary hover:text-primary'}`}
            >
                {isShown ? <MinusCircle className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                <span className="ml-2">{isShown ? 'Remove' : 'Add'}</span>
            </Button>
        </div>
    );

    return (
        <Card className="w-full shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 dark:bg-primary p-2 rounded-full">
                        <HandCoins className="h-6 w-6 text-primary dark:text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle>Statutory Contributions</CardTitle>
                        <CardDescription>
                            {isAdmin ? "Contributions are required for Administrators." : "Optionally add government-mandated contributions."}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <TooltipProvider>
                    {isAdmin ? (
                        <div className="space-y-4">
                            {/* SSS Section */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Label className="font-semibold flex items-center text-green-600">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            SSS Contribution
                                        </Label>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-gray-500" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>SSS contribution will be calculated after running the payroll.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                            {/* PhilHealth Section */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Label className="font-semibold flex items-center text-green-600">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            PhilHealth Contribution
                                        </Label>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-gray-500" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>PhilHealth contribution will be calculated after running the payroll.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                            {/* Pag-IBIG Section */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <Label className="font-semibold flex items-center text-green-600">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Pag-IBIG Contribution
                                    </Label>
                                </div>
                                <div className="mt-2">
                                    <div className="relative">
                                        <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <Input
                                            type="text"
                                            placeholder="Min 200.00"
                                            value={formatWithCommas(data.pag_ibig)}
                                            onChange={e => handleNumericChange('pag_ibig', e.target.value)}
                                            className={`pl-8 ${errors.pag_ibig || pagIbigError ? 'border-destructive' : ''}`}
                                        />
                                    </div>
                                    {pagIbigError && (
                                        <Alert variant="destructive" className="mt-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertDescription>{pagIbigError}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* SSS Section */}
                            <div>
                                {renderToggleButton('SSS Contribution', showSSS, setShowSSS, 'SSS contribution will be calculated after running the payroll.')}
                            </div>
                            {/* PhilHealth Section */}
                            <div>
                                {renderToggleButton('PhilHealth Contribution', showPhilhealth, setShowPhilhealth, 'PhilHealth contribution will be calculated after running the payroll.')}
                            </div>
                            {/* Pag-IBIG Section */}
                            <div>
                                {renderToggleButton('Pag-IBIG Contribution', showPagibig, setShowPagibig)}
                                <AnimatePresence>
                                    {showPagibig && (
                                        <motion.div key="pagibig-input" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-2">
                                            <div className="relative">
                                                <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                                <Input
                                                    type="text"
                                                    placeholder="Min 200.00"
                                                    value={formatWithCommas(data.pag_ibig)}
                                                    onChange={e => handleNumericChange('pag_ibig', e.target.value)}
                                                    className={`pl-8 ${errors.pag_ibig || pagIbigError ? 'border-destructive' : ''}`}
                                                />
                                            </div>
                                            {pagIbigError && (
                                                <Alert variant="destructive" className="mt-2">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <AlertDescription>{pagIbigError}</AlertDescription>
                                                </Alert>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}