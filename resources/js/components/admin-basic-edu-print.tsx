import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { LoaderCircle, FileDown } from 'lucide-react';

// The `route` function is globally available in Inertia with Ziggy.
// If you have a strict TypeScript setup, you might need to declare it globally.
declare function route(name: string): string;

const AdminBasicEduPrintButton: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            // This calls the route name you already have defined in your web.php
            const response = await axios.get(route('payroll.export'), {
                responseType: 'blob', // This is crucial for handling file downloads
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            let fileName = 'payroll-ledger.xlsx'; // Default filename
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) {
                    fileName = fileNameMatch[1];
                }
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error downloading the file:', error);
            alert('Failed to download the payroll report.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleExport} disabled={loading}>
            {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
            ) : (
                <FileDown className="h-4 w-4 mr-2" />
            )}
            Export Ledger
        </Button>
    );
};

export default AdminBasicEduPrintButton;
