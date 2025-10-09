import { formatFullName } from '@/utils/formatFullName';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
// Resolved path issues for local components
import DialogScrollArea from '@/components/dialog-scroll-area'; 
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Calendar, CheckCircle, Calculator, Loader2, TrendingUp, Lightbulb } from "lucide-react"
// External package resolved
import { router } from "@inertiajs/react"; 
import { PayrollDatePicker } from "@/components/ui/payroll-date-picker"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Label } from "@/components/ui/label"; 


// --- Utility Functions ---
function formatWithCommas(value: string | number): string {
    let num = 0;
    if (value === null || value === undefined || value === '') {
        num = 0;
    } else {
        num = typeof value === 'number' ? value : Number(value);
        if (isNaN(num)) num = 0;
    }
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Info({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-dashed">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-semibold text-lg">{value}</p>
        </div>
    )
}
// --- End Utility Functions ---

// Array for month selection
const MONTHS = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ThirteenthMonthPayDialog({ isOpen, onClose }: Props) {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedCutoffMonth, setSelectedCutoffMonth] = useState(''); // NEW STATE for cutoff month (1-12)
    const [isCalculating, setIsCalculating] = useState(false);
    const [lastCalculationResult, setLastCalculationResult] = useState<{ date: string, status: 'success' | 'error' } | null>(null);

    const handleRun13thMonthPay = () => {
        if (!selectedDate) {
            toast.error('Please select the payout date for the 13th Month Pay.');
            return;
        }
        if (!selectedCutoffMonth) {
            toast.error('Please select the computation cutoff month.');
            return;
        }

        setIsCalculating(true);
        setLastCalculationResult(null);

        // Uses Inertia POST request to trigger the calculation in the PayrollController
        router.post(
            route('payroll.run.13th'), 
            { 
                payroll_date: selectedDate,
                cutoff_month: selectedCutoffMonth, // <--- NEW DATA SENT
            },
            {
                preserveState: true,
                onSuccess: (page: any) => { 
                    const flash = page.props.flash as any;
                    const message = (flash?.message || '13th Month Payroll initiated successfully. Check logs for details.');
                    toast.success(message);
                    setLastCalculationResult({ date: selectedDate, status: 'success' });
                    setSelectedDate('');
                    setSelectedCutoffMonth('');
                },
                onError: (errors: any) => {
                    const firstError = Object.values(errors)[0] as string | undefined;
                    toast.error(firstError || 'Failed to initiate 13th Month Payroll.');
                    setLastCalculationResult({ date: selectedDate, status: 'error' });
                },
                onFinish: () => {
                    setIsCalculating(false);
                }
            }
        );
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <DialogContent className="max-w-xl w-full p-8 sm:p-10 z-[100] max-h-[90vh] flex flex-col min-h-0">
                            <DialogHeader className="flex-shrink-0">
                                <DialogTitle className="text-2xl font-bold mb-1 flex items-center gap-2">
                                    <TrendingUp className="w-6 h-6 text-primary" />
                                    13th Month Pay Calculation
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground">
                                    This process calculates the mandatory pro-rated 13th Month Pay for all active employees for the year-to-date and adds the amount to the selected payroll run.
                                </p>
                            </DialogHeader>

                            <DialogScrollArea>
                                <div className="space-y-6 pt-4">
                                    <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300">Computation Parameters</h4>
                                    
                                    {/* Month Cutoff Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="cutoff-month">Compute YTD Earnings Up To:</Label>
                                        <Select
                                            value={selectedCutoffMonth}
                                            onValueChange={setSelectedCutoffMonth}
                                            disabled={isCalculating}
                                        >
                                            <SelectTrigger id="cutoff-month" className="w-full">
                                                <SelectValue placeholder="Select Cutoff Month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MONTHS.map(month => (
                                                    <SelectItem key={month.value} value={month.value}>
                                                        {month.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Payout Date Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="payout-date">Select Payout Date:</Label>
                                        <PayrollDatePicker
                                            value={selectedDate}
                                            onValueChange={setSelectedDate}
                                            placeholder="Select 13th Month Payout Date"
                                            className="w-full"
                                            disabled={isCalculating}
                                        />
                                    </div>


                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm space-y-2">
                                        <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4" />
                                            Calculation Basis
                                        </h5>
                                        <p>The amount is calculated based on the formula: <strong>(Sum of Monthly Adjusted Basic Salary YTD) / 12</strong>. </p>
                                        <p className="font-medium">The 'Monthly Adjusted Basic Salary' uses Base Salary less the monetary value of Lates and Absences recorded up to the **Cutoff Month**.</p>
                                    </div>
                                    
                                    {lastCalculationResult && (
                                        <div className={`p-4 rounded-lg text-sm font-semibold flex items-center gap-3 ${lastCalculationResult.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {lastCalculationResult.status === 'success' ? <CheckCircle className="w-5 h-5" /> : <Calculator className="w-5 h-5" />}
                                            Last action on: {new Date(lastCalculationResult.date).toLocaleDateString()} resulted in {lastCalculationResult.status === 'success' ? 'SUCCESS.' : 'ERROR.'}
                                        </div>
                                    )}
                                </div>
                            </DialogScrollArea>

                            <DialogFooter className="flex-shrink-0 pt-4">
                                <Button 
                                    onClick={handleRun13thMonthPay}
                                    disabled={!selectedDate || !selectedCutoffMonth || isCalculating}
                                >
                                    {isCalculating ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Calculator className="w-4 h-4" />
                                            Run 13th Month Pay
                                        </span>
                                    )}
                                </Button>
                                <Button onClick={onClose} variant="outline">Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Dialog>
    )
}
