<?php

namespace App\Exports;

use App\Models\Payroll; // Or your relevant model
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Carbon\Carbon;
use App\Exports\AdminBasicEdPayrollExport;
use App\Exports\CollegeGspSheet;

class PayrollExport implements WithMultipleSheets
{
    protected $month;

    // Accept either a Carbon or a YYYY-MM string
    public function __construct($month)
    {
        $this->month = $month instanceof Carbon ? $month->format('Y-m') : (string) $month;
    }

    /**
     * @return array
     */
    public function sheets(): array
    {
        // Return sheet instances which carry their own styling and data.
        return [
            new AdminBasicEdPayrollExport($this->month),
            new CollegeGspSheet($this->month),
        ];
    }
}
