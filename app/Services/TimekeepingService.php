<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class TimekeepingService
{
    /**
     * Compute timekeeping monthly summary for a given employee and month (YYYY-MM).
     * Returns the same data shape used by TimeKeepingController::monthlySummary()
     * but as a plain array (no Response object).
     */
    public function computeMonthlySummary(int $employeeId, string $month): array
    {
        $employee = \App\Models\Employees::find($employeeId);
        if (!$employee) {
            return [
                'success' => false,
                'error' => 'Employee not found',
            ];
        }

        // Fetch payroll data for this employee and month
        $payroll = \App\Models\Payroll::where('employee_id', $employeeId)
            ->where('month', $month)
            ->orderBy('payroll_date', 'desc')
            ->first();

        // Get all timekeeping records for this employee in the selected month
        $records = \App\Models\TimeKeeping::where('employee_id', $employeeId)
            ->where('date', 'like', "$month%")
            ->get();

        $late_count = 0;
        $early_count = 0;
        $overtime_count = 0;
        $overtime_count_weekdays = 0;
        $overtime_count_weekends = 0;
        $absences = 0;
        $overtime_pay_total = 0;

        // Use payroll values if available, otherwise fallback to employee
        $base_salary = $payroll ? $payroll->base_salary : $employee->base_salary;
        $work_hours_per_day = $employee->work_hours_per_day ?? 8;

        $rate_per_day = ($base_salary * 12) / 288;
        $rate_per_hour = ($work_hours_per_day > 0) ? ($rate_per_day / $work_hours_per_day) : 0;
        $work_start_time = $employee->work_start_time;
        $work_end_time = $employee->work_end_time;

        $grace_period_default_minutes = 15;

        // Observances for this month
        $observancesRows = DB::table('observances')
            ->where('date', 'like', "$month%")
            ->get(['date', 'type', 'is_automated'])
            ->toArray();
        $observanceDates = array_map(function ($o) { return $o->date; }, $observancesRows);
        $observanceSet = array_flip($observanceDates);
        $observanceTypeMap = [];
        $observanceAutomatedMap = [];
        foreach ($observancesRows as $orow) {
            $observanceTypeMap[$orow->date] = $orow->type ?? null;
            $observanceAutomatedMap[$orow->date] = isset($orow->is_automated) ? (bool)$orow->is_automated : false;
        }

        foreach ($records as $tk) {
            // Tardiness (decimal hours)
            if ($tk->clock_in && $work_start_time) {
                $date = $tk->date;
                if (isset($observanceTypeMap[$date]) && $observanceTypeMap[$date] === 'whole-day') {
                    // skip tardiness entirely on whole-day suspension
                } else {
                    $grace = $grace_period_default_minutes;
                    if (isset($observanceTypeMap[$date]) && $observanceTypeMap[$date] === 'rainy-day') {
                        $grace = 60; // 1 hour grace for rainy day
                    }
                    $late_threshold = date('H:i:s', strtotime($work_start_time) + $grace * 60);
                    if (strtotime($tk->clock_in) > strtotime($late_threshold)) {
                        // Count all minutes late from scheduled start time
                        $late_minutes = (strtotime($tk->clock_in) - strtotime($work_start_time)) / 60;
                        if ($late_minutes > 0) { $late_count += ($late_minutes / 60); }
                    }
                }
            }
            // Undertime (decimal hours)
            if ($tk->clock_out && $work_end_time && strtotime($tk->clock_out) < strtotime($work_end_time)) {
                $early_minutes = (strtotime($work_end_time) - strtotime($tk->clock_out)) / 60;
                if ($early_minutes > 0) { $early_count += ($early_minutes / 60); }
            }
            // Overtime (decimal hours, start counting after exactly 1 hour past work end time)
            if ($tk->clock_out) {
                $clockOut = strtotime($tk->clock_out);

                // Determine scheduled work end to use for overtime calculation.
                // For multi-role employees that include college, prefer the non-college role's schedule for that weekday.
                $rolesStrTmp = strtolower((string)($employee->roles ?? ''));
                $hasCollegeTmp = strpos($rolesStrTmp, 'college instructor') !== false;
                $tokensTmp = array_filter(array_map('trim', preg_split('/[,\n]+/', $rolesStrTmp)));
                $isCollegeMultiTmp = $hasCollegeTmp && (count($tokensTmp) > 0 ? (count(array_filter($tokensTmp, function($t){ return strpos($t, 'college instructor') !== false; })) < count($tokensTmp)) : false);

                $dayOfWeekNum = date('N', strtotime($tk->date)); // 1-7
                $scheduledEnd = null;
                if ($isCollegeMultiTmp) {
                    $nonCollegeEndByDayLocal = [];
                    if ($employee->workDays && count($employee->workDays)) {
                        foreach ($employee->workDays as $wd) {
                            $roleStr = strtolower((string)($wd->role ?? ''));
                            if (strpos($roleStr, 'college') !== false) continue;
                            $d = (string)$wd->day;
                            $dayNum = is_numeric($d) ? intval($d) : null;
                            if ($dayNum === null) {
                                $dn = strtolower(trim($d));
                                $map = ['mon'=>1,'tue'=>2,'wed'=>3,'thu'=>4,'fri'=>5,'sat'=>6,'sun'=>7,'monday'=>1,'tuesday'=>2,'wednesday'=>3,'thursday'=>4,'friday'=>5,'saturday'=>6,'sunday'=>7];
                                $dayNum = $map[$dn] ?? null;
                            }
                            if ($dayNum) {
                                $existing = isset($nonCollegeEndByDayLocal[$dayNum]) ? strtotime($nonCollegeEndByDayLocal[$dayNum]) : null;
                                $thisT = $wd->work_end_time ? strtotime($wd->work_end_time) : null;
                                if ($thisT !== null && ($existing === null || $thisT > $existing)) {
                                    $nonCollegeEndByDayLocal[$dayNum] = $wd->work_end_time;
                                }
                            }
                        }
                    }
                    $scheduledEnd = $nonCollegeEndByDayLocal[$dayOfWeekNum] ?? null;
                    if ($scheduledEnd === null) continue; // no non-college schedule on that weekday
                } else {
                    $scheduledEnd = $employee->work_end_time;
                }

                if ($scheduledEnd) {
                    $workEnd = strtotime($scheduledEnd);
                    $rawOvertimeSeconds = $clockOut - $workEnd;
                    if ($rawOvertimeSeconds >= 3600) { // >= 1 hour threshold
                        $overtime_minutes = $rawOvertimeSeconds / 60;
                        if ($overtime_minutes > 0) {
                            $overtime_hours = ($overtime_minutes / 60);
                            $dayOfWeek = date('N', strtotime($tk->date));
                            $pay = ($dayOfWeek >= 1 && $dayOfWeek <= 5) ? ($rate_per_hour * 0.25) : ($rate_per_hour * 0.30);
                            $overtime_count += $overtime_hours;
                            $overtime_pay_total += $pay * $overtime_hours;
                            if ($dayOfWeek >= 1 && $dayOfWeek <= 5) { $overtime_count_weekdays += $overtime_hours; } else { $overtime_count_weekends += $overtime_hours; }
                        }
                    }
                }
            }
        }

        // --- LEAVES INTERSECTING THE MONTH ---
        $monthStart = $month . '-01';
        $monthEnd = date('Y-m-t', strtotime($monthStart));

        $approvedLeaves = \App\Models\Leave::where('employee_id', $employeeId)
            ->where(function ($query) use ($monthStart, $monthEnd) {
                $query->where('leave_start_day', '<=', $monthEnd)
                    ->where('leave_end_day', '>=', $monthStart);
            })
            ->get(['leave_start_day', 'leave_end_day', 'status']);

        $leaveDatesMap = [];
        foreach ($approvedLeaves as $leave) {
            $startDate = max($leave->leave_start_day, $monthStart);
            $endDate = min($leave->leave_end_day, $monthEnd);

            $period = new \DatePeriod(
                new \DateTime($startDate),
                new \DateInterval('P1D'),
                (new \DateTime($endDate))->modify('+1 day')
            );

            $type = $leave->status ?? 'DEFAULT';
            foreach ($period as $dateObj) {
                $leaveDatesMap[$dateObj->format('Y-m-d')] = $type;
            }
        }
        $leaveDatesSet = [];
        foreach ($leaveDatesMap as $d => $_type) { $leaveDatesSet[$d] = true; }

        // Schedules from workDays and college program schedules
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
        $hmToMin = function ($time) {
            if (!$time) return null; $p = explode(':', (string)$time); if (count($p) < 2) return null; $h = intval($p[0]); $m = intval($p[1]); return $h*60 + $m;
        };
        $diffMin = function (int $startMin, int $endMin) {
            $d = $endMin - $startMin; if ($d <= 0) $d += 24 * 60; return $d;
        };

        $schedByCode = [];
        $workDaysModels = $employee->workDays ? $employee->workDays : collect();
        foreach ($workDaysModels as $wd) {
            $start = $hmToMin($wd->work_start_time); $end = $hmToMin($wd->work_end_time);
            if ($start === null || $end === null) continue;
            $raw = $diffMin($start, $end);
            $durationMin = max(0, $raw - 60);
            $code = $normalizeDayKey($wd->day);
            if (!isset($schedByCode[$code])) {
                $schedByCode[$code] = ['start' => $start, 'end' => $end, 'durationMin' => $durationMin, 'noTimes' => false, 'extraCollegeDurMin' => 0];
            } else {
                $prev = $schedByCode[$code];
                $mergedStart = min($prev['start'], $start);
                $mergedEnd = max($prev['end'], $end);
                $mergedRaw = $diffMin($mergedStart, $mergedEnd);
                $mergedDuration = max(0, $mergedRaw - 60);
                $schedByCode[$code] = ['start' => $mergedStart, 'end' => $mergedEnd, 'durationMin' => $mergedDuration, 'noTimes' => false, 'extraCollegeDurMin' => $prev['extraCollegeDurMin'] ?? 0];
            }
        }
        $collegeScheds = $employee->collegeProgramSchedules ? $employee->collegeProgramSchedules : collect();
        foreach ($collegeScheds as $cs) {
            $code = $normalizeDayKey($cs->day);
            $mins = (int) round(max(0, (float)$cs->hours_per_day) * 60);
            if (!isset($schedByCode[$code])) {
                $schedByCode[$code] = ['start' => null, 'end' => null, 'durationMin' => $mins, 'noTimes' => true, 'extraCollegeDurMin' => 0];
            } else {
                $prev = $schedByCode[$code];
                $prev['extraCollegeDurMin'] = ($prev['extraCollegeDurMin'] ?? 0) + $mins;
                $schedByCode[$code] = $prev;
            }
        }

        // Role flags for college handling
        $rolesStr = strtolower((string)($employee->roles ?? ''));
        $tokens = array_filter(array_map('trim', preg_split('/[,\n]+/', $rolesStr)));
        $hasCollege = strpos($rolesStr, 'college instructor') !== false;
        $isCollegeOnly = $hasCollege && (count($tokens) > 0 ? (count(array_filter($tokens, function($t){ return strpos($t, 'college instructor') !== false; })) === count($tokens)) : true);
        $isCollegeMulti = $hasCollege && !$isCollegeOnly;

        $phpDayToStr = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        $absent_hours = 0;

        $daysInMonth = (int)date('t', strtotime($month . '-01'));
        for ($i = 1; $i <= $daysInMonth; $i++) {
            $date = date('Y-m-d', strtotime($month . '-' . str_pad($i, 2, '0', STR_PAD_LEFT)));
            $dayOfWeekNum = date('w', strtotime($date));
            $dayOfWeekStr = $phpDayToStr[$dayOfWeekNum];
            $sched = $schedByCode[$dayOfWeekStr] ?? null;
            if (!$sched) continue; // not a scheduled work day of any type

            // Skip whole-day or automated observances
            $isObservance = isset($observanceSet[$date]);
            $isWholeDay = $isObservance && (isset($observanceTypeMap[$date]) && $observanceTypeMap[$date] === 'whole-day');
            $isAutomatedHoliday = $isObservance && (!empty($observanceAutomatedMap[$date]));
            if ($isWholeDay || $isAutomatedHoliday) continue;

            // Skip leave dates
            if (isset($leaveDatesSet[$date])) continue;

            $tk = $records->where('date', $date);
            $hasClock = false;
            foreach ($tk as $rec) {
                $ci = trim((string)($rec->clock_in ?? ''));
                $co = trim((string)($rec->clock_out ?? ''));
                if ($ci !== '' && $co !== '') { $hasClock = true; break; }
            }

            // Compute expected hours for this day
            $expectedMin = (int)($sched['durationMin'] ?? 0);
            if ($isCollegeMulti && isset($sched['extraCollegeDurMin']) && $sched['extraCollegeDurMin'] > 0) {
                $expectedMin = max($expectedMin, (int)$sched['extraCollegeDurMin']);
            }

            if (!$hasClock) {
                $absent_hours += round($expectedMin / 60, 2);
                continue;
            }

            if (!empty($sched['noTimes'])) {
                // No explicit start/end: use total worked minus 1h break if any
                $first = $tk->first(); $last = $tk->last();
                $in = strtotime((string)($first->clock_in ?? $first->time_in ?? ''));
                $out = strtotime((string)($last->clock_out ?? $last->time_out ?? ''));
                if ($in && $out) {
                    $worked = $out - $in; if ($worked < 0) $worked += 24*60*60;
                    $workedMinusBreak = max(0, ($worked - 3600) / 60); // minutes
                    if ($hasCollege) {
                        $deficitMin = max(0, $expectedMin - (int)round($workedMinusBreak));
                        $absent_hours += round($deficitMin / 60, 2);
                    }
                }
                continue;
            }

            // Time-based schedule: compute workedMinusBreak and deficit when college
            $first = $tk->first(); $last = $tk->last();
            $in = strtotime((string)($first->clock_in ?? $first->time_in ?? ''));
            $out = strtotime((string)($last->clock_out ?? $last->time_out ?? ''));
            if ($in && $out) {
                $worked = $out - $in; if ($worked < 0) $worked += 24*60*60;
                $workedMinusBreak = max(0, ($worked - 3600)); // seconds
                $workedMin = (int)round($workedMinusBreak / 60);
                if ($hasCollege) {
                    $deficitMin = max(0, $expectedMin - $workedMin);
                    $absent_hours += round($deficitMin / 60, 2);
                }
            }
        }

        $absences = $absent_hours;

        // If the employee is a College Instructor ONLY, convert tardiness/undertime to absences and remove OT
        $rolesStr2 = strtolower((string)($employee->roles ?? ''));
        $tokens2 = array_filter(array_map('trim', preg_split('/[,\n]+/', $rolesStr2)));
        $hasCollege2 = strpos($rolesStr2, 'college instructor') !== false;
        $isCollegeOnly2 = $hasCollege2 && (count($tokens2) > 0 ? (count(array_filter($tokens2, function($t){ return strpos($t, 'college instructor') !== false; })) === count($tokens2)) : true);
        if ($isCollegeOnly2) {
            $absences += round($late_count + $early_count, 2);
            $late_count = 0;
            $early_count = 0;
            $overtime_count = 0;
            $overtime_count_weekdays = 0;
            $overtime_count_weekends = 0;
            $overtime_pay_total = 0;
        }

        // Calculate total_hours for all roles on scheduled work days (minus 1 hour break if clock-out > 13:00)
        $actualHoursWorked = 0;
        $phpDayToStr = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        $workDaysModels = $employee->workDays ? $employee->workDays : collect();
        foreach ($records as $tk) {
            $date = $tk->date;
            $dayOfWeekNum = date('w', strtotime($date));
            $dayOfWeekStr = $phpDayToStr[$dayOfWeekNum];
            $workDay = $workDaysModels->get($dayOfWeekStr, $workDaysModels->get($dayOfWeekNum));
            if (!$workDay) continue;
            if (!empty($tk->clock_in) && !empty($tk->clock_out)) {
                $scheduledStart = !empty($workDay->work_start_time) ? strtotime($workDay->work_start_time) : null;
                $in = strtotime($tk->clock_in);
                $out = strtotime($tk->clock_out);
                if ($scheduledStart && $in < $scheduledStart) { $in = $scheduledStart; }
                $worked = $out - $in; if ($worked < 0) $worked += 24 * 60 * 60;
                $fixedBreakEnd = strtotime('13:00:00'); // 1 PM
                $breakDurationSeconds = 3600;
                $actualShiftEndsAfterBreak = ($out > $fixedBreakEnd);
                $finalDeductionSeconds = $actualShiftEndsAfterBreak ? $breakDurationSeconds : 0;
                $workedSeconds = $worked - $finalDeductionSeconds;
                $hours = $workedSeconds / 3600;
                $actualHoursWorked += max(0, $hours);
            }
        }

        $hasData = $records->count() > 0;

        $response = [
            'success' => $hasData,
            'tardiness' => round($late_count, 2),
            'undertime' => round($early_count, 2),
            'overtime' => round($overtime_count, 2),
            'overtime_count_weekdays' => round($overtime_count_weekdays, 2),
            'overtime_count_weekends' => round($overtime_count_weekends, 2),
            'absences' => round($absences, 2),
            'base_salary' => $base_salary,
            'rate_per_day' => $rate_per_day,
            'rate_per_hour' => $rate_per_hour,
            'overtime_pay_total' => round($overtime_pay_total, 2),
            'total_hours' => round($actualHoursWorked, 2),
            'work_hours_per_day' => $employee->work_hours_per_day,
        ];

        // If College Instructor, add college_rate
        if ($employee && is_string($employee->roles) && stripos($employee->roles, 'college instructor') !== false) {
            $response['college_rate'] = $employee->college_rate ?? null;
        }

        return $response;
    }
}
