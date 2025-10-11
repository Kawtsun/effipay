<?php

namespace App\Exports;

use App\Models\Payroll;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AdminBasicEdPayrollExport implements FromCollection, WithTitle, WithHeadings, WithStyles
{
    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        // This query is now updated to match your exact database columns.
        return Payroll::query()
            ->join('employees', 'payrolls.employee_id', '=', 'employees.id')
            ->where('employees.roles', 'not like', '%college instructor%') // Filter out college instructors
            // You can uncomment and set a specific month to filter the report, e.g., ->where('payrolls.month', '2025-10')
            ->select(
                DB::raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
                'payrolls.honorarium',
                'employees.base_salary as rate_per_month',
                DB::raw('employees.base_salary / 22 as rate_per_day'),
                DB::raw('( (payrolls.tardiness + payrolls.absences) * (employees.base_salary / 22 / employees.work_hours_per_day) ) as total_late_absences'),
                'payrolls.gross_pay',
                'payrolls.sss as sss_premium',
                'payrolls.sss_salary_loan',
                'payrolls.sss_calamity_loan',
                'payrolls.pag_ibig as pag_ibig_contr',
                'payrolls.pagibig_multi_loan as pagibig_salary_loan',
                'payrolls.pagibig_calamity_loan',
                'payrolls.philhealth as philhealth_premium',
                'payrolls.withholding_tax',
                
                // --- NOTE: These columns are not in your tables and will appear as 0 ---
                DB::raw("'0.00' as cash_advance"),
                'payrolls.tuition as air_tuition',
                'payrolls.china_bank as chinabank_loan',
                'payrolls.tea',
                DB::raw("'0.00' as fees"),

                'payrolls.total_deductions',
                'payrolls.net_pay'
            )
            ->get();
    }

    public function headings(): array
    {
        // These headers match your ledger image
        return [
            "NAME", "HONORARIUM", "RATE PER MONTH", "RATE PER DAY", "TOTAL LATE & ABSENCES", "GROSS",
            "SSS PREMIUM", "SSS SALARY LOAN", "SSS CALAMITY LOAN", "Pag-ibig CONTR", "Pag-ibig SALARY LOAN",
            "Pag-ibig CALAMITY", "PHILHEALTH PREMIUM", "W/HOLDING TAX", "CASH ADVANCE", "AIR TUITION",
            "CHINABANK LOAN", "TEA", "FEES", "TOTAL DEDUCTIONS", "NET PAY"
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Style the first row (headings) to be bold with a green background
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '028102']]
            ],
        ];
    }

    public function title(): string
    {
        return 'Admin and Basic Education';
    }
}

