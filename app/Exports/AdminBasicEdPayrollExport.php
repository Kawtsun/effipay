<?php

namespace App\Exports;

use App\Models\Payroll;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;

class AdminBasicEdPayrollExport implements FromCollection, WithTitle, WithEvents, WithCustomStartCell
{
    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        // This query is now updated to match the column order in your screenshot.
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
                'payrolls.pagibig_multi_loan as pagibig_salary_loan',
                'payrolls.pagibig_calamity_loan',
                'payrolls.philhealth as philhealth_premium',
                'payrolls.withholding_tax',
                DB::raw("'0.00' as cash_advance"),
                'payrolls.tuition as ar_tuition',
                'payrolls.china_bank as chinabank_loan',
                'payrolls.multipurpose_loan as loan', // Corresponds to TEA -> LOAN
                DB::raw("'0.00' as fees"),             // Corresponds to TEA -> FEES
                'payrolls.total_deductions',
                'payrolls.net_pay'
            )
            ->get();
    }

    public function startCell(): string
    {
        // The table data will now start at cell A7 to accommodate the two-row header.
        return 'A7';
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // --- PAGE SETUP ---
                $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);
                $sheet->getPageSetup()->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4);
                $sheet->getPageMargins()->setTop(0.75)->setRight(0.25)->setLeft(0.25)->setBottom(0.75);

                // --- CUSTOM HEADERS (ROWS 1-3) ---
                $highestColumn = 'T'; // Manually define highest column based on new layout
                $sheet->setCellValue('A1', 'TOMAS CLAUDIO COLLEGES');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(12);

                $sheet->setCellValue('A2', 'PAYROLL OF ADMIN AND BASIC EDUCATION');
                $sheet->getStyle('A2')->getFont()->setBold(true);

                $sheet->setCellValue('A3', 'For the Period Covered: October 1-31, 2025');

                // --- CREATE MULTI-ROW TABLE HEADERS (ROW 5-6) ---
                $headersRow5 = [
                    'A' => 'NAME', 'B' => 'HONORARIUM', 'C' => 'RATE PER MONTH', 'D' => 'RATE PER DAY', 'E' => 'TOTAL LATE & ABSENCES',
                    'F' => 'GROSS', 'G' => 'SSS PREMIUM', 'H' => 'SSS SALARY LOAN', 'I' => 'SSS CALAMITY LOAN', 'J' => 'PAG-IBIG SALARY LOAN',
                    'K' => 'PAG-IBIG CALAMITY', 'L' => 'PHILHEALTH PREMIUM', 'M' => 'WITHOLDING TAX', 'N' => 'CASH ADVANCE', 'O' => 'A/R-Tuition',
                    'P' => 'CHINABANK LOAN', 'Q' => 'TEA', 'S' => 'TOTAL DEDUCTIONS', 'T' => 'NET PAY'
                ];
                foreach ($headersRow5 as $col => $text) {
                    $sheet->setCellValue($col . '5', $text);
                }
                $sheet->setCellValue('Q6', 'LOAN');
                $sheet->setCellValue('R6', 'FEES');
                
                // Merge cells for single headers (spanning rows 5 and 6)
                $singleHeaders = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'S', 'T'];
                foreach ($singleHeaders as $col) {
                    $sheet->mergeCells("{$col}5:{$col}6");
                }
                // Merge cell for the "TEA" parent header
                $sheet->mergeCells('Q5:R5');

                // --- GLOBAL & HEADER STYLES ---
                $sheet->getParent()->getDefaultStyle()->getFont()->setName('Arial')->setSize(10);
                $headerStyle = [
                    'font' => ['bold' => true, 'color' => ['rgb' => '000000']],
                    'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FDE9D9']],
                    'alignment' => [
                        'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                        'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
                        'wrapText' => true,
                    ],
                ];
                $sheet->getStyle('A5:' . $highestColumn . '6')->applyFromArray($headerStyle);
                // Set font color for deduction header columns to red
                $sheet->getStyle('E5:E6')->getFont()->getColor()->setRGB('FF0000');
                $sheet->getStyle('G5:S6')->getFont()->getColor()->setRGB('FF0000');


                // --- COLUMN WIDTHS ---
                $sheet->getColumnDimension('A')->setWidth(40.71);
                foreach (range('B', $highestColumn) as $col) {
                    if ($col === 'I') {
                        $sheet->getColumnDimension($col)->setWidth(14.71);
                    } else {
                        $sheet->getColumnDimension($col)->setWidth(13.71);
                    }
                }

                // --- ROW HEIGHTS ---
                $sheet->getRowDimension('5')->setRowHeight(15);
                $sheet->getRowDimension('6')->setRowHeight(15);

                // --- BORDERS ---
                $lastRow = $sheet->getHighestRow();
                $sheet->getStyle('A5:' . $highestColumn . $lastRow)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
                
                // --- DATA CELL ALIGNMENT ---
                // Align all data cells (except column A) to the right.
                if ($lastRow >= 7) {
                    $dataRange = 'B7:' . $highestColumn . $lastRow;
                    $sheet->getStyle($dataRange)
                          ->getAlignment()
                          ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);
                }
            },
        ];
    }

    public function title(): string
    {
        return 'Admin and Basic Education';
    }
}

