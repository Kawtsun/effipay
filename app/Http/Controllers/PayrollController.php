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
            // ...existing code...
            // Debug: Output all fetched summary data (after summary is fetched)
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
            $existingPayrolls = \App\Models\Payroll::where('employee_id', $employee->id)
                ->where('month', $payrollMonth)
                ->get();
            if ($existingPayrolls->count() >= 2) {
                // Already run twice for this month
                continue;
            }
            // If already run once, only allow for the other day
            $existingDates = $existingPayrolls->pluck('payroll_date')->toArray();
            if (in_array($request->payroll_date, $existingDates)) {
                continue;
            }

            $workHoursPerDay = $employee->work_hours_per_day ?? 8;
            $base_salary = $employee->base_salary;
            $rate_per_hour = $workHoursPerDay > 0 ? ($base_salary * 12 / 288) / $workHoursPerDay : 0;

            // Get all workdays in the month (Mon-Fri)
            $monthStart = strtotime($payrollMonth . '-01');
            $monthEnd = strtotime(date('Y-m-t', $monthStart));
            $daysInMonth = (int)date('t', $monthStart);

            $timekeepings = \App\Models\TimeKeeping::where('employee_id', $employee->id)
                ->where('date', 'like', $payrollMonth . '%')
                ->get()->keyBy('date');

                    $totalOvertimeHours = 0;
                    $tardiness = 0;
                    $undertime = 0;
                    $absences = 0;
                    $overtime_pay = 0;

                    // Fetch timekeeping summary for this employee and month
                    $summary = app(\App\Http\Controllers\TimeKeepingController::class)->monthlySummary(new \Illuminate\Http\Request([
                        'employee_id' => $employee->id,
                        'month' => $payrollMonth
                    ]));
                    $summaryData = $summary->getData(true);
                    if (isset($summaryData['overtime_pay_total'])) {
                        $overtime_pay = round($summaryData['overtime_pay_total'], 2);
                    }

                    for ($i = 1; $i <= $daysInMonth; $i++) {
                        $date = date('Y-m-d', strtotime($payrollMonth . '-' . str_pad($i, 2, '0', STR_PAD_LEFT)));
                        $dayOfWeek = date('N', strtotime($date)); // 1=Mon, 7=Sun
                        if ($dayOfWeek >= 6) continue; // skip weekends

                        $tk = $timekeepings->get($date);
                        // Count as absent if both clock_in and clock_out are missing, null, or only whitespace
                        if (
                            !$tk ||
                            ((is_null($tk->clock_in) || trim($tk->clock_in) === '') &&
                             (is_null($tk->clock_out) || trim($tk->clock_out) === ''))
                        ) {
                            $absences += $workHoursPerDay;
                            continue;
                        }
                        $start = strtotime($tk->clock_in);
                        $end = strtotime($tk->clock_out);
                        $hours = ($end - $start) / 3600;
                        // Overtime: hours beyond employee's work_hours_per_day
                        if ($hours > $workHoursPerDay) {
                            $otHours = $hours - $workHoursPerDay;
                            $totalOvertimeHours += $otHours;
                        }
                        // Tardiness: late clock-in
                        if ($employee->work_start_time) {
                            $schedStart = strtotime($employee->work_start_time);
                            if ($start > $schedStart) {
                                $tardiness += ($start - $schedStart) / 3600;
                            }
                        }
                        // Undertime: early clock-out
                        if ($employee->work_end_time) {
                            $schedEnd = strtotime($employee->work_end_time);
                            if ($end < $schedEnd) {
                                $undertime += ($schedEnd - $end) / 3600;
                            }
                        }
                    }

                    $sss = $employee->sss;
                    $philhealth = $employee->philhealth;
                    $pag_ibig = $employee->pag_ibig;
                    $withholding_tax = $base_salary > 0 ? (function($base_salary, $sss, $pag_ibig, $philhealth) {
                        $totalComp = $base_salary - ($sss + $pag_ibig + $philhealth);
                        if ($totalComp <= 20832) return 0;
                        if ($totalComp <= 33332) return 0.15 * ($totalComp - 20833);
                        if ($totalComp <= 66666) return 1875 + 0.20 * ($totalComp - 33333);
                        if ($totalComp <= 166666) return 8541.80 + 0.25 * ($totalComp - 66667);
                        if ($totalComp <= 666666) return 33541.80 + 0.30 * ($totalComp - 166667);
                        return 183541.80 + 0.35 * ($totalComp - 666667);
                    })($base_salary, $sss, $pag_ibig, $philhealth) : 0;

                    $gross_pay = round($base_salary, 2)
                        - (round($rate_per_hour * $tardiness, 2)
                        + round($rate_per_hour * $undertime, 2)
                        + round($rate_per_hour * $absences, 2));
                    $gross_pay += round($overtime_pay, 2);

                // Create and save payroll record
                $total_deductions = round($rate_per_hour * $tardiness, 2)
                    + round($rate_per_hour * $undertime, 2)
                    + round($rate_per_hour * $absences, 2)
                    + $sss + $philhealth + $pag_ibig + $withholding_tax;
                $net_pay = $gross_pay - $total_deductions;
                \App\Models\Payroll::create([
                    'employee_id' => $employee->id,
                    'month' => $payrollMonth,
                    'payroll_date' => $request->payroll_date,
                    'base_salary' => $base_salary,
                    'overtime_pay' => $overtime_pay,
                    'tardiness' => $tardiness,
                    'undertime' => $undertime,
                    'absences' => $absences,
                    'gross_pay' => $gross_pay,
                    'sss' => $sss,
                    'philhealth' => $philhealth,
                    'pag_ibig' => $pag_ibig,
                    'withholding_tax' => $withholding_tax,
                    'total_deductions' => $total_deductions,
                    'net_pay' => $net_pay,
                ]);
                $createdCount++;
        }

        if ($createdCount > 0) {
            return redirect()->back()->with('flash', 'Payroll run successfully for ' . date('F Y', strtotime($request->payroll_date)) . '. Payroll records created: ' . $createdCount);
        } else {
            return redirect()->back()->with('flash', 'Payroll already run twice for this month.');
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
