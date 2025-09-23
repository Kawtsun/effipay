<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Models\Payroll;
use App\Models\Salary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
            // ...existing code...
            // Debug: Output all fetched summary data (after summary is fetched)
    {
        $request->validate([
            'payroll_date' => 'required|date',
        ]);

        // Extract the month (YYYY-MM) from the selected payroll date
        $payrollMonth = date('Y-m', strtotime($request->payroll_date));

        // Check for employees missing timekeeping data for this month
        $employees = \App\Models\Employees::all();
        $missingTK = [];
        foreach ($employees as $employee) {
            // Fetch timekeeping summary for this employee and month
            $summary = app(\App\Http\Controllers\TimeKeepingController::class)->monthlySummary(new \Illuminate\Http\Request([
                'employee_id' => $employee->id,
                'month' => $payrollMonth
            ]));
            $summaryData = $summary->getData(true);

            // Debug: Log summary data and overtime value for this employee
            \Illuminate\Support\Facades\Log::info('[Payroll Debug] Employee: ' . $employee->id . ' ' . $employee->first_name . ' ' . $employee->last_name, [
                'summaryData' => $summaryData,
                'overtime_used' => isset($summaryData['overtime_count']) ? $summaryData['overtime_count'] : null,
            ]);
            $hasTK = \App\Models\TimeKeeping::where('employee_id', $employee->id)
                ->where('date', 'like', $payrollMonth . '%')
                ->exists();
            if (!$hasTK) {
                $missingTK[] = $employee->first_name . ' ' . $employee->last_name;
            }
        }
        if (count($missingTK) > 0) {
            return redirect()->back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Cannot run payroll. Some employees have no timekeeping data for ' . date('F Y', strtotime($request->payroll_date)) . '.'
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

            // Fetch timekeeping summary for this employee and month
            $summary = app(\App\Http\Controllers\TimeKeepingController::class)->monthlySummary(new \Illuminate\Http\Request([
                'employee_id' => $employee->id,
                'month' => $payrollMonth
            ]));
            $summaryData = $summary->getData(true);

            // Check if employee is a College Instructor (case-insensitive, substring match)
            $isCollegeInstructor = false;
            if (isset($employee->roles) && is_string($employee->roles) && stripos($employee->roles, 'college instructor') !== false) {
                $isCollegeInstructor = true;
            }

            if ($isCollegeInstructor) {
                // Use college_rate for all calculations
                $college_rate = isset($employee->college_rate) ? floatval($employee->college_rate) : 0;
                $total_hours_worked = isset($summaryData['total_hours']) ? floatval($summaryData['total_hours']) : 0;
                $tardiness = isset($summaryData['tardiness']) ? floatval($summaryData['tardiness']) : 0;
                $undertime = isset($summaryData['undertime']) ? floatval($summaryData['undertime']) : 0;
                $absences = isset($summaryData['absences']) ? floatval($summaryData['absences']) : 0;
                $overtime = (isset($summaryData['overtime']) && is_numeric($summaryData['overtime'])) ? floatval($summaryData['overtime']) : 0;
                $honorarium = !is_null($employee->honorarium) ? floatval($employee->honorarium) : 0;

                // Statutory contributions: always use the current value from the employee record (even if 0)
                $sss = $employee->sss;
                $philhealth = $employee->philhealth;
                $pag_ibig = $employee->pag_ibig;
                $withholding_tax = $employee->withholding_tax;

                // Gross pay: (college_rate * total_hours_worked) + overtime + honorarium
                $gross_pay = round($college_rate * $total_hours_worked, 2)
                    - (round($college_rate * $tardiness, 2)
                    + round($college_rate * $undertime, 2)
                    + round($college_rate * $absences, 2))
                    + round($college_rate * $overtime, 2)
                    + round($honorarium, 2);

                // For record-keeping, set base_salary to employee's base_salary or 0 (not used in calculation)
                $base_salary = !is_null($employee->base_salary) ? $employee->base_salary : 0;
            } else {
                // Use all calculated values from timekeeping summary (default logic)
                $workHoursPerDay = $employee->work_hours_per_day ?? 8;
                $base_salary = isset($summaryData['base_salary']) ? $summaryData['base_salary'] : $employee->base_salary;
                $rate_per_hour = isset($summaryData['rate_per_hour']) ? $summaryData['rate_per_hour'] : ($workHoursPerDay > 0 ? ($base_salary * 12 / 288) / $workHoursPerDay : 0);
                $tardiness = isset($summaryData['tardiness']) ? $summaryData['tardiness'] : 0;
                // Calculate work hours per day from start/end, minus 1 hour for break
                if (!empty($employee->work_start_time) && !empty($employee->work_end_time)) {
                    $start = strtotime($employee->work_start_time);
                    $end = strtotime($employee->work_end_time);
                    $workMinutes = $end - $start;
                    if ($workMinutes <= 0) $workMinutes += 24 * 60 * 60;
                    $workHoursPerDay = max(1, round(($workMinutes / 3600) - 1, 2)); // minus 1 hour for break
                }
                $undertime = isset($summaryData['undertime']) ? $summaryData['undertime'] : 0;
                $absences = isset($summaryData['absences']) ? $summaryData['absences'] : 0;
                $overtime = (isset($summaryData['overtime']) && is_numeric($summaryData['overtime'])) ? floatval($summaryData['overtime']) : 0;

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

                $honorarium = !is_null($employee->honorarium) ? $employee->honorarium : 0;
                $gross_pay = round($base_salary, 2)
                    - (round($rate_per_hour * $tardiness, 2)
                    + round($rate_per_hour * $undertime, 2)
                    + round($rate_per_hour * $absences, 2))
                    + round($rate_per_hour * $overtime, 2)
                    + round($honorarium, 2);
            }

                // Create and save payroll record
                // Get all loan and deduction fields from employee
                // Always reference all new fields, fallback to 0 if missing
                $sss_salary_loan = !is_null($employee->sss_salary_loan) ? $employee->sss_salary_loan : 0;
                $sss_calamity_loan = !is_null($employee->sss_calamity_loan) ? $employee->sss_calamity_loan : 0;
                $pagibig_multi_loan = !is_null($employee->pagibig_multi_loan) ? $employee->pagibig_multi_loan : 0;
                $pagibig_calamity_loan = !is_null($employee->pagibig_calamity_loan) ? $employee->pagibig_calamity_loan : 0;
                $peraa_con = !is_null($employee->peraa_con) ? $employee->peraa_con : 0;
                $tuition = !is_null($employee->tuition) ? $employee->tuition : 0;
                $china_bank = !is_null($employee->china_bank) ? $employee->china_bank : 0;
                $tea = !is_null($employee->tea) ? $employee->tea : 0;
                $honorarium = !is_null($employee->honorarium) ? $employee->honorarium : 0;
                $salary_loan = !is_null($employee->salary_loan) ? $employee->salary_loan : 0;
                $calamity_loan = !is_null($employee->calamity_loan) ? $employee->calamity_loan : 0;
                $multipurpose_loan = !is_null($employee->multipurpose_loan) ? $employee->multipurpose_loan : 0;

                $total_deductions = $sss + $philhealth + $pag_ibig + $withholding_tax
                    + $sss_salary_loan + $sss_calamity_loan + $pagibig_multi_loan + $pagibig_calamity_loan
                    + $peraa_con + $tuition + $china_bank + $tea + $honorarium
                    + $salary_loan + $calamity_loan + $multipurpose_loan;
                $net_pay = $gross_pay - $total_deductions;
                \Illuminate\Support\Facades\Log::info([
                    'employee_id' => $employee->id,
                    'sss_salary_loan' => $sss_salary_loan,
                    'sss_calamity_loan' => $sss_calamity_loan,
                    'pagibig_multi_loan' => $pagibig_multi_loan,
                    'pagibig_calamity_loan' => $pagibig_calamity_loan,
                    'peraa_con' => $peraa_con,
                    'tuition' => $tuition,
                    'china_bank' => $china_bank,
                    'tea' => $tea,
                    'honorarium' => $honorarium,
                    'salary_loan' => $salary_loan,
                    'calamity_loan' => $calamity_loan,
                    'multipurpose_loan' => $multipurpose_loan,
                ]);
                $payrollData = [
                    'employee_id' => $employee->id,
                    'month' => $payrollMonth,
                    'payroll_date' => $request->payroll_date,
                    'base_salary' => $base_salary,
                    'college_rate' => isset($college_rate) ? $college_rate : null,
                    'honorarium' => $honorarium,
                    'overtime' => $overtime,
                    'tardiness' => $tardiness,
                    'undertime' => $undertime,
                    'absences' => $absences,
                    'gross_pay' => $gross_pay,
                    'sss' => $sss,
                    'philhealth' => $philhealth,
                    'pag_ibig' => $pag_ibig,
                    'withholding_tax' => $withholding_tax,
                    'sss_salary_loan' => $sss_salary_loan,
                    'sss_calamity_loan' => $sss_calamity_loan,
                    'pagibig_multi_loan' => $pagibig_multi_loan,
                    'pagibig_calamity_loan' => $pagibig_calamity_loan,
                    'peraa_con' => $peraa_con,
                    'tuition' => $tuition,
                    'china_bank' => $china_bank,
                    'tea' => $tea,
                    'salary_loan' => $salary_loan,
                    'calamity_loan' => $calamity_loan,
                    'multipurpose_loan' => $multipurpose_loan,
                    'total_deductions' => $total_deductions,
                    'net_pay' => $net_pay,
                ];
                \Illuminate\Support\Facades\Log::info('[Payroll Debug] Payroll::create array', $payrollData);
                \App\Models\Payroll::create($payrollData);
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

        // Only return the actual payroll record fields for that month (do not merge from employee table)
        $payrollsArray = $payrolls->map(function($payroll) {
            return $payroll->toArray();
        });

        return response()->json([
            'success' => true,
            'payrolls' => $payrollsArray,
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
