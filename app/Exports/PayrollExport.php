<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class PayrollExport implements WithMultipleSheets
{
    use Exportable;

    /**
     * @return array
     */
    public function sheets(): array
    {
        // This array defines which sheets will be included in the Excel file
        // and in what order they will appear.
        $sheets = [
            new AdminBasicEdPayrollExport(), // The first sheet
            new CollegeGspSheet(),           // The second sheet
            // new SeniorHighSchoolPayrollExport(), // The third sheet
        ];

        return $sheets;
    }
}
