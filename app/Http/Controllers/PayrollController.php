<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Models\Payroll;
use App\Models\Salary;
use App\Services\TimekeepingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Carbon\Carbon;
use App\Exports\PayrollExport;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class PayrollController extends Controller
{
    /**
     * Run payroll for a given date (placeholder implementation)
     */
    public function runPayroll(Request $request)
    {
        $request->validate([
            'payroll_date' => 'required', // we'll normalize below to a real date
        ]);

        // Normalize incoming date which may be YYYY-MM (month-only)
        $raw = $request->payroll_date;
        try {
            // If month-only, Carbon will still parse to first day of month
            $payrollDate = Carbon::parse(strval($raw));
        } catch (\Throwable $e) {
            return redirect()->back()->withErrors(['message' => 'Invalid payroll date.']);
        }
        $payrollMonth = $payrollDate->format('Y-m');

        // Get all employees
        $employees = \App\Models\Employees::all();

        // If no employees have any timekeeping records for the month, fail early with a clear message.
        $employeesWithTkCount = \App\Models\TimeKeeping::where('date', 'like', $payrollMonth . '%')
            ->distinct()
            ->count('employee_id');
        if ($employeesWithTkCount === 0) {
            // Send an error flash that the frontend will display as a toast
            return redirect()->back()->with('flash', [
                'type' => 'error',
                'message' => 'No TimeKeeping Record found for this month',
                'at' => now()->timestamp,
            ]);
        }
    $createdCount = 0;
    foreach ($employees as $employee) {
            // Reset branch-scoped variables per employee to avoid bleed-over between iterations
            $college_rate = null;
            $overtime_hours = 0; $tardiness = 0; $undertime = 0; $absences = 0; $overtime_pay = 0;
            $honorarium = 0; $base_salary = 0; $sss = 0.0; $philhealth = 0.0; $pag_ibig = 0.0; $withholding_tax = 0.0;

            // Enforce only one payroll per employee per month.
            // If a payroll record already exists for this employee and month, skip.
            $alreadyHasPayroll = \App\Models\Payroll::where('employee_id', $employee->id)
                ->where('month', $payrollMonth)
                ->exists();
            if ($alreadyHasPayroll) {
                continue;
            }

            // Use the requested payroll date as the record date (normalized earlier),
            // ensuring it stays within the selected month.
            $payrollDateStr = $payrollDate->format('Y-m-d');

            // Skip employee if they have no timekeeping data for the month
            $hasTK = \App\Models\TimeKeeping::where('employee_id', $employee->id)
                ->where('date', 'like', $payrollMonth . '%')
                ->exists();

            if (!$hasTK) {
                continue;
            }

            // Fetch timekeeping summary via shared service (single source of truth)
            $tk = app(TimekeepingService::class)->computeMonthlySummary($employee->id, $payrollMonth);

            // Compute auxiliary monthly metrics for college-paid hours only (UI parity); do not use for T/U/OT/A
            $metrics = $this->computeMonthlyMetricsPHP($employee, $payrollMonth);
            $college_hours_metric = isset($metrics['college_paid_hours']) ? (float)$metrics['college_paid_hours'] : null;

            // Determine if college logic should apply and whether it's college-only vs multi-role
            // - Prefer presence of a college_rate value in employees table
            // - Also consider role text containing 'college instructor'
            $hasCollegeRate = isset($employee->college_rate) && $employee->college_rate !== null && floatval($employee->college_rate) > 0;
            $rolesStr = isset($employee->roles) && is_string($employee->roles) ? strtolower($employee->roles) : '';
            $hasCollegeRoleText = $rolesStr !== '' && strpos($rolesStr, 'college instructor') !== false;
            $isCollegeInstructor = $hasCollegeRate || $hasCollegeRoleText;
            $tokens = array_filter(array_map('trim', preg_split('/[,\n]+/', $rolesStr)));
            $isCollegeOnly = $hasCollegeRoleText && (!count($tokens) ? true : (count(array_filter($tokens, function($t){ return strpos($t, 'college instructor') !== false; })) === count($tokens)));
            $isCollegeMulti = $hasCollegeRoleText && !$isCollegeOnly;
            $isMultiRole = count($tokens) > 1; // any multi-role, not limited to college

            if ($isCollegeInstructor && $isCollegeOnly) {
                // College-only: pay by college schedule hours only, no T/U/OT; absences still reduce pay
                $college_rate = isset($employee->college_rate) ? floatval($employee->college_rate) : 0;
                // College-paid hours within college schedules only (no overtime)
                $total_hours_worked = isset($metrics['college_paid_hours'])
                    ? (float)$metrics['college_paid_hours']
                    : (isset($tk['total_hours']) ? (float)$tk['total_hours'] : 0);
                // Use unified TK metrics for parity
                $tardiness = (float)($tk['tardiness'] ?? 0);
                $undertime = (float)($tk['undertime'] ?? 0);
                $absences = max(0, (float)($tk['absences'] ?? 0));
                $overtime_hours = (float)($tk['overtime'] ?? 0);
                $weekday_ot = (float)($tk['overtime_count_weekdays'] ?? 0);
                $weekend_ot = (float)($tk['overtime_count_weekends'] ?? 0);
                // College instructors work by hourly schedule only: they should not have
                // tardiness, undertime, or overtime adjustments applied to gross pay.
                // Keep absences, which still reduce pay.
                $tardiness = 0;
                $undertime = 0;
                $overtime_hours = 0;
                $overtime_pay = 0; // explicitly ignore OT for college branch
                $honorarium = !is_null($employee->honorarium) ? floatval($employee->honorarium) : 0;

                // Statutory contributions: initialize numeric variables and read flags
                $sss = 0.0;
                $philhealth = 0.0;
                // Ensure numeric defaults for PAG-IBIG and withholding tax calculation
                $pag_ibig = $employee->pag_ibig ?? 0.0;
                // Previously this was taken directly from the employee boolean which resulted
                // in a fixed value (1). Instead compute withholding tax from the computed
                // gross pay and statutory contributions below.
                $withholding_tax = 0.0;

                // Gross pay: (college_rate * total_hours_worked)
                //          - (college_rate * tardiness)
                //          - (college_rate * undertime)
                //          - (college_rate * absences)
                //          + overtime_pay + honorarium
                $gross_pay = round(
                    ($college_rate * $total_hours_worked)
                        - ($college_rate * $tardiness)
                        - ($college_rate * $undertime)
                        - ($college_rate * $absences)
                        + $overtime_pay
                        + $honorarium,
                    2
                );

                // Debug trace for college computation (include both sources for comparison)
                Log::info('[Payroll Debug][College] Components', [
                    'employee_id' => $employee->id,
                    'month' => $payrollMonth,
                    'college_rate' => $college_rate,
                    'total_hours_worked' => $total_hours_worked,
                    'absences_hours' => $absences,
                    'absences_metrics' => isset($metrics['absences']) ? (float)$metrics['absences'] : null,
                    'absences_summary' => isset($tk['absences']) && is_numeric($tk['absences']) ? (float)$tk['absences'] : null,
                    'tardiness_hours' => 0,
                    'undertime_hours' => 0,
                    'overtime_pay' => 0,
                    'honorarium' => $honorarium,
                    'gross_pay' => $gross_pay,
                ]);

                // For record-keeping, set base_salary to employee's base_salary or 0 (not used in calculation)
                $base_salary = !is_null($employee->base_salary) ? $employee->base_salary : 0;

                // Compute SSS/PhilHealth amounts based on gross_pay and employee flags.
                if (!empty($employee->sss)) {
                    $sss = round($gross_pay * config('payroll.sss_rate', 0.045), 2);
                }
                if (!empty($employee->philhealth)) {
                    $philhealth = round($gross_pay * config('payroll.philhealth_rate', 0.035), 2);
                }

                // Compute withholding tax FROM GROSS PAY as total compensation
                // per request. Other contributions are computed separately.
                $withholding_tax = $gross_pay > 0 ? (function ($gross_pay) {
                    $totalComp = $gross_pay; // use gross pay directly
                    if ($totalComp <= 20832) return 0;
                    if ($totalComp <= 33332) return 0.15 * ($totalComp - 20833);
                    if ($totalComp <= 66666) return 1875 + 0.20 * ($totalComp - 33333);
                    if ($totalComp <= 166666) return 8541.80 + 0.25 * ($totalComp - 66667);
                    if ($totalComp <= 666666) return 33541.80 + 0.30 * ($totalComp - 166667);
                    return 183541.80 + 0.35 * ($totalComp - 666667);
                })($gross_pay) : 0;
            } elseif ($isCollegeInstructor && $isCollegeMulti) {
                // Multi-role with College Instructor:
                // Gross = Base Salary + College GSP + OT - non-college rate * (T+U+A) + honorarium
                $base_salary = isset($tk['base_salary']) ? (float)$tk['base_salary'] : (float)($employee->base_salary ?? 0);
                $college_rate = isset($employee->college_rate) ? (float)$employee->college_rate : 0.0;
                $college_hours = isset($metrics['college_paid_hours']) ? (float)$metrics['college_paid_hours'] : (float)($metrics['total_hours'] ?? 0);

                // Use unified TK metrics for parity
                $tardiness = (float)($tk['tardiness'] ?? 0);
                $undertime = (float)($tk['undertime'] ?? 0);
                $absences = (float)($tk['absences'] ?? 0);

                // Resolve non-college base rate per hour
                $rate_per_hour = isset($tk['rate_per_hour']) ? (float)$tk['rate_per_hour'] : 0.0;
                // OT buckets from TK summary (weekday/weekend only)
                $weekday_ot = (float)($tk['overtime_count_weekdays'] ?? 0);
                $weekend_ot = (float)($tk['overtime_count_weekends'] ?? 0);
                $obs_ot = (float)($tk['overtime_count_observances'] ?? 0);
                // Multi-role (college + another) includes observance OT at 2.0x using base rate
                $overtime_pay = round($rate_per_hour * ((0.25 * $weekday_ot) + (0.30 * $weekend_ot) + (2.0 * $obs_ot)), 2);

                $honorarium = !is_null($employee->honorarium) ? (float)$employee->honorarium : 0.0;
                $college_gsp = ($college_rate > 0 && $college_hours > 0) ? ($college_rate * $college_hours) : 0.0;
                $deductions = $rate_per_hour * ($tardiness + $undertime + $absences);

                $gross_pay = round($base_salary + $college_gsp + $overtime_pay - $deductions + $honorarium, 2);

                // Statutory contributions
                $sss = 0.0; $philhealth = 0.0; $pag_ibig = $employee->pag_ibig ?? 0.0; $withholding_tax = 0.0;
                if (!empty($employee->sss)) { $sss = round($gross_pay * config('payroll.sss_rate', 0.045), 2); }
                if (!empty($employee->philhealth)) { $philhealth = round($gross_pay * config('payroll.philhealth_rate', 0.035), 2); }
                $withholding_tax = $gross_pay > 0 ? (function ($gross_pay) {
                    $totalComp = $gross_pay; // use gross pay directly
                    if ($totalComp <= 20832) return 0;
                    if ($totalComp <= 33332) return 0.15 * ($totalComp - 20833);
                    if ($totalComp <= 66666) return 1875 + 0.20 * ($totalComp - 33333);
                    if ($totalComp <= 166666) return 8541.80 + 0.25 * ($totalComp - 66667);
                    if ($totalComp <= 666666) return 33541.80 + 0.30 * ($totalComp - 166667);
                    return 183541.80 + 0.35 * ($totalComp - 666667);
                })($gross_pay) : 0;
            } else {
                // Use all calculated values from timekeeping summary (default logic)
                $workHoursPerDay = $employee->work_hours_per_day ?? 8;
                $base_salary = isset($tk['base_salary']) ? $tk['base_salary'] : $employee->base_salary;
                $rate_per_hour = $tk['rate_per_hour'] ?? 0;
                // Use unified TK metrics
                $tardiness = (float)($tk['tardiness'] ?? 0);
                if (!empty($employee->work_start_time) && !empty($employee->work_end_time)) {
                    $start = strtotime($employee->work_start_time);
                    $end = strtotime($employee->work_end_time);
                    $workMinutes = $end - $start;
                    if ($workMinutes <= 0) $workMinutes += 24 * 60 * 60;
                    $workHoursPerDay = max(1, round(($workMinutes / 3600) - 1, 2)); // minus 1 hour for break
                }
                $undertime = (float)($tk['undertime'] ?? 0);
                $absences = (float)($tk['absences'] ?? 0);
                $overtime_hours = (float)($tk['overtime'] ?? 0);
                // Overtime pay from TK buckets: 0.25x weekdays, 0.30x weekends
                $weekday_ot = (float)($tk['overtime_count_weekdays'] ?? 0);
                $weekend_ot = (float)($tk['overtime_count_weekends'] ?? 0);
                $obs_ot = (float)($tk['overtime_count_observances'] ?? 0);
                // Any multi-role (e.g., Admin + Basic Ed) includes observance OT at 2.0x; single-role ignores it
                $overtime_pay = round((float)$rate_per_hour * ((0.25 * $weekday_ot) + (0.30 * $weekend_ot) + ($isMultiRole ? (2.0 * $obs_ot) : 0.0)), 2);

                $honorarium = !is_null($employee->honorarium) ? $employee->honorarium : 0;
                // Gross pay: (base_salary + overtime_pay) - (rate_per_hour * tardiness) - (rate_per_hour * undertime) - (rate_per_hour * absences) + honorarium

                $gross_pay = round(
                    ($base_salary + $overtime_pay)
                        - ($rate_per_hour * $tardiness)
                        - ($rate_per_hour * $undertime)
                        - ($rate_per_hour * $absences)
                        + $honorarium,
                    2
                );

                // Debug trace for admin computation to validate parity with UI
                Log::info('[Payroll Debug][Admin] Components', [
                    'employee_id' => $employee->id,
                    'month' => $payrollMonth,
                    'base_salary' => $base_salary,
                    'rate_per_hour' => $rate_per_hour,
                    'tardiness_hours' => $tardiness,
                    'undertime_hours' => $undertime,
                    'absences_hours' => $absences,
                    'weekday_ot_hours' => $weekday_ot,
                    'weekend_ot_hours' => $weekend_ot,
                    'overtime_pay' => $overtime_pay,
                    'honorarium' => $honorarium,
                    'gross_pay' => $gross_pay,
                ]);

                // Statutory contributions: compute numeric amounts based on flags
                $sss = 0.0;
                $philhealth = 0.0;
                $pag_ibig = $employee->pag_ibig;
                $withholding_tax = 0.0;

                if (!empty($employee->sss)) {
                    $sss = round($gross_pay * config('payroll.sss_rate', 0.045), 2);
                }
                if (!empty($employee->philhealth)) {
                    $philhealth = round($gross_pay * config('payroll.philhealth_rate', 0.035), 2);
                }

                $withholding_tax = $gross_pay > 0 ? (function ($gross_pay) {
                    $totalComp = $gross_pay; // use gross pay directly
                    if ($totalComp <= 20832) return 0;
                    if ($totalComp <= 33332) return 0.15 * ($totalComp - 20833);
                    if ($totalComp <= 66666) return 1875 + 0.20 * ($totalComp - 33333);
                    if ($totalComp <= 166666) return 8541.80 + 0.25 * ($totalComp - 66667);
                    if ($totalComp <= 666666) return 33541.80 + 0.30 * ($totalComp - 166667);
                    return 183541.80 + 0.35 * ($totalComp - 666667);
                })($gross_pay) : 0;
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
            // Note: Honorarium defined above based on role logic

            $salary_loan = !is_null($employee->salary_loan) ? $employee->salary_loan : 0;
            $calamity_loan = !is_null($employee->calamity_loan) ? $employee->calamity_loan : 0;
            $multipurpose_loan = !is_null($employee->multipurpose_loan) ? $employee->multipurpose_loan : 0;

            $total_deductions = (
                $sss + $philhealth + $pag_ibig + $withholding_tax
                + $sss_salary_loan + $sss_calamity_loan + $pagibig_multi_loan + $pagibig_calamity_loan
                + $peraa_con + $tuition + $china_bank + $tea // Honorarium is an earning, not deduction
                + $salary_loan + $calamity_loan + $multipurpose_loan
            );
            $net_pay = $gross_pay - $total_deductions;

            \Illuminate\Support\Facades\Log::info([
                'employee_id' => $employee->id,
                // ... (rest of loan/deduction logging)
            ]);

            $payrollData = [
                'employee_id' => $employee->id,
                'month' => $payrollMonth,
                'payroll_date' => $payrollDateStr,
                'base_salary' => $base_salary,
                // Only set college_rate for college instructors; otherwise force NULL
                'college_rate' => $isCollegeInstructor ? $college_rate : null,
                // Persist the computed college worked hours for this payroll period
                'college_worked_hours' => $isCollegeInstructor ? $college_hours_metric : null,
                'honorarium' => $honorarium,
                'overtime' => $overtime_hours,
                'tardiness' => $tardiness,
                'undertime' => $undertime,
                'absences' => $absences,
                'gross_pay' => $gross_pay,
                // Store NULL in the payroll record if the employee did not opt-in
                // for SSS/PhilHealth so the frontend can render a "-".
                'sss' => !empty($employee->sss) ? $sss : null,
                'philhealth' => !empty($employee->philhealth) ? $philhealth : null,
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

            // Optionally sync snapshot onto employees table for quick reference
            if ($isCollegeInstructor && $college_hours_metric !== null) {
                try {
                    $employee->college_worked_hours = $college_hours_metric;
                    $employee->save();
                } catch (\Throwable $e) {
                    \Log::warning('Failed to update employees.college_worked_hours: ' . $e->getMessage());
                }
            }
            $createdCount++;
        }

        if ($createdCount > 0) {
            // Audit log: payroll run
            try {
                $username = Auth::user()->username ?? 'system';
                \App\Models\AuditLogs::create([
                    'username'    => $username,
                    'action'      => 'run payroll',
                    'name'        => $payrollMonth,
                    'entity_type' => 'payroll',
                    'entity_id'   => null,
                    'details'     => json_encode(['month' => $payrollMonth, 'created_count' => $createdCount, 'payroll_date' => $request->payroll_date]),
                    'date'        => now('Asia/Manila'),
                ]);
            } catch (\Throwable $e) {
                Log::warning('Failed to write audit log for payroll run: ' . $e->getMessage());
            }
            return redirect()->back()->with('flash', [
                'type' => 'success',
                'message' => 'Payroll run successfully for ' . date('F Y', strtotime($payrollDateStr)) . '. Payroll records created: ' . $createdCount,
                'at' => now()->timestamp,
            ]);
        } else {
            // No new payrolls were created. Either all eligible employees already have payroll
            // for this month, or none have timekeeping data yet for this month.
            return redirect()->back()->with('flash', [
                'type' => 'info',
                'message' => 'No eligible employees to process payroll for this month.',
                'at' => now()->timestamp,
            ]);
        }
    }

    /**
     * Compute monthly metrics in PHP to mirror the Attendance Cards logic.
     */
    private function computeMonthlyMetricsPHP(Employees $employee, string $selectedMonth): array
    {
        // Helper to normalize day keys to mon..sun
        $normalizeDayKey = function ($raw) {
            $s = strtolower(trim((string)$raw));
            if ($s === 'monday' || $s === 'mon' || $s === '1') return 'mon';
            if ($s === 'tuesday' || $s === 'tue' || $s === '2') return 'tue';
            if ($s === 'wednesday' || $s === 'wed' || $s === '3') return 'wed';
            if ($s === 'thursday' || $s === 'thu' || $s === '4') return 'thu';
            if ($s === 'friday' || $s === 'fri' || $s === '5') return 'fri';
            if ($s === 'saturday' || $s === 'sat' || $s === '6') return 'sat';
            if ($s === 'sunday' || $s === 'sun' || $s === '0' || $s === '7') return 'sun';
            return $s;
        };

        // Build schedule map by weekday code (mon..sun). Support both workDays and college program schedules.
        // Structure: ['mon' => ['start'=>int|null,'end'=>int|null,'durationMin'=>int,'noTimes'=>bool,'extraCollegeDurMin'=>int]]
        $schedByCode = [];

        // Time-based schedules from workDays (include role to detect college windows)
        $workDays = $employee->workDays()->get(['day', 'work_start_time', 'work_end_time', 'role']);
        $collegeTimesByCode = [];
        $collegeExtraMinByCode = [];
        foreach ($workDays as $wd) {
            $start = $this->hmToMin($wd->work_start_time);
            $end = $this->hmToMin($wd->work_end_time);
            if ($start === null || $end === null) continue;
            $raw = $this->diffMin($start, $end);
            $durationMin = max(0, $raw - 60); // minus 1 hour break
            $code = $normalizeDayKey($wd->day);
            $roleStr = strtolower(trim((string)($wd->role ?? '')));
            $isCollegeRole = strpos($roleStr, 'college instructor') !== false;
            if (!isset($schedByCode[$code])) {
                $schedByCode[$code] = ['start' => $start, 'end' => $end, 'durationMin' => $durationMin, 'noTimes' => false, 'extraCollegeDurMin' => 0, 'isCollege' => $isCollegeRole];
            } else {
                // Merge overlapping time-based schedules by expanding window and recomputing duration
                $prev = $schedByCode[$code];
                $mergedStart = min($prev['start'], $start);
                $mergedEnd = max($prev['end'], $end);
                $mergedRaw = $this->diffMin($mergedStart, $mergedEnd);
                $mergedDuration = max(0, $mergedRaw - 60);
                $schedByCode[$code] = ['start' => $mergedStart, 'end' => $mergedEnd, 'durationMin' => $mergedDuration, 'noTimes' => false, 'extraCollegeDurMin' => $prev['extraCollegeDurMin'] ?? 0, 'isCollege' => (bool)($prev['isCollege'] ?? false) || $isCollegeRole];
            }
            if ($isCollegeRole) {
                $collegeTimesByCode[$code] = ['start' => $start, 'end' => $end, 'durationMin' => $durationMin];
            }
        }

        // College schedules (hours only, no start/end)
        $collegeScheds = $employee->collegeProgramSchedules()->get(['day', 'hours_per_day']);
        foreach ($collegeScheds as $cs) {
            $code = $normalizeDayKey($cs->day);
            $mins = (int) round(max(0, (float)$cs->hours_per_day) * 60);
            if (!isset($schedByCode[$code])) {
                // Create a no-times schedule using hours only
                $schedByCode[$code] = ['start' => null, 'end' => null, 'durationMin' => $mins, 'noTimes' => true, 'extraCollegeDurMin' => 0, 'isCollege' => true];
            } else {
                // Computation safeguard: collapse duplicate college hours per weekday by MAX, not SUM
                $prev = $schedByCode[$code];
                if (!empty($prev['noTimes'])) {
                    $prev['durationMin'] = max((int)($prev['durationMin'] ?? 0), $mins);
                } else {
                    $prevExtra = isset($prev['extraCollegeDurMin']) ? (int)$prev['extraCollegeDurMin'] : 0;
                    $prev['extraCollegeDurMin'] = max($prevExtra, $mins);
                }
                $schedByCode[$code] = $prev;
            }
            // Track extra college minutes for college-paid-hours computation (also MAX per weekday)
            $collegeExtraMinByCode[$code] = isset($collegeExtraMinByCode[$code])
                ? max((int)$collegeExtraMinByCode[$code], $mins)
                : $mins;
        }

        // Records by date
        $records = \App\Models\TimeKeeping::where('employee_id', $employee->id)
            ->where('date', 'like', $selectedMonth . '%')
            ->get(['date', 'clock_in', 'clock_out']);
        $recMap = [];
        foreach ($records as $r) {
            $recMap[$r->date] = [
                'clock_in' => $r->clock_in,
                'clock_out' => $r->clock_out,
            ];
        }

        // Observances for the month
        $obsArr = \App\Models\Observance::where('date', 'like', $selectedMonth . '%')->get(['date', 'type', 'label', 'start_time']);
        $obsMap = [];
        foreach ($obsArr as $o) {
            $d = substr((string)$o->date, 0, 10);
            $obsMap[$d] = ['type' => $o->type ?: $o->label, 'start_time' => $o->start_time ? $o->start_time->format('H:i') : null];
        }

        [$y, $m] = array_map('intval', explode('-', $selectedMonth));
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $m, $y);

    $tardMin = 0; $underMin = 0; $absentMin = 0; $otMin = 0; $otWeekdayMin = 0; $otWeekendMin = 0; $otObservanceMin = 0; $totalWorkedMin = 0; $collegePaidMin = 0;

    // Role flags for college handling parity with frontend
    $rolesStr = strtolower((string)($employee->roles ?? ''));
    $tokens = array_filter(array_map('trim', preg_split('/[,\n]+/', $rolesStr)));
    $hasCollege = strpos($rolesStr, 'college instructor') !== false;
    $isCollegeOnly = $hasCollege && (count($tokens) > 0 ? (count(array_filter($tokens, function($t){ return strpos($t, 'college instructor') !== false; })) === count($tokens)) : true);
    $isCollegeMulti = $hasCollege && !$isCollegeOnly;

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $dateStr = sprintf('%04d-%02d-%02d', $y, $m, $day);
            $d = new \DateTime($dateStr . ' 00:00:00');
            $code = ['sun','mon','tue','wed','thu','fri','sat'][(int)$d->format('w')];
            $sched = $schedByCode[$code] ?? null;
            $rec = $recMap[$dateStr] ?? null;
            $timeIn = $this->parseClock($rec['clock_in'] ?? null);
            $timeOut = $this->parseClock($rec['clock_out'] ?? null);
            $hasBoth = ($timeIn !== null && $timeOut !== null);

            if ($sched) {
                $workedRaw = $hasBoth ? $this->diffMin($timeIn, $timeOut) : 0;
                $obs = $obsMap[$dateStr] ?? null;
                $obsType = $obs && isset($obs['type']) ? strtolower((string)$obs['type']) : '';

                // Whole-day or half-day observances: if worked, add as OT (observance), else skip expectations
                if (strpos($obsType, 'whole') !== false) {
                    $workedMinusBreak = $hasBoth ? max(0, $workedRaw - 60) : 0;
                    $totalWorkedMin += $workedMinusBreak;
                    if ($hasBoth) { $otMin += $workedMinusBreak; $otObservanceMin += $workedMinusBreak; }
                    continue;
                }
                if (strpos($obsType, 'half') !== false) {
                    $workedMinusBreak = $hasBoth ? max(0, $workedRaw - 60) : 0;
                    $totalWorkedMin += $workedMinusBreak;
                    if ($hasBoth) { $otMin += $workedMinusBreak; $otObservanceMin += $workedMinusBreak; }
                    continue;
                }

                // If schedule is hours-only (noTimes), treat expected as durationMin
                if (!empty($sched['noTimes'])) {
                    $expected = (int)($sched['durationMin'] ?? 0);
                    $workedMinusBreak = $hasBoth ? max(0, $workedRaw - 60) : 0;
                    if (!$hasBoth) { $absentMin += $expected; continue; }
                    $totalWorkedMin += $workedMinusBreak;
                    // College-paid hours for college schedules without explicit times: cap by expected
                    $collegePaidMin += min($workedMinusBreak, $expected);
                    if ($hasCollege) {
                        $deficit = max(0, $expected - $workedMinusBreak);
                        $absentMin += $deficit;
                    } else {
                        $under = max(0, $expected - $workedMinusBreak);
                        $underMin += $under;
                    }
                    continue;
                }

                // Time-based default
                $workedMinusBreak = $hasBoth ? max(0, $workedRaw - 60) : 0;
                $totalWorkedMin += $workedMinusBreak;

                // If no clock records, count full expected as absence
                if (!$hasBoth) {
                    $expected = (int)($sched['durationMin'] ?? 0);
                    // In multi-role, if there is extra college duration, raise expectation
                    if ($isCollegeMulti && isset($sched['extraCollegeDurMin']) && $sched['extraCollegeDurMin'] > 0) {
                        $expected = max($expected, (int)$sched['extraCollegeDurMin']);
                    }
                    $absentMin += $expected;
                    continue;
                }

                // Compute College/GSP paid minutes within schedule windows and extra college-only minutes
                // Overlap with explicit college time window for the day, including lunch deduction if crossing 1 PM
                $cSpec = $collegeTimesByCode[$code] ?? null;
                $paidTodayForCollege = 0;
                if ($cSpec) {
                    // Overlap between [timeIn,timeOut] and [cSpec.start,cSpec.end] with overnight handling
                    $in1 = $timeIn; $out1 = $timeOut; $s1 = (int)$cSpec['start']; $e1 = (int)$cSpec['end'];
                    if ($out1 <= $in1) $out1 += 24 * 60;
                    if ($e1 <= $s1) $e1 += 24 * 60;
                    $left = max($in1, $s1);
                    $right = min($out1, $e1);
                    $overlap = max(0, $right - $left);
                    // Deduct lunch if overlap portion crosses 13:00
                    $fixedBreakEnd = 13 * 60; // 13:00
                    $outNorm = ($timeOut <= $timeIn) ? $timeOut + 24 * 60 : $timeOut;
                    $endNorm = ($cSpec['end'] <= $cSpec['start']) ? $cSpec['end'] + 24 * 60 : $cSpec['end'];
                    $overlapEndCandidate = min($outNorm, $endNorm);
                    if ($overlap > 0 && $overlapEndCandidate > $fixedBreakEnd) {
                        $overlap = max(0, $overlap - 60);
                    }
                    $paidTodayForCollege = min($overlap, (int)$cSpec['durationMin']);
                    $collegePaidMin += $paidTodayForCollege;
                }
                // Extra minutes from college schedules without explicit times
                $extra = (int)($collegeExtraMinByCode[$code] ?? 0);
                if ($extra > 0) {
                    $remain = max(0, $workedMinusBreak - $paidTodayForCollege);
                    $collegePaidMin += min($remain, $extra);
                }

                if ($hasCollege && ($isCollegeOnly || ($isCollegeMulti && ((int)($sched['extraCollegeDurMin'] ?? 0)) > (int)($sched['durationMin'] ?? 0)))) {
                    $expected = (int)($sched['durationMin'] ?? 0);
                    if ($isCollegeMulti && isset($sched['extraCollegeDurMin']) && $sched['extraCollegeDurMin'] > 0) {
                        $expected = max($expected, (int)$sched['extraCollegeDurMin']);
                    }
                    $deficit = max(0, $expected - $workedMinusBreak);
                    $absentMin += $deficit;
                    if (!$isCollegeOnly) {
                        $over = max(0, $workedMinusBreak - $expected);
                        $otMin += $over; $otWeekdayMin += $over;
                    }
                    continue;
                }

                // Non-college: standard tardiness/undertime/OT
                $tard = max(0, $timeIn - (int)$sched['start']);
                $under = max(0, (int)$sched['end'] - $timeOut);
                $over = max(0, $workedMinusBreak - (int)$sched['durationMin']);
                $tardMin += $tard; $underMin += $under; $otMin += $over; $otWeekdayMin += $over;
            } else {
                // Non-scheduled day (weekend/off)
                if ($hasBoth) {
                    $workedRaw = $this->diffMin($timeIn, $timeOut);
                    $workedMinusBreak = max(0, $workedRaw - 60);
                    $totalWorkedMin += $workedMinusBreak;
                    if (!$isCollegeOnly) { $otMin += $workedMinusBreak; $otWeekendMin += $workedMinusBreak; }
                }
            }
        }

        $toH = function ($min) { return round($min / 60, 2); };
        return [
            'tardiness' => $toH($tardMin),
            'undertime' => $toH($underMin),
            'overtime' => $toH($otMin),
            'absences' => $toH($absentMin),
            'overtime_count_weekdays' => $toH($otWeekdayMin),
            'overtime_count_weekends' => $toH($otWeekendMin),
            'overtime_count_observances' => $toH($otObservanceMin),
            'total_hours' => $toH($totalWorkedMin),
            'college_paid_hours' => $toH($collegePaidMin),
        ];
    }

    private function hmToMin($time): ?int
    {
        if (!$time) return null;
        $parts = explode(':', (string)$time);
        if (count($parts) < 2) return null;
        $h = intval($parts[0]); $m = intval($parts[1]);
        return $h * 60 + $m;
    }

    private function diffMin(int $startMin, int $endMin): int
    {
        $d = $endMin - $startMin;
        if ($d <= 0) $d += 24 * 60; // overnight handling
        return $d;
    }

    private function parseClock($raw): ?int
    {
        if (!$raw) return null;
        $s = trim((string)$raw);
        if ($s === '-' || $s === '') return null;
        if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)$/i', $s, $m)) {
            $h = intval($m[1]); $mi = intval($m[2]); $ap = strtoupper($m[3]);
            if ($ap === 'PM' && $h < 12) $h += 12;
            if ($ap === 'AM' && $h === 12) $h = 0;
            return $h * 60 + $mi;
        }
        if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $s, $m)) {
            return intval($m[1]) * 60 + intval($m[2]);
        }
        return null;
    }

    /**
     * Calculates the prorated 13th Month Pay based on the formula: 
     * (Sum of Adjusted Monthly Basic Salaries) / 12.
     * The Adjusted Monthly Basic Salary = Base Salary - (Lates + Absences).
     *
     * @param \App\Models\Employees $employee
     * @param \Carbon\Carbon $payrollDate The date of the current payroll run.
     * @return float
     */
    private function calculate13thMonthPay(Employees $employee, int $currentYear, int $monthCount): float
    {
        $totalAdjustedBasicSalary = 0.0;
        $work_hours_per_day = $employee->work_hours_per_day ?? 8;

        // Loop from January to the selected cutoff month
        for ($month = 1; $month <= $monthCount; $month++) {
            $monthString = $currentYear . '-' . str_pad($month, 2, '0', STR_PAD_LEFT);

            $monthlyPayrollRecords = \App\Models\Payroll::where('employee_id', $employee->id)
                ->where('month', $monthString)
                ->get();

            if ($monthlyPayrollRecords->isEmpty()) {
                continue;
            }

            $baseSalaryForMonth = $monthlyPayrollRecords->sum('base_salary');
            $tardinessHours = $monthlyPayrollRecords->sum('tardiness');
            $absenceHours = $monthlyPayrollRecords->sum('absences');

            // --- UNIFIED HOURLY RATE FORMULA ---
            // This formula now exactly matches your TimeKeepingController.
            $rate_per_day = ($baseSalaryForMonth * 12) / 288;
            $hourlyRate = ($work_hours_per_day > 0) ? ($rate_per_day / $work_hours_per_day) : 0;
            // --- END UNIFIED FORMULA ---

            // // --- DEBUG BLOCK ---
            // dd([
            //     '--Inputs--' => '---------------------------',
            //     'Base Salary Used' => $baseSalaryForMonth,
            //     'Employee Work Hours/Day' => $work_hours_per_day,
            //     '--Calculation--' => '-------------------------',
            //     'Formula Step 1 (Rate Per Day)' => "($baseSalaryForMonth * 12) / 288 = $rate_per_day",
            //     'Formula Step 2 (Hourly Rate)' => "$rate_per_day / $work_hours_per_day = $hourlyRate",
            //     '--Final Value--' => '--------------------------',
            //     'FINAL CALCULATED HOURLY RATE' => $hourlyRate,
            // ]);
            // // --- END DEBUG BLOCK ---

            $totalDeductionsForMonth = ($tardinessHours + $absenceHours) * $hourlyRate;
            $adjustedMonthlyBasicSalary = $baseSalaryForMonth - $totalDeductionsForMonth;

            $totalAdjustedBasicSalary += max(0, $adjustedMonthlyBasicSalary);
        }

        $thirteenthMonthPay = round($totalAdjustedBasicSalary / 12, 2);

        return $thirteenthMonthPay;
    }

    public function run13thMonthPay(Request $request)
    {
        $request->validate([
            'cutoff_month' => 'required|integer|min:1|max:12',
        ]);

        $cutoffMonth = (int)$request->cutoff_month;
        $currentYear = date('Y');

        // --- IMPROVED VALIDATION BLOCK START ---
        // We only need to check for previous months if the selection is after January.
        if ($cutoffMonth > 1) {
            // We need to verify the completeness of all months PRIOR to the cutoff month.
            $lastMonthToVerify = $cutoffMonth - 1;

            // Count how many distinct months have been processed within that range.
            $processedMonthCount = \App\Models\Payroll::where('month', '>=', $currentYear . '-01')
                ->where('month', '<=', $currentYear . '-' . str_pad($lastMonthToVerify, 2, '0', STR_PAD_LEFT))
                ->distinct()
                ->count('month');

            // If the number of processed months is less than the number we need to verify, then records are missing.
            if ($processedMonthCount < $lastMonthToVerify) {
                $lastMonthName = Carbon::create($currentYear, $lastMonthToVerify)->format('F');
                return redirect()->back()->withErrors(['message' => "Cannot process. Payroll records from January to {$lastMonthName} are incomplete."]);
            }
        }
        // --- IMPROVED VALIDATION BLOCK END ---

        $monthString = $currentYear . '-' . str_pad($cutoffMonth, 2, '0', STR_PAD_LEFT);
        $lastPayrollInMonth = \App\Models\Payroll::where('month', $monthString)
            ->orderBy('payroll_date', 'desc')
            ->first();

        if (!$lastPayrollInMonth) {
            $monthName = Carbon::parse($monthString)->format('F, Y');
            return redirect()->back()->withErrors(['message' => "Cannot run 13th month pay. No payroll has been processed for {$monthName} yet."]);
        }

        $payrollDate = Carbon::parse($lastPayrollInMonth->payroll_date);
        $employees = \App\Models\Employees::all();
        $createdCount = 0;

        foreach ($employees as $employee) {
            $thirteenthMonthPay = $this->calculate13thMonthPay($employee, $currentYear, $cutoffMonth);

            if ($thirteenthMonthPay <= 0) {
                continue;
            }

            $payrollRecordToUpdate = \App\Models\Payroll::where('employee_id', $employee->id)
                ->where('payroll_date', $payrollDate->format('Y-m-d'))
                ->first();

            if ($payrollRecordToUpdate) {
                $payrollRecordToUpdate->thirteenth_month_pay = ($payrollRecordToUpdate->thirteenth_month_pay ?? 0) + $thirteenthMonthPay;
                $payrollRecordToUpdate->gross_pay += $thirteenthMonthPay;
                $payrollRecordToUpdate->net_pay += $thirteenthMonthPay;
                $payrollRecordToUpdate->save();
                $createdCount++;
            }
        }

        // Audit log: 13th month pay run
        try {
            $username = Auth::user()->username ?? 'system';
            \App\Models\AuditLogs::create([
                'username'    => $username,
                'action'      => 'run 13th month pay',
                'name'        => $payrollDate->format('Y-m-d'),
                'entity_type' => 'payroll',
                'entity_id'   => null,
                'details'     => json_encode(['cutoff_month' => $cutoffMonth, 'year' => $currentYear, 'updated_employees' => $createdCount]),
                'date'        => now('Asia/Manila'),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to write audit log for 13th month pay run: ' . $e->getMessage());
        }

        return redirect()->back()->with('flash', ['message' => '13th Month Pay has been added to the payroll of ' . $payrollDate->format('F d, Y') . ' for ' . $createdCount . ' employees.']);
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
     * Get months that have processed payroll records only (payroll table months), sorted descending.
     */
    public function getProcessedPayrollMonths(Request $request): JsonResponse
    {
        $payrollMonths = \App\Models\Payroll::orderBy('month', 'desc')
            ->pluck('month')
            ->filter()
            ->unique()
            ->values();

        return response()->json([
            'success' => true,
            'months' => $payrollMonths,
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
        $payrollsArray = $payrolls->map(function ($payroll) {
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

    public function export(Request $request)
    {
        // Validate that the month parameter is present and is a valid date format
        $request->validate([
            'month' => 'required|date_format:Y-m',
        ]);

        // Parse the month from the request
        $month = Carbon::createFromFormat('Y-m', $request->input('month'));

        // Generate a filename based on the selected month
        $fileName = 'payroll-ledger-' . $month->format('Y-m') . '.xlsx';

        // Audit log: export payroll ledger
        try {
            $username = Auth::user()->username ?? 'system';
            \App\Models\AuditLogs::create([
                'username'    => $username,
                'action'      => 'export payroll ledger',
                'name'        => $month->format('Y-m'),
                'entity_type' => 'payroll',
                'entity_id'   => null,
                'details'     => json_encode(['month' => $month->format('Y-m')]),
                'date'        => now('Asia/Manila'),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to write audit log for payroll export: ' . $e->getMessage());
        }

        // Pass the selected month to your Excel export class
        return Excel::download(new PayrollExport($month), $fileName);
    }

    /**
     * Update adjustments for a payroll in a given month. Requires that a payroll
     * has already been processed for that employee in the selected month.
     * Expects: employee_id (int), month (YYYY-MM), amount (numeric), type (add|deduct)
     */
    public function updateAdjustment(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,id',
            'month' => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'amount' => 'required|numeric',
            'type' => 'required|in:add,deduct',
        ]);

        $employeeId = $validated['employee_id'];
        $month = $validated['month'];

        // Find the latest payroll record for that employee and month
        $payroll = Payroll::where('employee_id', $employeeId)
            ->where('month', $month)
            ->orderBy('payroll_date', 'desc')
            ->first();

        if (!$payroll) {
            return response()->json([
                'success' => false,
                'message' => 'No processed payroll found for the selected month. Please process payroll first.'
            ], 422);
        }

        $amount = (float) $validated['amount'];
        if ($validated['type'] === 'deduct') {
            $amount = -abs($amount);
        } else {
            $amount = abs($amount);
        }

        // Ensure adjustments column exists on the model (defensive)
        if (!array_key_exists('adjustments', $payroll->getAttributes())) {
            // If adjustments column is missing, return 500 with clear message
            return response()->json([
                'success' => false,
                'message' => 'Payroll adjustments column is not available on payroll records.'
            ], 500);
        }

        $payroll->adjustments = ($payroll->adjustments ?? 0) + $amount;
        $payroll->gross_pay = ($payroll->gross_pay ?? 0) + $amount;
        $payroll->net_pay = ($payroll->net_pay ?? 0) + $amount;
        $payroll->save();

        // Audit log: payroll adjustment
        try {
            $username = Auth::user()->username ?? 'system';
            \App\Models\AuditLogs::create([
                'username'    => $username,
                'action'      => 'payroll adjustment',
                'name'        => 'Employee #' . $employeeId,
                'entity_type' => 'payroll',
                'entity_id'   => $payroll->id,
                'details'     => json_encode(['employee_id' => $employeeId, 'month' => $month, 'amount' => $amount, 'type' => $validated['type']]),
                'date'        => now('Asia/Manila'),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to write audit log for payroll adjustment: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Adjustment applied successfully.',
            'payroll' => $payroll,
        ]);
    }
}
