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
        // Generate payroll data for 6 months with data
        // 2 months before the earliest will have no data but will appear in month selector
        $payrollDates = [];
        
        // Use a fixed date range to ensure we have 6 months of data
        // Start from March 2025 and go forward 6 months
        $startDate = \Carbon\Carbon::create(2025, 3, 1); // March 2025
        
        // Generate 6 months with payroll data
        for ($i = 0; $i < 6; $i++) {
            $date = $startDate->copy()->addMonths($i);
            
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

        $this->command->info('Sample payroll data generated with pronounced month-to-month salary variations.');
    }

    /**
     * Generate salary variations based on month index and employee
     */
    private function getMonthVariation(int $monthIndex, Employees $employee): array
    {
        // Base variations that create realistic salary changes
        $variations = [
            // Month 0 (most recent) - slight increases
            [
                'base_salary_adjustment' => rand(-15000, 20000),
                'overtime_adjustment' => rand(-8000, 12000),
                'sss_adjustment' => rand(-2500, 3500),
                'philhealth_adjustment' => rand(-1200, 1500),
                'pag_ibig_adjustment' => rand(-2000, 3000),
                'withholding_tax_adjustment' => rand(-6000, 9000),
            ],
            // Month 1 - moderate changes
            [
                'base_salary_adjustment' => rand(-20000, 25000),
                'overtime_adjustment' => rand(-10000, 15000),
                'sss_adjustment' => rand(-3500, 5000),
                'philhealth_adjustment' => rand(-1600, 2200),
                'pag_ibig_adjustment' => rand(-2500, 3500),
                'withholding_tax_adjustment' => rand(-9000, 12000),
            ],
            // Month 2 - more significant variations
            [
                'base_salary_adjustment' => rand(-25000, 35000),
                'overtime_adjustment' => rand(-15000, 20000),
                'sss_adjustment' => rand(-5000, 7000),
                'philhealth_adjustment' => rand(-2200, 3200),
                'pag_ibig_adjustment' => rand(-3200, 4500),
                'withholding_tax_adjustment' => rand(-15000, 20000),
            ],
            // Month 3 - original values with minor adjustments
            [
                'base_salary_adjustment' => rand(-18000, 18000),
                'overtime_adjustment' => rand(-9000, 9000),
                'sss_adjustment' => rand(-3000, 3000),
                'philhealth_adjustment' => rand(-1200, 1200),
                'pag_ibig_adjustment' => rand(-2600, 2600),
                'withholding_tax_adjustment' => rand(-7000, 7000),
            ],
            // Month 4 - older data with more variations
            [
                'base_salary_adjustment' => rand(-22000, 22000),
                'overtime_adjustment' => rand(-12000, 12000),
                'sss_adjustment' => rand(-4500, 4500),
                'philhealth_adjustment' => rand(-1800, 1800),
                'pag_ibig_adjustment' => rand(-4200, 4200),
                'withholding_tax_adjustment' => rand(-12000, 12000),
            ],
            // Month 5 - oldest data with significant variations
            [
                'base_salary_adjustment' => rand(-30000, 35000),
                'overtime_adjustment' => rand(-20000, 22000),
                'sss_adjustment' => rand(-7000, 8000),
                'philhealth_adjustment' => rand(-2600, 3000),
                'pag_ibig_adjustment' => rand(-6000, 7000),
                'withholding_tax_adjustment' => rand(-20000, 22000),
            ],
        ];

        // Add role-based variations
        $roleVariations = $this->getRoleBasedVariations($employee);
        
        // Combine base variations with role-based variations
        $monthVariation = $variations[$monthIndex % 6];
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
