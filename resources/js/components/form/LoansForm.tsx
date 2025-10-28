import * as React from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Wallet, AlertTriangle, PlusCircle, MinusCircle, PhilippinePeso, CheckCircle, ReceiptText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

// Helper to format numbers with commas for display
function formatWithCommas(value: string | number): string {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    const parts = stringValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

type EmployeeFormData = {
    sss_salary_loan: string;
    sss_calamity_loan: string;
    pagibig_multi_loan: string;
    pagibig_calamity_loan: string;
    [key: string]: any;
};

interface LoansFormProps {
    form: any;
    resetToken?: number; // triggers UI reset from parent
}

export function LoansForm({ form, resetToken }: LoansFormProps) {
    const { data, setData, errors, clearErrors } = form;

    // Your original state logic (unchanged)
    const [showSssSalary, setShowSssSalary] = React.useState(false);
    const [showSssCalamity, setShowSssCalamity] = React.useState(false);
    const [showPagibigMulti, setShowPagibigMulti] = React.useState(false);
    const [showPagibigCalamity, setShowPagibigCalamity] = React.useState(false);

    // Reset toggles when parent triggers reset
    React.useEffect(() => {
        if (resetToken === undefined) return;
        setShowSssSalary(false);
        setShowSssCalamity(false);
        setShowPagibigMulti(false);
        setShowPagibigCalamity(false);
    }, [resetToken]);

    // Initialize toggles based on existing form data when editing an employee.
    // If the employee already has loan values in the database, show the
    // corresponding inputs so the user can see and edit them.
    React.useEffect(() => {
        try {
            const present = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== '';
            if (present(data.sss_salary_loan)) setShowSssSalary(true);
            if (present(data.sss_calamity_loan)) setShowSssCalamity(true);
            if (present(data.pagibig_multi_loan)) setShowPagibigMulti(true);
            if (present(data.pagibig_calamity_loan)) setShowPagibigCalamity(true);
        } catch (err) {
            // Non-fatal — if data isn't available yet, ignore and allow user to toggle manually
        }
        // Run only on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Clear effects: only clear a field when its visibility is toggled from
    // true -> false after initial mount. This avoids a race where the mount
    // initialization (which sets toggles based on existing data) runs and the
    // clear effects — which also run on mount — wipe the server-provided values.
    const prevSssSalaryRef = React.useRef(showSssSalary);
    React.useEffect(() => {
        if (prevSssSalaryRef.current && !showSssSalary) {
            setData('sss_salary_loan', '');
        }
        prevSssSalaryRef.current = showSssSalary;
    }, [showSssSalary, setData]);

    const prevSssCalRef = React.useRef(showSssCalamity);
    React.useEffect(() => {
        if (prevSssCalRef.current && !showSssCalamity) {
            setData('sss_calamity_loan', '');
        }
        prevSssCalRef.current = showSssCalamity;
    }, [showSssCalamity, setData]);

    const prevPagibigMultiRef = React.useRef(showPagibigMulti);
    React.useEffect(() => {
        if (prevPagibigMultiRef.current && !showPagibigMulti) {
            setData('pagibig_multi_loan', '');
        }
        prevPagibigMultiRef.current = showPagibigMulti;
    }, [showPagibigMulti, setData]);

    const prevPagibigCalRef = React.useRef(showPagibigCalamity);
    React.useEffect(() => {
        if (prevPagibigCalRef.current && !showPagibigCalamity) {
            setData('pagibig_calamity_loan', '');
        }
        prevPagibigCalRef.current = showPagibigCalamity;
    }, [showPagibigCalamity, setData]);

    // Updated handler to allow negative numbers
    const handleNumericChange = (field: keyof EmployeeFormData, value: string) => {
        const rawValue = value.replace(/,/g, '');
        // THE FIX IS HERE: The regex now allows an optional leading hyphen.
        if (/^-?\d*\.?\d*$/.test(rawValue)) {
            setData(field, rawValue);
            if (errors[field]) clearErrors(field);
        }
    };
    
    // Your original ErrorDisplay component (unchanged)
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

    // Your original renderToggleButton function (unchanged)
    const renderToggleButton = (label: string, isShown: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => (
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
    
    // Your original renderLoanInput function (unchanged)
    const renderLoanInput = (key: keyof EmployeeFormData, label: string, isShown: boolean) => (
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
                        <ReceiptText className="h-6 w-6 text-primary dark:text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle>Loans</CardTitle>
                        <CardDescription>Optionally add loan details.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    {renderToggleButton('SSS Salary Loan', showSssSalary, setShowSssSalary)}
                    {renderLoanInput('sss_salary_loan', 'SSS Salary Loan', showSssSalary)}
                </div>
                <div>
                    {renderToggleButton('SSS Calamity Loan', showSssCalamity, setShowSssCalamity)}
                    {renderLoanInput('sss_calamity_loan', 'SSS Calamity Loan', showSssCalamity)}
                </div>
                <div>
                    {renderToggleButton('Pag-IBIG Multi-Purpose Loan', showPagibigMulti, setShowPagibigMulti)}
                    {renderLoanInput('pagibig_multi_loan', 'Pag-IBIG Multi-Purpose Loan', showPagibigMulti)}
                </div>
                <div>
                    {renderToggleButton('Pag-IBIG Calamity Loan', showPagibigCalamity, setShowPagibigCalamity)}
                    {renderLoanInput('pagibig_calamity_loan', 'Pag-IBIG Calamity Loan', showPagibigCalamity)}
                </div>
            </CardContent>
        </Card>
    );
}