import React from 'react';
import { Head, usePage } from '@inertiajs/react';

export default function ImportPreview() {
    const { importedData } = usePage().props as { importedData: any[] };

    return (
        <div>
            <Head title="Import Preview" />
            <h1>Imported Data Preview</h1>
            {importedData && importedData.length > 0 ? (
                <div style={{overflowX: 'auto'}}>
                    <table border={1} cellPadding={5}>
                        <thead>
                            <tr>
                                {Object.keys(importedData[0]).map((header) => (
                                    <th key={header}>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {importedData.map((row, i) => (
                                <tr key={i}>
                                    {Object.values(row).map((value, j) => (
                                        <td key={j}>{value}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>No data imported or file was empty.</p>
            )}
        </div>
    );
}
