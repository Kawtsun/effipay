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
    const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(
        new Date(),
    );
    const [isDialogOpen, setDialogOpen] = useState<boolean>(false);

    const handleExport = async () => {
        if (!selectedMonth) {
            alert('Please select a month.');
            return;
        }

        setLoading(true);
        try {
            // Format the month to YYYY-MM for the backend
            const monthParam = selectedMonth.toISOString().slice(0, 7);

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

    return (
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
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
                                date={selectedMonth}
                                setDate={setSelectedMonth}
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