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
        // Generate payroll data for 6 months for all employees, with monthly and role-based variations, but using SalaryController formulas for PhilHealth and withholding_tax
        $employees = Employees::all();

        $startDate = \Carbon\Carbon::create(2025, 3, 1); // March 2025
        for ($i = 0; $i < 6; $i++) {
            $date = $startDate->copy()->addMonths($i);
            $month = $date->format('Y-m');
            $firstPayrollDate = $date->copy()->day(15)->format('Y-m-d');
            $lastDay = $date->copy()->endOfMonth()->day;
            $secondPayrollDay = min(30, $lastDay);
            $secondPayrollDate = $date->copy()->day($secondPayrollDay)->format('Y-m-d');

            foreach ($employees as $employee) {
                // Get monthly and role-based variations
                $monthVariation = $this->getMonthVariation($i, $employee);

                $baseSalary = max(10000, $employee->base_salary + $monthVariation['base_salary_adjustment']);
                $overtimePay = max(0, $employee->overtime_pay + $monthVariation['overtime_adjustment']);
                    // SSS formula (match salaryFormulas.ts)
                    $sss = 0;
                    if ($baseSalary < 5250) {
                        $sss = 250.00;
                    } elseif ($baseSalary <= 5749.99) {
                        $sss = 275.00;
                    } elseif ($baseSalary <= 6249.99) {
                        $sss = 300.00;
                    } elseif ($baseSalary <= 6749.99) {
                        $sss = 325.00;
                    } elseif ($baseSalary <= 7249.99) {
                        $sss = 350.00;
                    } elseif ($baseSalary <= 7749.99) {
                        $sss = 375.00;
                    } elseif ($baseSalary <= 8249.99) {
                        $sss = 400.00;
                    } elseif ($baseSalary <= 8749.99) {
                        $sss = 425.00;
                    } elseif ($baseSalary <= 9249.99) {
                        $sss = 450.00;
                    } elseif ($baseSalary <= 9749.99) {
                        $sss = 475.00;
                    } elseif ($baseSalary <= 10249.99) {
                        $sss = 500.00;
                    } elseif ($baseSalary <= 10749.99) {
                        $sss = 525.00;
                    } elseif ($baseSalary <= 11249.99) {
                        $sss = 550.00;
                    } elseif ($baseSalary <= 11749.99) {
                        $sss = 575.00;
                    } elseif ($baseSalary <= 12249.99) {
                        $sss = 600.00;
                    } elseif ($baseSalary <= 12749.99) {
                        $sss = 625.00;
                    } elseif ($baseSalary <= 13249.99) {
                        $sss = 650.00;
                    } elseif ($baseSalary <= 13749.99) {
                        $sss = 675.00;
                    } elseif ($baseSalary <= 14249.99) {
                        $sss = 700.00;
                    } elseif ($baseSalary <= 14749.99) {
                        $sss = 725.00;
                    } elseif ($baseSalary <= 15249.99) {
                        $sss = 750.00;
                    } elseif ($baseSalary <= 15749.99) {
                        $sss = 775.00;
                    } elseif ($baseSalary <= 16249.99) {
                        $sss = 800.00;
                    } elseif ($baseSalary <= 16749.99) {
                        $sss = 825.00;
                    } elseif ($baseSalary <= 17249.99) {
                        $sss = 850.00;
                    } elseif ($baseSalary <= 17749.99) {
                        $sss = 875.00;
                    } elseif ($baseSalary <= 18249.99) {
                        $sss = 900.00;
                    } elseif ($baseSalary <= 18749.99) {
                        $sss = 925.00;
                    } elseif ($baseSalary <= 19249.99) {
                        $sss = 950.00;
                    } elseif ($baseSalary <= 19749.99) {
                        $sss = 975.00;
                    } elseif ($baseSalary <= 20249.99) {
                        $sss = 1025.00;
                    } elseif ($baseSalary <= 20749.99) {
                        $sss = 1050.00;
                    } elseif ($baseSalary <= 21249.99) {
                        $sss = 1075.00;
                    } elseif ($baseSalary <= 21749.99) {
                        $sss = 1100.00;
                    } elseif ($baseSalary <= 22249.99) {
                        $sss = 1125.00;
                    } elseif ($baseSalary <= 22749.99) {
                        $sss = 1150.00;
                    } elseif ($baseSalary <= 23249.99) {
                        $sss = 1175.00;
                    } elseif ($baseSalary <= 23749.99) {
                        $sss = 1200.00;
                    } elseif ($baseSalary <= 24249.99) {
                        $sss = 1225.00;
                    } elseif ($baseSalary <= 24749.99) {
                        $sss = 1250.00;
                    } elseif ($baseSalary <= 25249.99) {
                        $sss = 1275.00;
                    } elseif ($baseSalary <= 25749.99) {
                        $sss = 1300.00;
                    } elseif ($baseSalary <= 26249.99) {
                        $sss = 1325.00;
                    } elseif ($baseSalary <= 26749.99) {
                        $sss = 1350.00;
                    } elseif ($baseSalary <= 27249.99) {
                        $sss = 1375.00;
                    } elseif ($baseSalary <= 27749.99) {
                        $sss = 1400.00;
                    } elseif ($baseSalary <= 28249.99) {
                        $sss = 1425.00;
                    } elseif ($baseSalary <= 28749.99) {
                        $sss = 1450.00;
                    } elseif ($baseSalary <= 29249.99) {
                        $sss = 1475.00;
                    } elseif ($baseSalary <= 29749.99) {
                        $sss = 1500.00;
                    } elseif ($baseSalary <= 30249.99) {
                        $sss = 1525.00;
                    } elseif ($baseSalary <= 30749.99) {
                        $sss = 1550.00;
                    } elseif ($baseSalary <= 31249.99) {
                        $sss = 1575.00;
                    } elseif ($baseSalary <= 31749.99) {
                        $sss = 1600.00;
                    } elseif ($baseSalary <= 32249.99) {
                        $sss = 1625.00;
                    } elseif ($baseSalary <= 32749.99) {
                        $sss = 1650.00;
                    } elseif ($baseSalary <= 33249.99) {
                        $sss = 1675.00;
                    } elseif ($baseSalary <= 33749.99) {
                        $sss = 1700.00;
                    } elseif ($baseSalary <= 34249.99) {
                        $sss = 1725.00;
                    } else {
                        $sss = 1750.00;
                    }
                    $sss = number_format($sss, 2, '.', '');
                $pagIbig = max(0, min($employee->pag_ibig + $monthVariation['pag_ibig_adjustment'], $baseSalary * 0.08));

                // PhilHealth calculation (match SalaryController: ($base_salary * 0.05) / 2, min 250, max 2500)
                $philhealth = max(250, min(2500, ($baseSalary * 0.05) / 2));

                // Withholding tax calculation (match SalaryController)
                $total_compensation = $baseSalary - ($sss + $pagIbig + $philhealth);
                if ($total_compensation <= 20832) {
                    $withholdingTax = 0;
                } elseif ($total_compensation >= 20833 && $total_compensation <= 33332) {
                    $withholdingTax = ($total_compensation - 20833) * 0.15;
                } elseif ($total_compensation >= 33333 && $total_compensation <= 66666) {
                    $withholdingTax = ($total_compensation - 33333) * 0.20 + 1875;
                } elseif ($total_compensation >= 66667 && $total_compensation <= 166666) {
                    $withholdingTax = ($total_compensation - 66667) * 0.25 + 8541.80;
                } elseif ($total_compensation >= 166667 && $total_compensation <= 666666) {
                    $withholdingTax = ($total_compensation - 166667) * 0.30 + 33541.80;
                } elseif ($total_compensation >= 666667) {
                    $withholdingTax = ($total_compensation - 666667) * 0.35 + 183541.80;
                } else {
                    $withholdingTax = 0;
                }

                $grossPay = $baseSalary + $overtimePay;
                $totalDeductions = $sss + $philhealth + $pagIbig + $withholdingTax;
                $netPay = max(0, $grossPay - $totalDeductions);

                foreach ([$firstPayrollDate, $secondPayrollDate] as $payrollDate) {
                    Payroll::updateOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'payroll_date' => $payrollDate,
                        ],
                        [
                            'month' => $month,
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
                }
            }
        }

        $this->command->info('Payroll data generated for all employees for each payroll run per month, with monthly and role-based variations, using auto-calculation formulas.');
    }

    /**
     * Generate salary variations based on month index and employee
     */
    private function getMonthVariation(int $monthIndex, Employees $employee): array
    {
        // Base variations that create realistic salary changes
        $variations = [
            // Month 0 (most recent) - much larger increases
            [
                'base_salary_adjustment' => rand(-30000, 50000),
                'overtime_adjustment' => rand(-15000, 25000),
                'sss_adjustment' => rand(-5000, 8000),
                'philhealth_adjustment' => rand(-2500, 3500),
                'pag_ibig_adjustment' => rand(-4000, 6000),
                'withholding_tax_adjustment' => rand(-12000, 18000),
            ],
            // Month 1 - even more pronounced changes
            [
                'base_salary_adjustment' => rand(-35000, 60000),
                'overtime_adjustment' => rand(-20000, 30000),
                'sss_adjustment' => rand(-7000, 10000),
                'philhealth_adjustment' => rand(-3500, 4500),
                'pag_ibig_adjustment' => rand(-6000, 8000),
                'withholding_tax_adjustment' => rand(-18000, 25000),
            ],
            // Month 2 - very significant variations
            [
                'base_salary_adjustment' => rand(-40000, 70000),
                'overtime_adjustment' => rand(-25000, 35000),
                'sss_adjustment' => rand(-9000, 12000),
                'philhealth_adjustment' => rand(-4500, 6000),
                'pag_ibig_adjustment' => rand(-8000, 10000),
                'withholding_tax_adjustment' => rand(-25000, 35000),
            ],
            // Month 3 - wide range
            [
                'base_salary_adjustment' => rand(-30000, 50000),
                'overtime_adjustment' => rand(-15000, 25000),
                'sss_adjustment' => rand(-5000, 8000),
                'philhealth_adjustment' => rand(-2500, 3500),
                'pag_ibig_adjustment' => rand(-4000, 6000),
                'withholding_tax_adjustment' => rand(-12000, 18000),
            ],
            // Month 4 - older data with more variations
            [
                'base_salary_adjustment' => rand(-35000, 60000),
                'overtime_adjustment' => rand(-20000, 30000),
                'sss_adjustment' => rand(-7000, 10000),
                'philhealth_adjustment' => rand(-3500, 4500),
                'pag_ibig_adjustment' => rand(-6000, 8000),
                'withholding_tax_adjustment' => rand(-18000, 25000),
            ],
            // Month 5 - oldest data with significant variations
            [
                'base_salary_adjustment' => rand(-40000, 70000),
                'overtime_adjustment' => rand(-25000, 35000),
                'sss_adjustment' => rand(-9000, 12000),
                'philhealth_adjustment' => rand(-4500, 6000),
                'pag_ibig_adjustment' => rand(-8000, 10000),
                'withholding_tax_adjustment' => rand(-25000, 35000),
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
