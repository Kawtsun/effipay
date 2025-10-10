import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Calculator, Loader2, TrendingUp, Lightbulb } from "lucide-react";
import { router } from "@inertiajs/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// I'm assuming MONTHS is defined here or imported
const MONTHS = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ThirteenthMonthPayDialog({ isOpen, onClose }: Props) {
    const [selectedCutoffMonth, setSelectedCutoffMonth] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    const [lastCalculationResult, setLastCalculationResult] = useState<{ date: string, status: 'success' | 'error' } | null>(null);

    // --- THIS IS THE CORRECTED FUNCTION ---
    const handleRun13thMonthPay = () => {
        if (!selectedCutoffMonth) {
            toast.error('Please select the computation cutoff month.');
            return;
        }

        setIsCalculating(true);
        setLastCalculationResult(null);

        router.post(
            route('payroll.run.13th'),
            {
                cutoff_month: selectedCutoffMonth,
            },
            {
                preserveState: false,
                onSuccess: (page: any) => {
                    const flash = page.props.flash as any;
                    const message = (flash?.message || '13th Month Payroll initiated successfully.');
                    toast.success(message);
                    setSelectedCutoffMonth('');
                    onClose();
                },
                onError: (errors: any) => {
                    const firstError = Object.values(errors)[0] as string | undefined;
                    toast.error(firstError || 'Failed to initiate 13th Month Payroll.');
                    setLastCalculationResult({ date: selectedCutoffMonth, status: 'error' });
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

                            <div className="flex-grow overflow-y-auto">
                                <div className="space-y-6 pt-4">
                                    <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300">Computation Parameters</h4>
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
                            </div>

                            <DialogFooter className="flex-shrink-0 pt-4">
                                <Button
                                    onClick={handleRun13thMonthPay}
                                    disabled={!selectedCutoffMonth || isCalculating}
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