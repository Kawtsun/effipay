<?php

namespace App\Exports;

use App\Models\Payroll;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CollegeGspSheet implements FromCollection, WithTitle, WithHeadings, WithStyles
{
    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        // This query is built to fetch data for College instructors
        return Payroll::query()
            ->join('employees', 'payrolls.employee_id', '=', 'employees.id')
            ->where('employees.roles', 'like', '%college instructor%') // Filter for college instructors
            // You can uncomment and set a specific month to filter the report, e.g., ->where('payrolls.month', '2025-09')
            ->select(
                DB::raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
                DB::raw("'N/A' as total_hours"), // Placeholder as this is not stored directly
                'payrolls.absences',
                'employees.college_rate as rate_per_hour',
                'payrolls.honorarium',
                'payrolls.base_salary as monthly_base',
                // This calculates the monetary value of absences for the sheet
                DB::raw('(payrolls.absences * employees.college_rate) as absence_deduction'),
                'payrolls.sss as sss_premium',
                'payrolls.sss_salary_loan',
                'payrolls.sss_calamity_loan',
                'payrolls.pag_ibig as pag_ibig_contr',
                'payrolls.pagibig_multi_loan', // Mapped to "Pag-ibig Loan"
                'payrolls.pagibig_calamity_loan',
                'payrolls.philhealth as philhealth_premium',
                'payrolls.peraa_con as peraa',
                'payrolls.withholding_tax',
                'payrolls.china_bank as chinabank',
                'payrolls.tuition as ar_tuition',
                'payrolls.multipurpose_loan as loan', // Mapped to "Loan"
                'payrolls.tea',
                DB::raw("'0.00' as fees"), // Placeholder as "FEES" column does not exist
                'payrolls.total_deductions',
                'payrolls.net_pay'
            )
            ->get();
    }

    public function headings(): array
    {
        // These headers match your College/GSP ledger image
        return [
            "NAME", "TOTAL HOURS", "ABSENTS", "RATE PER HOUR", "HONORARIUM", "MONTHLY", "ABSENCES_DEDUCTION",
            "SSS PREMIUM", "SSS Loan", "SSS Calamity", "Pag-ibig CONTR", "Pag-ibig Loan", "Pag-ibig Calamity",
            "Philhealth Premium", "PERAA", "Witholding Tax", "Chinabank", "AR Tuition", "Loan",
            "TEA", "FEES", "TOTAL DEDUCTIONS", "NET PAY"
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Set the default font style and size for the entire sheet
        $sheet->getParent()->getDefaultStyle()->getFont()->setName('Arial');
        $sheet->getParent()->getDefaultStyle()->getFont()->setSize(10);

        // Loop through all columns from A to the highest used column and set them to auto-size
        foreach (range('A', $sheet->getHighestColumn()) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Return the styles for the header row
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => '028102']]
            ],
        ];
    }

    public function title(): string
    {
        return 'College and GSP';
    }
}

