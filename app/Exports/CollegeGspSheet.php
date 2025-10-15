<?php

namespace App\Exports;

use App\Models\Payroll;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use Carbon\Carbon;

class CollegeGspSheet implements FromCollection, WithTitle, WithEvents, WithCustomStartCell
{
    protected $month;

    public function __construct($month = null)
    {
        $this->month = $month;
    }
    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        // This query has been updated to match your new header structure.
        $query = Payroll::query()
            ->join('employees', 'payrolls.employee_id', '=', 'employees.id')
            ->where('employees.roles', 'like', '%college instructor%'); // Filter for college instructors

        if ($this->month) {
            $query->where('payrolls.month', $this->month);
        }

        return $query->select(
                DB::raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"), // NAME
                DB::raw("'' as total"), // TOTAL (empty instead of 'N/A')
                DB::raw('ROUND(payrolls.absences, 2) as absences'), // ABSENTS
                DB::raw("'' as total_hours"), // TOTAL HOURS (empty instead of 'N/A')
                DB::raw('ROUND(employees.college_rate, 2) as rate_per_hour'), // RATE PER HOUR
                DB::raw('ROUND(payrolls.honorarium, 2) as honorarium'), // HONORARIUM
                DB::raw('ROUND(payrolls.base_salary, 2) as monthly_base'), // MONTHLY
                DB::raw('ROUND((payrolls.absences * employees.college_rate), 2) as absence_deduction'), // ABSENCES
                DB::raw("'' as total_amount"), // TOTAL AMOUNT (empty instead of 'N/A')
                DB::raw('ROUND(payrolls.sss, 2) as sss_premium'), // SSS PREMIUM
                DB::raw('ROUND(payrolls.sss_salary_loan, 2) as sss_salary_loan'), // SSS Loan
                DB::raw('ROUND(payrolls.sss_calamity_loan, 2) as sss_calamity_loan'), // SSS Calamity
                DB::raw('ROUND(payrolls.pag_ibig, 2) as pag_ibig_contr'), // Pag-ibig Contr.
                DB::raw('ROUND(payrolls.pagibig_multi_loan, 2) as pagibig_multi_loan'), // Pag-ibig Loan
                DB::raw('ROUND(payrolls.pagibig_calamity_loan, 2) as pagibig_calamity_loan'), // Pag-ibig Calamity
                DB::raw('ROUND(payrolls.philhealth, 2) as philhealth_premium'), // Philhealth Premium
                DB::raw('ROUND(payrolls.withholding_tax, 2) as withholding_tax'), // Witholding Tax
                DB::raw('ROUND(payrolls.tuition, 2) as ar_tuition'), // AR-Tuition
                DB::raw('ROUND(payrolls.china_bank, 2) as chinabank'), // Chinabank
                DB::raw('ROUND(payrolls.multipurpose_loan, 2) as loan'), // Loan
                DB::raw('ROUND(payrolls.tea, 2) as tea'), // TEA
                DB::raw('0.00 as fees'), // FEES
                DB::raw('ROUND(payrolls.total_deductions, 2) as total_deductions'), // TOTAL Deductions
                DB::raw('ROUND(payrolls.net_pay, 2) as net_pay') // NET PAY
            )
            ->get();
    }

    public function startCell(): string
    {
        // The table data will now start at cell A8 to accommodate the two-row header plus inserted blank row.
        return 'A8';
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
                $highestColumn = 'X'; // Manually define highest column
                $sheet->setCellValue('A1', 'TOMAS CLAUDIO COLLEGES');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(12);

                // Insert blank row after title
                $sheet->setCellValue('A2', '');

                $sheet->setCellValue('A3', 'PAYROLL OF COLLEGE AND GSP');
                $sheet->getStyle('A3')->getFont()->setBold(true);

                // Compute period covered from the provided month or default to current month
                try {
                    if ($this->month) {
                        $periodStart = Carbon::createFromFormat('Y-m', $this->month)->startOfMonth();
                    } else {
                        $periodStart = Carbon::now()->startOfMonth();
                    }
                    $periodEnd = $periodStart->copy()->endOfMonth();
                    $periodText = 'For the Period Covered: ' . $periodStart->format('F j') . '-' . $periodEnd->format('j, Y');
                } catch (\Exception $e) {
                    $periodText = 'For the Period Covered: ' . Carbon::now()->startOfMonth()->format('F j') . '-' . Carbon::now()->endOfMonth()->format('j, Y');
                }

                $sheet->setCellValue('A4', $periodText);

                // --- CREATE MULTI-ROW TABLE HEADERS (ROW 5-6) ---
                $headers = [
                    "NAME", "TOTAL", "ABSENTS", "TOTAL HOURS", "RATE PER HOUR", "HONORARIUM", "MONTHLY", "ABSENCES", "TOTAL AMOUNT",
                    "SSS PREMIUM", "SSS Loan", "SSS Calamity", "Pag-ibig Contr.", "Pag-ibig Loan", "Pag-ibig Calamity",
                    "Philhealth Premium", "Witholding Tax", "AR-Tuition", "Chinabank", "Loan",
                    "TEA", "FEES", "TOTAL Deductions", "NET PAY"
                ];
                $sheet->fromArray($headers, null, 'A6');

                // Merge all header cells to span two rows (now rows 6-7)
                foreach (range('A', $highestColumn) as $col) {
                    $sheet->mergeCells("{$col}6:{$col}7");
                }

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
                $sheet->getStyle('A6:' . $highestColumn . '7')->applyFromArray($headerStyle);
                // Set font color for specific header columns to red
                $sheet->getStyle('J6:W7')->getFont()->getColor()->setRGB('FF0000');


                // --- COLUMN WIDTHS ---
                $sheet->getColumnDimension('A')->setWidth(40.71);
                foreach (range('B', $highestColumn) as $col) {
                    $sheet->getColumnDimension($col)->setWidth(13.71);
                }

                // --- ROW HEIGHTS ---
                $sheet->getRowDimension('6')->setRowHeight(15);
                $sheet->getRowDimension('7')->setRowHeight(15);

                // --- BORDERS ---
                $lastRow = $sheet->getHighestRow();
                $sheet->getStyle('A6:' . $highestColumn . $lastRow)->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
                
                // --- DATA CELL ALIGNMENT ---
                // Align all data cells (except column A) to the right.
        if ($lastRow >= 8) {
            $dataRange = 'B8:' . $highestColumn . $lastRow;
              $sheet->getStyle($dataRange)
                  ->getAlignment()
                  ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);

              // Format numeric cells to two decimal places
              $sheet->getStyle($dataRange)
                  ->getNumberFormat()
                  ->setFormatCode('#,##0.00');
            }
            },
        ];
    }

    public function title(): string
    {
        return 'College and GSP';
    }
}

