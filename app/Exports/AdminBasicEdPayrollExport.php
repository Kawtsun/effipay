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

class AdminBasicEdPayrollExport implements FromCollection, WithTitle, WithEvents, WithCustomStartCell
{
    protected $month;
    protected $rows;

    public function __construct($month = null)
    {
        $this->month = $month;
    }
    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        // This query is now updated to match the column order in your screenshot.
        $query = Payroll::query()
            ->join('employees', 'payrolls.employee_id', '=', 'employees.id')
            // Exclude only employees whose roles are exactly 'college instructor' (case-insensitive).
            // Use a REGEXP anchored match on the trimmed lowercase roles value to ensure only exact matches are excluded.
            ->whereRaw("(employees.roles IS NULL OR LOWER(TRIM(employees.roles)) NOT REGEXP ?)", ['^college instructor$']);

        if ($this->month) {
            $query->where('payrolls.month', $this->month);
        }

        $all = $query->select(
                DB::raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
                DB::raw('ROUND(payrolls.honorarium, 2) as honorarium'),
                DB::raw('ROUND(employees.base_salary, 2) as rate_per_month'),
                DB::raw('ROUND(employees.base_salary / 22, 2) as rate_per_day'),
                DB::raw('ROUND(((payrolls.tardiness + payrolls.absences) * (employees.base_salary / 22 / NULLIF(employees.work_hours_per_day,0))), 2) as total_late_absences'),
                DB::raw('ROUND(payrolls.gross_pay, 2) as gross_pay'),
                DB::raw('ROUND(payrolls.sss, 2) as sss_premium'),
                DB::raw('ROUND(payrolls.sss_salary_loan, 2) as sss_salary_loan'),
                DB::raw('ROUND(payrolls.sss_calamity_loan, 2) as sss_calamity_loan'),
                DB::raw('ROUND(payrolls.pagibig_multi_loan, 2) as pagibig_salary_loan'),
                DB::raw('ROUND(payrolls.pagibig_calamity_loan, 2) as pagibig_calamity_loan'),
                DB::raw('ROUND(payrolls.philhealth, 2) as philhealth_premium'),
                DB::raw('ROUND(payrolls.withholding_tax, 2) as withholding_tax'),
                DB::raw('0.00 as cash_advance'),
                DB::raw('ROUND(payrolls.tuition, 2) as ar_tuition'),
                DB::raw('ROUND(payrolls.china_bank, 2) as chinabank_loan'),
                DB::raw('ROUND(payrolls.multipurpose_loan, 2) as loan'), // Corresponds to TEA -> LOAN
                DB::raw('0.00 as fees'),             // Corresponds to TEA -> FEES
                DB::raw('ROUND(payrolls.total_deductions, 2) as total_deductions'),
                DB::raw('ROUND(payrolls.net_pay, 2) as net_pay')
            )
            // Also select the raw roles value so we can classify rows for totals, but we'll keep it out of the returned collection
            ->addSelect('employees.roles as roles')
            ->get();

        // Save full rows (including roles) for totals classification
        $this->rows = $all;

        // Partition rows into Administrator vs Basic Education based on roles
        $isAdminCallback = function ($r) {
            $roles = strtolower(trim((string)($r->roles ?? '')));
            return str_contains($roles, 'admin') || str_contains($roles, 'administrator');
        };

        $adminRows = $all->filter($isAdminCallback);
        $basicRows = $all->reject($isAdminCallback);

        // Map helper for display columns
        $mapDisplay = function ($r) {
            return [
                'employee_name' => $r->employee_name,
                'honorarium' => $r->honorarium,
                'rate_per_month' => $r->rate_per_month,
                'rate_per_day' => $r->rate_per_day,
                'total_late_absences' => $r->total_late_absences,
                'gross_pay' => $r->gross_pay,
                'sss_premium' => $r->sss_premium,
                'sss_salary_loan' => $r->sss_salary_loan,
                'sss_calamity_loan' => $r->sss_calamity_loan,
                'pagibig_salary_loan' => $r->pagibig_salary_loan,
                'pagibig_calamity_loan' => $r->pagibig_calamity_loan,
                'philhealth_premium' => $r->philhealth_premium,
                'withholding_tax' => $r->withholding_tax,
                'cash_advance' => $r->cash_advance,
                'ar_tuition' => $r->ar_tuition,
                'chinabank_loan' => $r->chinabank_loan,
                'loan' => $r->loan,
                'fees' => $r->fees,
                'total_deductions' => $r->total_deductions,
                'net_pay' => $r->net_pay,
            ];
        };

