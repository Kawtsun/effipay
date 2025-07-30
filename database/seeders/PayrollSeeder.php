<?php

namespace Database\Seeders;

use App\Models\Employees;
use App\Models\Payroll;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PayrollSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Generate payroll data for 4 months (July, June, May, April) with data
        // March and February will have no data but will appear in month selector
        $payrollDates = [];
        
        // Generate 4 months with payroll data (current month + 3 previous)
        for ($i = 3; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $year = $date->year;
            $month = $date->month;
            
            // Add 15th of the month (first payroll)
            $payrollDates[] = $date->copy()->day(15)->format('Y-m-d');
            
            // Add 28th of the month (second payroll - flexible date)
            $lastDay = $date->copy()->endOfMonth()->day;
            $secondPayrollDay = min(28, $lastDay);
            $payrollDates[] = $date->copy()->day($secondPayrollDay)->format('Y-m-d');
        }

        $employees = Employees::all();

        foreach ($employees as $employee) {
            $monthIndex = 0;
            foreach ($payrollDates as $payrollDate) {
                // Create salary variations based on month
                $monthVariation = $this->getMonthVariation($monthIndex, $employee);
                
                // Calculate PhilHealth based on adjusted base salary
                $adjustedBaseSalary = $employee->base_salary + $monthVariation['base_salary_adjustment'];
                $philhealth = ($adjustedBaseSalary * 0.05) / 4;
                $philhealth = max(250, min(2500, $philhealth));
                $philhealth += $monthVariation['philhealth_adjustment'];

                // Calculate payroll components with variations
                $baseSalary = $employee->base_salary + $monthVariation['base_salary_adjustment'];
                $overtimePay = $employee->overtime_pay + $monthVariation['overtime_adjustment'];
                $sss = $employee->sss + $monthVariation['sss_adjustment'];
                $pagIbig = $employee->pag_ibig + $monthVariation['pag_ibig_adjustment'];
                $withholdingTax = $employee->withholding_tax + $monthVariation['withholding_tax_adjustment'];

                // Calculate totals
                $grossPay = $baseSalary + $overtimePay;
                $totalDeductions = $sss + $philhealth + $pagIbig + $withholdingTax;
                $netPay = $grossPay - $totalDeductions;

                // Create payroll record
                Payroll::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'payroll_date' => $payrollDate,
                    ],
                    [
                        'month' => date('Y-m', strtotime($payrollDate)),
                        'base_salary' => $baseSalary,
                        'overtime_pay' => $overtimePay,
                        'sss' => $sss,
                        'philhealth' => $philhealth,
                        'pag_ibig' => $pagIbig,
                        'withholding_tax' => $withholdingTax,
                        'gross_pay' => $grossPay,
                        'total_deductions' => $totalDeductions,
                        'net_pay' => $netPay,
                    ]
                );
                
                $monthIndex++;
            }
        }

        $this->command->info('Sample payroll data generated for 15th and 28th of the last 4 months (July, June, May, April) with salary variations.');
        $this->command->info('March and February will appear in month selector but have no payroll data for testing empty scenarios.');
    }

    /**
     * Generate salary variations based on month index and employee
     */
    private function getMonthVariation(int $monthIndex, Employees $employee): array
    {
        // Base variations that create realistic salary changes
        $variations = [
            // Month 0 (July - most recent) - slight increases
            [
                'base_salary_adjustment' => rand(500, 2000),
                'overtime_adjustment' => rand(-500, 1000),
                'sss_adjustment' => rand(-200, 300),
                'philhealth_adjustment' => rand(-100, 200),
                'pag_ibig_adjustment' => rand(-200, 300),
                'withholding_tax_adjustment' => rand(-500, 800),
            ],
            // Month 1 (June) - moderate changes
            [
                'base_salary_adjustment' => rand(-1000, 1500),
                'overtime_adjustment' => rand(-800, 1200),
                'sss_adjustment' => rand(-300, 400),
                'philhealth_adjustment' => rand(-150, 250),
                'pag_ibig_adjustment' => rand(-300, 400),
                'withholding_tax_adjustment' => rand(-600, 900),
            ],
            // Month 2 (May) - more significant variations
            [
                'base_salary_adjustment' => rand(-1500, 2500),
                'overtime_adjustment' => rand(-1200, 1800),
                'sss_adjustment' => rand(-400, 500),
                'philhealth_adjustment' => rand(-200, 300),
                'pag_ibig_adjustment' => rand(-400, 500),
                'withholding_tax_adjustment' => rand(-800, 1200),
            ],
            // Month 3 (April) - original values with minor adjustments
            [
                'base_salary_adjustment' => rand(-2000, 1000),
                'overtime_adjustment' => rand(-1500, 1000),
                'sss_adjustment' => rand(-500, 300),
                'philhealth_adjustment' => rand(-250, 200),
                'pag_ibig_adjustment' => rand(-500, 300),
                'withholding_tax_adjustment' => rand(-1000, 800),
            ],
        ];

        // Add role-based variations
        $roleVariations = $this->getRoleBasedVariations($employee);
        
        // Combine base variations with role-based variations
        $monthVariation = $variations[$monthIndex % 4];
        foreach ($monthVariation as $key => $value) {
            $monthVariation[$key] = $value + ($roleVariations[$key] ?? 0);
        }

        return $monthVariation;
    }

    /**
     * Generate role-based salary variations
     */
    private function getRoleBasedVariations(Employees $employee): array
    {
        $roles = explode(',', $employee->roles);
        $variations = [
            'base_salary_adjustment' => 0,
            'overtime_adjustment' => 0,
            'sss_adjustment' => 0,
            'philhealth_adjustment' => 0,
            'pag_ibig_adjustment' => 0,
            'withholding_tax_adjustment' => 0,
        ];

        foreach ($roles as $role) {
            $role = trim($role);
            switch ($role) {
                case 'administrator':
                    // Administrators get higher base salary adjustments
                    $variations['base_salary_adjustment'] += rand(500, 1500);
                    $variations['overtime_adjustment'] += rand(-200, 500);
                    break;
                case 'college instructor':
                    // College instructors get moderate overtime and higher deductions
                    $variations['overtime_adjustment'] += rand(300, 800);
                    $variations['withholding_tax_adjustment'] += rand(200, 600);
                    break;
                case 'basic education instructor':
                    // Basic education instructors get stable salaries with minor variations
                    $variations['base_salary_adjustment'] += rand(-300, 500);
                    $variations['overtime_adjustment'] += rand(-100, 400);
                    break;
            }
        }

        return $variations;
    }
}
