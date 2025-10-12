<?php

namespace App\Exports;

use App\Models\Payroll; // Or your relevant model
use Maatwebsite\Excel\Concerns\FromCollection;
use Carbon\Carbon;

class PayrollExport implements FromCollection
{
    protected $month;

    // Use the constructor to accept the month
    public function __construct(Carbon $month)
    {
        $this->month = $month;
    }

    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        // Use the month to filter the payroll data
        return Payroll::whereYear('created_at', $this->month->year)
                      ->whereMonth('created_at', $this->month->month)
                      ->get();

        // NOTE: Adjust the 'created_at' column and the query to match
        // your database schema and logic for how payroll periods are stored.
    }
}