        // Compute totals for each group
        $colKeys = [
            'honorarium','rate_per_month','rate_per_day','total_late_absences','gross_pay','sss_premium','sss_salary_loan','sss_calamity_loan','pagibig_salary_loan','pagibig_calamity_loan','philhealth_premium','withholding_tax','cash_advance','ar_tuition','chinabank_loan','loan','fees','total_deductions','net_pay'
        ];

        $sumGroup = function ($rows) use ($colKeys) {
            $sums = array_fill_keys($colKeys, 0.0);
            foreach ($rows as $r) {
                foreach ($colKeys as $k) {
                    $sums[$k] += (float) ($r->{$k} ?? 0);
                }
            }
            return $sums;
        };

        $adminSums = $sumGroup($adminRows);
        $basicSums = $sumGroup($basicRows);

        // Build display collections with totals inserted between groups
        $adminDisplay = $adminRows->map($mapDisplay);
        $basicDisplay = $basicRows->map($mapDisplay);

        $adminTotalRow = array_merge(['employee_name' => 'TOTAL (ADMINISTRATOR)'], array_combine($colKeys, array_map(function ($v) { return round($v,2); }, array_values($adminSums))));
        $basicTotalRow = array_merge(['employee_name' => 'TOTAL (BASIC ED)'], array_combine($colKeys, array_map(function ($v) { return round($v,2); }, array_values($basicSums))));

        $ordered = collect();
        if ($adminDisplay->isNotEmpty()) {
            $ordered = $ordered->merge($adminDisplay);
            $ordered->push($adminTotalRow);
        }
        if ($basicDisplay->isNotEmpty()) {
            $ordered = $ordered->merge($basicDisplay);
            $ordered->push($basicTotalRow);
        }

        // Grand total (sum of admin + basic)
        $grandSums = array_map(function ($a, $b) { return $a + $b; }, array_values($adminSums), array_values($basicSums));
        // Combine back to associative by colKeys
        $grandAssoc = array_combine($colKeys, array_map(function ($v) { return round($v, 2); }, $grandSums));
    $grandTotalRow = array_merge(['employee_name' => 'GRAND TOTAL'], $grandAssoc);
        // Push grand total only if there is at least one row in either group
        if ($adminDisplay->isNotEmpty() || $basicDisplay->isNotEmpty()) {
            $ordered->push($grandTotalRow);
        }

        // Return the ordered display rows ready for export
        return $ordered;
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
                $highestColumn = 'T'; // Manually define highest column based on new layout
                $sheet->setCellValue('A1', 'TOMAS CLAUDIO COLLEGES');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(12);

                // Insert blank row after title
                $sheet->setCellValue('A2', '');

                $sheet->setCellValue('A3', 'PAYROLL OF ADMIN AND BASIC EDUCATION');
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
                $headersRow6 = [
                    'A' => 'NAME', 'B' => 'HONORARIUM', 'C' => 'RATE PER MONTH', 'D' => 'RATE PER DAY', 'E' => 'TOTAL LATE & ABSENCES',
                    'F' => 'GROSS', 'G' => 'SSS PREMIUM', 'H' => 'SSS SALARY LOAN', 'I' => 'SSS CALAMITY LOAN', 'J' => 'PAG-IBIG SALARY LOAN',
                    'K' => 'PAG-IBIG CALAMITY', 'L' => 'PHILHEALTH PREMIUM', 'M' => 'WITHOLDING TAX', 'N' => 'CASH ADVANCE', 'O' => 'A/R-Tuition',
                    'P' => 'CHINABANK LOAN', 'Q' => 'TEA', 'S' => 'TOTAL DEDUCTIONS', 'T' => 'NET PAY'
                ];
                foreach ($headersRow6 as $col => $text) {
                    $sheet->setCellValue($col . '6', $text);
                }
                $sheet->setCellValue('Q7', 'LOAN');
                $sheet->setCellValue('R7', 'FEES');
                
