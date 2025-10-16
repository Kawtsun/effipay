import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MonthPicker } from '@/components/ui/month-picker'; // Assuming you have a month picker
import { LoaderCircle, FileDown } from 'lucide-react';

// The `route` function is globally available in Inertia with Ziggy.
// If you have a strict TypeScript setup, you might need to declare it globally.
declare function route(name: string, params?: object): string;

const ExportLedgerDialog: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [availableMonths, setAvailableMonths] = useState<string[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [isDialogOpen, setDialogOpen] = useState<boolean>(false);

    // `month` alias for consistency with Dashboard code
    const month = selectedMonth;

    // Accept either a string (from MonthPicker) or an event-like object
    const handleMonthChange = (payload: string | { target: { value: string } }) => {
        let val: string | undefined;
        if (typeof payload === 'string') {
            val = payload;
        } else if (payload && payload.target && typeof payload.target.value === 'string') {
            val = payload.target.value;
        }
        if (val) setSelectedMonth(val);
    };

    const handleExport = async () => {
        if (!selectedMonth) {
            alert('Please select a month.');
            return;
        }

        setLoading(true);
        try {
            // Month value is already YYYY-MM
            const monthParam = selectedMonth;

            // This calls the route with the selected month as a query parameter
            const response = await axios.get(
                route('payroll.export', { month: monthParam }),
                {
                    responseType: 'blob', // This is crucial for handling file downloads
                },
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            let fileName = `payroll-ledger-${monthParam}.xlsx`; // Default filename
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const fileNameMatch =
                    contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) {
                    fileName = fileNameMatch[1];
                }
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setDialogOpen(false); // Close dialog on successful export
        } catch (error) {
            console.error('Error downloading the file:', error);
            alert('Failed to download the payroll report.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch available months when dialog opens (copying dashboard behavior)
    const fetchAvailableMonths = async () => {
        try {
            // Use payroll-only months endpoint so the ledger picker only shows months with processed payroll
            const res = await fetch('/payroll/processed-months');
            const data = await res.json();
            if (data && data.success && Array.isArray(data.months)) {
                setAvailableMonths(data.months);
                // Default to first available month if current selection not in list
                setSelectedMonth((prev) => (data.months.includes(prev) ? prev : (data.months[0] || prev)));
            }
        } catch (err) {
            console.debug('Could not fetch available months for export dialog', err);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setDialogOpen(open);
        if (open && availableMonths.length === 0) {
            fetchAvailableMonths();
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <FileDown className='h-4 w-4 mr-2' />
                    Export Ledger
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                    <DialogTitle>Export Payroll Ledger</DialogTitle>
                    <DialogDescription>
                        Select the month and year you wish to export.
                    </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                    <div className='grid grid-cols-4 items-center gap-4'>
                        <Label htmlFor='month' className='text-right'>
                            Month
                        </Label>
                        <div className='col-span-3'>
                            <MonthPicker
                                value={month}
                                onValueChange={handleMonthChange}
                                placeholder="Select month"
                                availableMonths={availableMonths}
                                className="w-46 min-w-0 px-2 py-1 text-sm"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleExport}
                        disabled={loading || !selectedMonth}
                    >
                        {loading ? (
                            <LoaderCircle className='h-4 w-4 animate-spin mr-2' />
                        ) : null}
                        Export
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ExportLedgerDialog;