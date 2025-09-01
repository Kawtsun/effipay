<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Models\Payroll;
use App\Models\Salary;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class PayrollController extends Controller
{
    /**
     * Run payroll calculation for all employees for a specific month
     */
    public function runPayroll(Request $request): JsonResponse
    {
        $request->validate([
            'payroll_date' => 'required|date',
        ]);

        $payrollDate = $request->input('payroll_date');
        $month = date('Y-m', strtotime($payrollDate));
        
        // Get all employees
        $employees = Employees::all();
        
        $processedCount = 0;
        $errors = [];

        foreach ($employees as $employee) {
            try {
                // Get salary defaults for employee type
                $salaryDefaults = Salary::where('employee_type', $employee->employee_type)->first();

                // Use salary defaults if found, else fallback to employee's own values
                $baseSalary = $salaryDefaults ? $salaryDefaults->base_salary : $employee->base_salary;
                $overtimePay = $salaryDefaults ? $salaryDefaults->overtime_pay : $employee->overtime_pay;
                $sss = $salaryDefaults ? $salaryDefaults->sss : $employee->sss;
                $pagIbig = $salaryDefaults ? $salaryDefaults->pag_ibig : $employee->pag_ibig;
                $withholdingTax = $salaryDefaults ? $salaryDefaults->withholding_tax : $employee->withholding_tax;
                // Calculate PhilHealth based on base salary
                $philhealth = ($baseSalary * 0.05) / 4;
                $philhealth = max(250, min(2500, $philhealth));

                // Calculate totals
                $grossPay = $baseSalary + $overtimePay;
                $totalDeductions = $sss + $philhealth + $pagIbig + $withholdingTax;
                $netPay = $grossPay - $totalDeductions;

                // Create or update payroll record
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

                $processedCount++;
            } catch (\Exception $e) {
                $errors[] = "Error processing employee {$employee->employee_name}: " . $e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Payroll processed for {$processedCount} employees for " . date('F j, Y', strtotime($payrollDate)),
            'processed_count' => $processedCount,
            'errors' => $errors,
        ]);
    }

    /**
     * Get payroll data for a specific employee and month
     */
    public function getEmployeePayroll(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'payroll_date' => 'required|date',
        ]);

        $payroll = Payroll::where('employee_id', $request->employee_id)
            ->where('payroll_date', $request->payroll_date)
            ->first();

        if (!$payroll) {
            return response()->json([
                'success' => false,
                'message' => 'No payroll data found for this employee and month',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'payroll' => $payroll,
        ]);
    }

    /**
     * Get available months for an employee
     */
    public function getEmployeePayrollDates(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
        ]);

        $payrollDates = Payroll::where('employee_id', $request->employee_id)
            ->orderBy('payroll_date', 'desc')
            ->pluck('payroll_date')
            ->values();

        return response()->json([
            'success' => true,
            'payroll_dates' => $payrollDates,
        ]);
    }

    /**
     * Get monthly payroll data for an employee (all payrolls in a month)
     */
    public function getEmployeeMonthlyPayroll(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'month' => 'required|date_format:Y-m',
        ]);

        $payrolls = Payroll::where('employee_id', $request->employee_id)
            ->where('month', $request->month)
            ->orderBy('payroll_date', 'asc')
            ->get();

        if ($payrolls->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No payroll data found for this employee and month',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'payrolls' => $payrolls,
            'month' => $request->month,
        ]);
    }

    /**
     * Get available months for an employee (limited to 2-3 months before first payroll)
     */
    public function getEmployeePayrollMonths(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
        ]);

        // Get all unique months with payroll data for this employee
        $employeeMonths = Payroll::where('employee_id', $request->employee_id)
            ->orderBy('month', 'desc')
            ->pluck('month')
            ->unique()
            ->values();

        // If this employee has no payroll data, get months from all employees
        if ($employeeMonths->isEmpty()) {
            $allMonths = Payroll::orderBy('month', 'desc')
                ->pluck('month')
                ->unique()
                ->values();

            if ($allMonths->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'months' => [],
                ]);
            }

            // Return the most recent 6 months from all employees
            $finalMonths = $allMonths->take(6)->values();
        } else {
            // Find the earliest month with payroll data for this employee
            $earliestMonth = $employeeMonths->last(); // since it's descending order
            $monthsToAdd = [];
            if ($earliestMonth) {
                // Parse the earliest month (Y-m) and create a date on the 1st of that month
                [$year, $month] = explode('-', $earliestMonth);
                $date = \Carbon\Carbon::create((int)$year, (int)$month, 1);
                if ($date) {
                    // Add the 2 months before the earliest using Carbon's subMonths method
                    $prevMonth1 = $date->copy()->subMonths(1)->format('Y-m');
                    $prevMonth2 = $date->copy()->subMonths(2)->format('Y-m');
                    
                    $monthsToAdd[] = $prevMonth1;
                    $monthsToAdd[] = $prevMonth2;
                }
            }

            // Merge and deduplicate, then sort descending
            $finalMonths = $employeeMonths->merge($monthsToAdd)
                ->unique()
                ->sortDesc()
                ->values();
        }

        return response()->json([
            'success' => true,
            'months' => $finalMonths,
        ]);
    }
}