                // Merge cells for single headers (spanning rows 5 and 6)
                $singleHeaders = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'S', 'T'];
                foreach ($singleHeaders as $col) {
                    $sheet->mergeCells("{$col}6:{$col}7");
                }
                // Merge cell for the "TEA" parent header
                $sheet->mergeCells('Q6:R6');

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
                // Set font color for deduction header columns to red
                $sheet->getStyle('E6:E7')->getFont()->getColor()->setRGB('FF0000');
                $sheet->getStyle('G6:S7')->getFont()->getColor()->setRGB('FF0000');


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
                
                    // The totals rows are already inserted into the collection (admin total before basic total).
                    // Find those rows by label in column A and apply styling (peach for BASIC ED, blue for ADMINISTRATOR).
                    for ($r = 8; $r <= $lastRow; $r++) {
                        $cellA = (string) $sheet->getCell('A' . $r)->getValue();
                        if ($cellA === 'TOTAL (BASIC ED)') {
                            // Peach fill for basic ed total
                            $sheet->getStyle('A' . $r . ':' . $highestColumn . $r)->applyFromArray([
                                'fill' => [
                                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                                    'startColor' => ['rgb' => 'FDE9D9'],
                                ],
                                'font' => ['bold' => true],
                            ]);
                            $sheet->getStyle('A' . $r)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_LEFT);
                            $sheet->getStyle('B' . $r . ':' . $highestColumn . $r)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);
                            // Ensure number format
                            $sheet->getStyle('B' . $r . ':' . $highestColumn . $r)->getNumberFormat()->setFormatCode('#,##0.00');
                        }
                        if ($cellA === 'TOTAL (ADMINISTRATOR)') {
                            // Blue fill for admin total
                            $sheet->getStyle('A' . $r . ':' . $highestColumn . $r)->applyFromArray([
                                'fill' => [
                                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                                    'startColor' => ['rgb' => 'DDEBF7'],
                                ],
                                'font' => ['bold' => true],
                            ]);
                            $sheet->getStyle('A' . $r)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_LEFT);
                            $sheet->getStyle('B' . $r . ':' . $highestColumn . $r)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);
                            $sheet->getStyle('B' . $r . ':' . $highestColumn . $r)->getNumberFormat()->setFormatCode('#,##0.00');
                            // Add a top border to visually separate the admin group
                            $sheet->getStyle('A' . $r . ':' . $highestColumn . $r)->getBorders()->getTop()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);
                        }
                            if ($cellA === 'GRAND TOTAL') {
                                // Bright yellow fill for grand total (#EDFC2C)
                                $sheet->getStyle('A' . $r . ':' . $highestColumn . $r)->applyFromArray([
                                    'fill' => [
                                        'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                                        'startColor' => ['rgb' => 'EDFC2C'],
                                    ],
                                    'font' => ['bold' => true],
                                ]);
                                $sheet->getStyle('A' . $r)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_LEFT);
                                $sheet->getStyle('B' . $r . ':' . $highestColumn . $r)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);
                                $sheet->getStyle('B' . $r . ':' . $highestColumn . $r)->getNumberFormat()->setFormatCode('#,##0.00');
                                // Thicker top border for grand total
                                $sheet->getStyle('A' . $r . ':' . $highestColumn . $r)->getBorders()->getTop()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_MEDIUM);

                                // Ensure numeric columns B..T are populated with 0 if empty
                                foreach (range('B', $highestColumn) as $col) {
                                    $coord = $col . $r;
                                    $val = $sheet->getCell($coord)->getValue();
                                    if ($val === null || $val === '') {
                                        $sheet->setCellValue($coord, 0);
                                    }
                                }
                            }
                    }
                }
            },
        ];
    }

    public function title(): string
    {
        return 'Admin and Basic Education';
    }
}

