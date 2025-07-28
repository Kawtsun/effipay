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
        // Generate payroll data for the last 3 months (various dates to show flexibility)
        $payrollDates = [];
        
        for ($i = 2; $i >= 0; $i--) {
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
            foreach ($payrollDates as $payrollDate) {
                // Calculate PhilHealth based on base salary
                $philhealth = ($employee->base_salary * 0.05) / 4;
                $philhealth = max(250, min(2500, $philhealth));

                // Calculate payroll components
                $baseSalary = $employee->base_salary;
                $overtimePay = $employee->overtime_pay;
                $sss = $employee->sss;
                $pagIbig = $employee->pag_ibig;
                $withholdingTax = $employee->withholding_tax;

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
            }
        }

        $this->command->info('Sample payroll data generated for 15th and 30th of the last 3 months.');
    }
}
