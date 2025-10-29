<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Models\Payroll;
use App\Models\Salary;
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
            return redirect()->back()->with('flash', ['type' => 'error', 'message' => 'No TimeKeeping Record found for this month']);
        }
        $createdCount = 0;
        foreach ($employees as $employee) {
            // Reset branch-scoped variables per employee to avoid bleed-over between iterations
            $college_rate = null;
            $overtime_hours = 0; $tardiness = 0; $undertime = 0; $absences = 0; $overtime_pay = 0;
            $honorarium = 0; $base_salary = 0; $sss = 0.0; $philhealth = 0.0; $pag_ibig = 0.0; $withholding_tax = 0.0;

            $existingPayrolls = \App\Models\Payroll::where('employee_id', $employee->id)
                ->where('month', $payrollMonth)
                ->get();
            if ($existingPayrolls->count() >= 2) {
                // Already run twice for this month
                continue;
            }
            // Decide target payroll date for this run:
            // - If no payroll yet: use 15th of the month
            // - If one payroll exists: use the last day of the month
            // - Prevent duplicate same-day entries
            $firstHalfDate = Carbon::createFromFormat('Y-m-d', $payrollMonth . '-15');
            $lastDayDate   = Carbon::createFromFormat('Y-m-d', $payrollMonth . '-' . str_pad($payrollDate->endOfMonth()->day, 2, '0', STR_PAD_LEFT));
            $existingDates = collect($existingPayrolls)->pluck('payroll_date')->map(fn($d) => Carbon::parse($d)->format('Y-m-d'))->toArray();
            if ($existingPayrolls->count() === 0) {
                $payrollDateStr = $firstHalfDate->format('Y-m-d');
            } else {
                $payrollDateStr = $lastDayDate->format('Y-m-d');
            }
            if (in_array($payrollDateStr, $existingDates, true)) {
                // If computed date collides (edge case), fallback to actual parsed day
                $payrollDateStr = $payrollDate->format('Y-m-d');
                if (in_array($payrollDateStr, $existingDates, true)) {
                    continue; // still duplicate
                }
            }

            // Skip employee if they have no timekeeping data for the month
            $hasTK = \App\Models\TimeKeeping::where('employee_id', $employee->id)
                ->where('date', 'like', $payrollMonth . '%')
                ->exists();

            if (!$hasTK) {
                continue;
            }

            // Fetch timekeeping summary (used only as secondary source for some rate fields)
            $summary = app(TimeKeepingController::class)->monthlySummary(new \Illuminate\Http\Request([
                'employee_id' => $employee->id,
                'month' => $payrollMonth
            ]));
            $summaryData = $summary->getData(true);

            // Compute monthly metrics using the same logic as Attendance Cards
            $metrics = $this->computeMonthlyMetricsPHP($employee, $payrollMonth);

            // Determine if college logic should apply:
            // - Prefer presence of a college_rate value in employees table
            // - Also consider role text containing 'college' for backward compatibility
            $hasCollegeRate = isset($employee->college_rate) && $employee->college_rate !== null && floatval($employee->college_rate) > 0;
            $hasCollegeRoleText = isset($employee->roles) && is_string($employee->roles) && stripos($employee->roles, 'college') !== false;
            $isCollegeInstructor = $hasCollegeRate || $hasCollegeRoleText;

            if ($isCollegeInstructor) {
                // Use college_rate for all calculations
                $college_rate = isset($employee->college_rate) ? floatval($employee->college_rate) : 0;
                $total_hours_worked = $metrics['total_hours'];
                $tardiness = $metrics['tardiness'];
                $undertime = $metrics['undertime'];
                $absences = $metrics['absences'];
                $overtime_hours = $metrics['overtime'];
                $weekday_ot = $metrics['overtime_count_weekdays'];
                $weekend_ot = $metrics['overtime_count_weekends'];
                $overtime_pay = isset($summaryData['overtime_pay_total']) ? floatval($summaryData['overtime_pay_total']) : 0;
                // If overtime_pay is zero but hours exist, compute manually (match frontend logic)
                if ($overtime_pay == 0 && $overtime_hours > 0) {
                    if ($weekday_ot > 0 || $weekend_ot > 0) {
                        $overtime_pay = ($college_rate * 0.25 * $weekday_ot) + ($college_rate * 0.30 * $weekend_ot);
                    } else {
                        $overtime_pay = $college_rate * 0.25 * $overtime_hours;
                    }
                }
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

                // Gross pay: (college_rate * total_hours_worked) - (college_rate * tardiness) - (college_rate * undertime) - (college_rate * absences) + overtime_pay + honorarium
                $gross_pay = round(
                    ($college_rate * $total_hours_worked)
                        - ($college_rate * $tardiness)
                        - ($college_rate * $undertime)
                        - ($college_rate * $absences)
                        + $overtime_pay
                        + $honorarium,
                    2
                );

                // For record-keeping, set base_salary to employee's base_salary or 0 (not used in calculation)
                $base_salary = !is_null($employee->base_salary) ? $employee->base_salary : 0;

                // Compute SSS/PhilHealth amounts based on gross_pay and employee flags.
                if (!empty($employee->sss)) {
                    $sss = round($gross_pay * config('payroll.sss_rate', 0.045), 2);
                }
                if (!empty($employee->philhealth)) {
                    $philhealth = round($gross_pay * config('payroll.philhealth_rate', 0.035), 2);
                }

                // Compute withholding tax for college instructors using the same
                // progressive bracket logic applied to other employee types.
                $withholding_tax = $gross_pay > 0 ? (function ($gross_pay, $sss, $pag_ibig, $philhealth) {
                    $totalComp = $gross_pay - ($sss + $pag_ibig + $philhealth);
                    if ($totalComp <= 20832) return 0;
                    if ($totalComp <= 33332) return 0.15 * ($totalComp - 20833);
                    if ($totalComp <= 66666) return 1875 + 0.20 * ($totalComp - 33333);
                    if ($totalComp <= 166666) return 8541.80 + 0.25 * ($totalComp - 66667);
                    if ($totalComp <= 666666) return 33541.80 + 0.30 * ($totalComp - 166667);
                    return 183541.80 + 0.35 * ($totalComp - 666667);
                })($gross_pay, $sss, $pag_ibig, $philhealth) : 0;
            } else {
                // Use all calculated values from timekeeping summary (default logic)
                $workHoursPerDay = $employee->work_hours_per_day ?? 8;
                $base_salary = isset($summaryData['base_salary']) ? $summaryData['base_salary'] : $employee->base_salary;
                $rate_per_hour = $summaryData['rate_per_hour'] ?? 0;
                // Source attendance metrics from the same logic used by Attendance Cards
                $tardiness = $metrics['tardiness'];
                if (!empty($employee->work_start_time) && !empty($employee->work_end_time)) {
                    $start = strtotime($employee->work_start_time);
                    $end = strtotime($employee->work_end_time);
                    $workMinutes = $end - $start;
                    if ($workMinutes <= 0) $workMinutes += 24 * 60 * 60;
                    $workHoursPerDay = max(1, round(($workMinutes / 3600) - 1, 2)); // minus 1 hour for break
                }
                $undertime = $metrics['undertime'];
                $absences = $metrics['absences'];
                $overtime_hours = $metrics['overtime'];
                $overtime_pay = isset($summaryData['overtime_pay_total']) ? floatval($summaryData['overtime_pay_total']) : 0;

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

                $withholding_tax = $gross_pay > 0 ? (function ($gross_pay, $sss, $pag_ibig, $philhealth) {
                    $totalComp = $gross_pay - ($sss + $pag_ibig + $philhealth);
                    if ($totalComp <= 20832) return 0;
                    if ($totalComp <= 33332) return 0.15 * ($totalComp - 20833);
                    if ($totalComp <= 66666) return 1875 + 0.20 * ($totalComp - 33333);
                    if ($totalComp <= 166666) return 8541.80 + 0.25 * ($totalComp - 66667);
                    if ($totalComp <= 666666) return 33541.80 + 0.30 * ($totalComp - 166667);
                    return 183541.80 + 0.35 * ($totalComp - 666667);
                })($gross_pay, $sss, $pag_ibig, $philhealth) : 0;
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
            return redirect()->back()->with('flash', 'Payroll run successfully for ' . date('F Y', strtotime($payrollDateStr)) . '. Payroll records created: ' . $createdCount);
        } else {
            return redirect()->back()->with('flash', 'Payroll already run twice for this month.');
        }
    }

    /**
     * Compute monthly metrics in PHP to mirror the Attendance Cards logic.
     */
    private function computeMonthlyMetricsPHP(Employees $employee, string $selectedMonth): array
    {
        // Build schedule map by weekday code (mon..sun)
        $workDays = $employee->workDays()->get(['day', 'work_start_time', 'work_end_time']);
        $schedByCode = [];
        foreach ($workDays as $wd) {
            $start = $this->hmToMin($wd->work_start_time);
            $end = $this->hmToMin($wd->work_end_time);
            if ($start === null || $end === null) continue;
            $raw = $this->diffMin($start, $end);
            $durationMin = max(0, $raw - 60); // minus 1 hour break
            $schedByCode[strtolower($wd->day)] = ['start' => $start, 'end' => $end, 'durationMin' => $durationMin];
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

        $tardMin = 0; $underMin = 0; $absentMin = 0; $otMin = 0; $otWeekdayMin = 0; $otWeekendMin = 0; $totalWorkedMin = 0;

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

                if (strpos($obsType, 'whole') !== false) {
                    $workedMinusBreak = $hasBoth ? max(0, $workedRaw - 60) : 0;
                    $totalWorkedMin += $workedMinusBreak;
                    if ($hasBoth) {
                        $otMin += $workedMinusBreak;
                        $otWeekendMin += $workedMinusBreak;
                    }
                    continue;
                }

                if (strpos($obsType, 'half') !== false) {
                    $suspMin = $this->hmToMin($obs['start_time'] ?? null);
                    if ($suspMin === null) $suspMin = 12 * 60; // default 12:00
                    $expectedEnd = max($sched['start'], min($suspMin, $sched['end']));
                    $expectedDuration = max(0, $expectedEnd - $sched['start']);

                    if (!$hasBoth) {
                        $absentMin += $expectedDuration;
                        continue;
                    }

                    $totalWorkedMin += $workedRaw; // no lunch deduction for half-day expectation
                    $tard = max(0, $timeIn - $sched['start']);
                    $under = max(0, $expectedEnd - $timeOut);
                    $over = max(0, $timeOut - max($timeIn, $expectedEnd));

                    $tardMin += $tard; $underMin += $under; $otMin += $over; $otWeekdayMin += $over;
                    continue;
                }

                // Default or rainy-day
                $workedMinusBreak = $hasBoth ? max(0, $workedRaw - 60) : 0;
                $totalWorkedMin += $workedMinusBreak;

                if (!$hasBoth) {
                    $absentMin += $sched['durationMin'];
                    continue;
                }

                if (strpos($obsType, 'rainy') !== false) {
                    $graceEnd = $sched['start'] + 60;
                    $tard = ($timeIn <= $graceEnd) ? 0 : max(0, $timeIn - $sched['start']);
                    $under = max(0, $sched['end'] - $timeOut);
                    $over = max(0, $workedMinusBreak - $sched['durationMin']);
                    $tardMin += $tard; $underMin += $under; $otMin += $over; $otWeekdayMin += $over;
                } else {
                    $tard = max(0, $timeIn - $sched['start']);
                    $under = max(0, $sched['end'] - $timeOut);
                    $over = max(0, $workedMinusBreak - $sched['durationMin']);
                    $tardMin += $tard; $underMin += $under; $otMin += $over; $otWeekdayMin += $over;
                }
            } else {
                // Non-scheduled day (weekend/off)
                if ($hasBoth) {
                    $workedRaw = $this->diffMin($timeIn, $timeOut);
                    $workedMinusBreak = max(0, $workedRaw - 60);
                    $totalWorkedMin += $workedMinusBreak;
                    $otMin += $workedMinusBreak;
                    $otWeekendMin += $workedMinusBreak;
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
            'total_hours' => $toH($totalWorkedMin),
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
