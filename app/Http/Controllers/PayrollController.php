<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Models\Payroll;
use App\Models\Salary;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class PayrollController extends Controller
{
    /**
     * Run payroll for a given date (placeholder implementation)
     */
    public function runPayroll(Request $request)
    {
        $request->validate([
            'payroll_date' => 'required|date',
        ]);

        // Extract the month (YYYY-MM) from the selected payroll date
        $payrollMonth = date('Y-m', strtotime($request->payroll_date));

        // Check if there is any timekeeping data for this month
        $hasTimekeeping = \App\Models\TimeKeeping::where('date', 'like', $payrollMonth . '%')->exists();
        if (!$hasTimekeeping) {
            return redirect()->back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'No timekeeping data found for ' . date('F Y', strtotime($request->payroll_date)) . '. Cannot run payroll.'
                ]
            ]);
        }

        // Get all employees
        $employees = \App\Models\Employees::all();
        $createdCount = 0;
        foreach ($employees as $employee) {
            // Check if payroll already exists for this employee and month
            $existing = \App\Models\Payroll::where('employee_id', $employee->id)
                ->where('month', $payrollMonth)
                ->first();
            if ($existing) {
                continue; // Skip if already exists
            }

            // Get salary defaults for this employee type
            $salary = \App\Models\Salary::where('employee_type', $employee->employee_type)->first();
            if (!$salary) {
                continue; // Skip if no salary defaults
            }

            // Calculate gross pay (simple: base_salary, can be expanded)
            $base_salary = $salary->base_salary;
            $overtime_pay = $salary->overtime_pay;
            $sss = $salary->sss;
            $philhealth = $salary->philhealth;
            $pag_ibig = $salary->pag_ibig;
            $withholding_tax = $salary->withholding_tax;
            $gross_pay = $base_salary + $overtime_pay;
            $total_deductions = $sss + $philhealth + $pag_ibig + $withholding_tax;
            $net_pay = $gross_pay - $total_deductions;

            \App\Models\Payroll::create([
                'employee_id' => $employee->id,
                'month' => $payrollMonth,
                'payroll_date' => $request->payroll_date,
                'base_salary' => $base_salary,
                'overtime_pay' => $overtime_pay,
                'sss' => $sss,
                'philhealth' => $philhealth,
                'pag_ibig' => $pag_ibig,
                'withholding_tax' => $withholding_tax,
                'gross_pay' => $gross_pay,
                'total_deductions' => $total_deductions,
                'net_pay' => $net_pay,
            ]);
            $createdCount++;
        }

        if ($createdCount > 0) {
            return redirect()->back()->with('flash', 'Payroll run successfully for ' . date('F Y', strtotime($request->payroll_date)) . '. Payroll records created: ' . $createdCount);
        } else {
            return redirect()->back()->with('flash', 'Payroll already exists for all employees for ' . date('F Y', strtotime($request->payroll_date)) . '.');
        }
    }
    /**
     * Get all unique months from both Payroll and TimeKeeping, sorted descending.
     */
    public function getAllAvailableMonths(Request $request): JsonResponse
    {
        // Get months from payrolls
        $payrollMonths = \App\Models\Payroll::orderBy('month', 'desc')
            ->pluck('month')
            ->filter()
            ->unique();

        // Get months from timekeeping (extract YYYY-MM from date)
        $tkMonths = \App\Models\TimeKeeping::selectRaw('DISTINCT LEFT(date, 7) as month')
            ->orderBy('month', 'desc')
            ->pluck('month')
            ->filter()
            ->unique();

        // Merge, deduplicate, sort descending
        $allMonths = $payrollMonths->merge($tkMonths)
            ->unique()
            ->sortDesc()
            ->values();


        return response()->json([
            'success' => true,
            'months' => $allMonths,
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
            'months' => isset($finalMonths) ? $finalMonths : [],
        ]);
    }

}
