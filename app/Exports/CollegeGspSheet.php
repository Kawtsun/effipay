<?php

namespace App\Exports;

use App\Models\Payroll;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;

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
                DB::raw("'N/A' as total"), // TOTAL
                'payrolls.absences', // ABSENTS
                DB::raw("'N/A' as total_hours"), // TOTAL HOURS
                'employees.college_rate as rate_per_hour', // RATE PER HOUR
                'payrolls.honorarium', // HONORARIUM
                'payrolls.base_salary as monthly_base', // MONTHLY
                DB::raw('(payrolls.absences * employees.college_rate) as absence_deduction'), // ABSENCES
                DB::raw("'N/A' as total_amount"), // TOTAL AMOUNT
                'payrolls.sss as sss_premium', // SSS PREMIUM
                'payrolls.sss_salary_loan', // SSS Loan
                'payrolls.sss_calamity_loan', // SSS Calamity
                'payrolls.pag_ibig as pag_ibig_contr', // Pag-ibig Contr.
                'payrolls.pagibig_multi_loan', // Pag-ibig Loan
                'payrolls.pagibig_calamity_loan', // Pag-ibig Calamity
                'payrolls.philhealth as philhealth_premium', // Philhealth Premium
                'payrolls.withholding_tax', // Witholding Tax
                'payrolls.tuition as ar_tuition', // AR-Tuition
                'payrolls.china_bank as chinabank', // Chinabank
                'payrolls.multipurpose_loan as loan', // Loan
                'payrolls.tea', // TEA
                DB::raw("'0.00' as fees"), // FEES
                'payrolls.total_deductions', // TOTAL Deductions
                'payrolls.net_pay' // NET PAY
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
                $highestColumn = 'X'; // Manually define highest column
                $sheet->setCellValue('A1', 'TOMAS CLAUDIO COLLEGES');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(12);

                $sheet->setCellValue('A2', 'PAYROLL OF COLLEGE AND GSP');
                $sheet->getStyle('A2')->getFont()->setBold(true);

                $sheet->setCellValue('A3', 'For the Period Covered: October 1-31, 2025');

                // --- CREATE MULTI-ROW TABLE HEADERS (ROW 5-6) ---
                $headers = [
                    "NAME", "TOTAL", "ABSENTS", "TOTAL HOURS", "RATE PER HOUR", "HONORARIUM", "MONTHLY", "ABSENCES", "TOTAL AMOUNT",
                    "SSS PREMIUM", "SSS Loan", "SSS Calamity", "Pag-ibig Contr.", "Pag-ibig Loan", "Pag-ibig Calamity",
                    "Philhealth Premium", "Witholding Tax", "AR-Tuition", "Chinabank", "Loan",
                    "TEA", "FEES", "TOTAL Deductions", "NET PAY"
                ];
                $sheet->fromArray($headers, null, 'A5');

                // Merge all header cells to span two rows
                foreach (range('A', $highestColumn) as $col) {
                    $sheet->mergeCells("{$col}5:{$col}6");
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
                $sheet->getStyle('A5:' . $highestColumn . '6')->applyFromArray($headerStyle);
                // Set font color for specific header columns to red
                $sheet->getStyle('J5:W6')->getFont()->getColor()->setRGB('FF0000');


                // --- COLUMN WIDTHS ---
                $sheet->getColumnDimension('A')->setWidth(40.71);
                foreach (range('B', $highestColumn) as $col) {
                    $sheet->getColumnDimension($col)->setWidth(13.71);
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
        return 'College and GSP';
    }
}

