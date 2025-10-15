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

    /**
     * Canonical list of college programs (value => label).
     * Keep in sync with resources/js/components/employee-college-radio-department.tsx
     */
    protected static $COLLEGE_PROGRAMS = [
        // Combined BSBA and BSA into one department key
        'BSBA/BSA' => 'Bachelor of Science in Business Administration / Bachelor of Science in Accountancy',
        'COELA' => 'College of Education and Liberal Arts',
        'BSCRIM' => 'Bachelor of Science in Criminology',
        'BSCS' => 'Bachelor of Science in Computer Science',
        'JD' => 'Juris Doctor',
        'BSN' => 'Bachelor of Science in Nursing',
        'RLE' => 'Related Learning Experience',
        'CG' => 'Career Guidance',
        'BSPT' => 'Bachelor of Science in Physical Therapy',
        'GSP' => 'Graduate Studies Programs',
        'MBA' => 'Master of Business Administration',
    ];

    /**
     * Map specific program codes to grouped department keys.
     * For example, both 'BSBA' and 'BSA' map to 'BSBA/BSA'.
     */
    protected static $PROGRAM_MAP = [
        'BSBA' => 'BSBA/BSA',
        'BSA' => 'BSBA/BSA',
    ];

    public function __construct($month = null)
    {
        $this->month = $month;
    }
    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        // Query payrolls joined with employees and include college_program for grouping
        $query = Payroll::query()
            ->join('employees', 'payrolls.employee_id', '=', 'employees.id')
            ->where('employees.roles', 'like', '%college instructor%'); // Filter for college instructors

        if ($this->month) {
            $query->where('payrolls.month', $this->month);
        }

        $results = $query->select(
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
                DB::raw('ROUND(payrolls.net_pay, 2) as net_pay'), // NET PAY
                DB::raw('COALESCE(employees.college_program, "Unassigned") as college_program')
            )
            ->orderBy('college_program')
            ->orderBy('employee_name')
            ->get();

        // Apply PROGRAM_MAP to results so mapped programs are grouped together
        $mapped = $results->map(function ($item) {
            $prog = $item->college_program ?? 'Unassigned';
            if (isset(self::$PROGRAM_MAP[$prog])) {
                $item->college_program = self::$PROGRAM_MAP[$prog];
            }
            return $item;
        });

        // Organize results by program for quick lookup
        $grouped = $mapped->groupBy('college_program');

        $rows = collect();

        // Iterate canonical program list to ensure all departments appear
        foreach (self::$COLLEGE_PROGRAMS as $progValue => $progLabel) {
            $subtotalNet = 0.0;
            $subtotalDeductions = 0.0;

            $programKey = $progValue;
            $items = $grouped->get($programKey, collect());

            // Append employee rows if any
            foreach ($items as $item) {
                $employeeRow = [
                    $item->employee_name,
                    '', // TOTAL
                    (float) $item->absences,
                    '', // total_hours
                    (float) $item->rate_per_hour,
                    (float) $item->honorarium,
                    (float) $item->monthly_base,
                    (float) $item->absence_deduction,
                    '', // total_amount
                    (float) $item->sss_premium,
                    (float) $item->sss_salary_loan,
                    (float) $item->sss_calamity_loan,
                    (float) $item->pag_ibig_contr,
                    (float) $item->pagibig_multi_loan,
                    (float) $item->pagibig_calamity_loan,
                    (float) $item->philhealth_premium,
                    (float) $item->withholding_tax,
                    (float) $item->ar_tuition,
                    (float) $item->chinabank,
                    (float) $item->loan,
                    (float) $item->tea,
                    0.00, // fees
                    (float) $item->total_deductions,
                    (float) $item->net_pay,
                ];

                $rows->push($employeeRow);

                $subtotalNet += (float) $item->net_pay;
                $subtotalDeductions += (float) $item->total_deductions;
            }

            // If there were no employee rows for this department, add one blank row above the subtotal
            if ($items->isEmpty()) {
                $rows->push(array_fill(0, 24, ''));
            }

            // Push subtotal row (even if zero)
            $subRow = array_fill(0, 24, '');
            $subRow[0] = 'SUBTOTAL FOR ' . $progValue;
            $subRow[22] = round($subtotalDeductions, 2);
            $subRow[23] = round($subtotalNet, 2);
            $rows->push($subRow);
        }

        // Optionally include 'Unassigned' employees (employees without college_program)
        $unassigned = $grouped->get('Unassigned', collect());
        if ($unassigned->isNotEmpty()) {
            // no department header for unassigned; directly list employees and subtotal
            $subtotalNet = 0.0;
            $subtotalDeductions = 0.0;
            foreach ($unassigned as $item) {
                $employeeRow = [
                    $item->employee_name,
                    '', // TOTAL
                    (float) $item->absences,
                    '', // total_hours
                    (float) $item->rate_per_hour,
                    (float) $item->honorarium,
                    (float) $item->monthly_base,
                    (float) $item->absence_deduction,
                    '', // total_amount
                    (float) $item->sss_premium,
                    (float) $item->sss_salary_loan,
                    (float) $item->sss_calamity_loan,
                    (float) $item->pag_ibig_contr,
                    (float) $item->pagibig_multi_loan,
                    (float) $item->pagibig_calamity_loan,
                    (float) $item->philhealth_premium,
                    (float) $item->withholding_tax,
                    (float) $item->ar_tuition,
                    (float) $item->chinabank,
                    (float) $item->loan,
                    (float) $item->tea,
                    0.00, // fees
                    (float) $item->total_deductions,
                    (float) $item->net_pay,
                ];

                $rows->push($employeeRow);
                $subtotalNet += (float) $item->net_pay;
                $subtotalDeductions += (float) $item->total_deductions;
            }

            $subRow = array_fill(0, 24, '');
            $subRow[0] = 'SUBTOTAL FOR Unassigned';
            $subRow[22] = round($subtotalDeductions, 2);
            $subRow[23] = round($subtotalNet, 2);
            $rows->push($subRow);
        }

        return $rows;
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
            
            // --- DEPARTMENT HEADER & SUBTOTAL STYLES ---
            // Department header rows start with "Department:" in column A. Subtotal rows start with "SUBTOTAL FOR".
            $highestRow = $sheet->getHighestRow();
            for ($row = 8; $row <= $highestRow; $row++) {
                $cellA = $sheet->getCell('A' . $row)->getValue();
                if (is_string($cellA) && str_starts_with($cellA, 'Department:')) {
                    // Department header style
                    $sheet->getStyle('A' . $row . ':' . $highestColumn . $row)->applyFromArray([
                        'font' => ['bold' => true],
                        'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D9E1F2']],
                    ]);
                    // Align department name to left across the row
                    $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_LEFT);
                }

                if (is_string($cellA) && str_starts_with($cellA, 'SUBTOTAL FOR')) {
                    // Subtotal style: bold and light yellow background
                    $sheet->getStyle('A' . $row . ':' . $highestColumn . $row)->applyFromArray([
                        'font' => ['bold' => true],
                        'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FFF2CC']],
                    ]);

                    // Ensure subtotal numeric cells (W and X) are right aligned and formatted
                    $sheet->getStyle('W' . $row . ':X' . $row)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle('W' . $row . ':X' . $row)->getNumberFormat()->setFormatCode('#,##0.00');
                }
            }
            },
        ];
    }

    public function title(): string
    {
        return 'College and GSP';
    }
}

