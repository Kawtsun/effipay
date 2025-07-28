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
                
                if (!$salaryDefaults) {
                    $errors[] = "No salary defaults found for employee type: {$employee->employee_type}";
                    continue;
                }

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

        // Get all months for this employee
        $allMonths = Payroll::where('employee_id', $request->employee_id)
            ->orderBy('month', 'desc')
            ->pluck('month')
            ->unique()
            ->values();

        // Limit to 2-3 months before the first payroll calculation
        $limitedMonths = $allMonths->take(2);

        return response()->json([
            'success' => true,
            'months' => $limitedMonths,
        ]);
    }
}
