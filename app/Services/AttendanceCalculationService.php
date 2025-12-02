<?php

namespace App\Services;

use App\Models\Employees;
use App\Models\TimeKeeping;
use App\Models\Observance;
use Illuminate\Support\Facades\DB;

/**
 * Unified Attendance Calculation Service
 * 
 * This service provides a single source of truth for attendance metrics calculation.
 * It is used by:
 * - PayrollController (payroll generation)
 * - TimeKeepingController (timekeeping dialog API)
 * 
 * IMPORTANT: When modifying this service, also update the frontend equivalent:
 * - resources/js/hooks/useTimekeepingComputed.ts
 * 
 * Both backend and frontend must maintain identical calculation logic to ensure
 * consistent results across the application.
 */
class AttendanceCalculationService
{
    /**
     * Compute monthly attendance metrics for an employee
     * 
     * @param Employees $employee
     * @param string $selectedMonth Format: YYYY-MM
     * @return array Metrics including tardiness, undertime, absences, overtime, total_hours, college_paid_hours
     */
    public static function computeMonthlyMetrics(Employees $employee, string $selectedMonth): array
    {
        // Helper: convert HH:MM to minutes since midnight
        $hmToMin = function ($time): ?int {
            if (!$time) return null;
            $parts = explode(':', (string)$time);
            if (count($parts) < 2) return null;
            return (int)$parts[0] * 60 + (int)$parts[1];
        };

        // Helper: difference in minutes between two time values
        $diffMin = function ($start, $end): int {
            if ($start === null || $end === null) return 0;
            $d = $end - $start;
            return $d >= 0 ? $d : $d + 24 * 60;
        };

        // Helper: parse clock time to minutes
        $parseClock = function ($raw) use ($hmToMin): ?int {
            if (!$raw) return null;
            $s = trim((string)$raw);
            if ($s === '-' || $s === '') return null;
            // Try 12-hour format with AM/PM
            if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)$/i', $s, $m)) {
                $h = intval($m[1]);
                $mi = intval($m[2]);
                $ap = strtoupper($m[3]);
                if ($ap === 'PM' && $h < 12) $h += 12;
                if ($ap === 'AM' && $h === 12) $h = 0;
                return $h * 60 + $mi;
            }
            // Try 24-hour format
            if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $s, $m)) {
                return intval($m[1]) * 60 + intval($m[2]);
            }
            return null;
        };

        // Normalize day keys
        $normalizeDayKey = function ($day): string {
            $day = strtolower(trim((string)$day));
            $map = ['monday' => 'mon', 'tuesday' => 'tue', 'wednesday' => 'wed', 'thursday' => 'thu', 'friday' => 'fri', 'saturday' => 'sat', 'sunday' => 'sun'];
            return $map[$day] ?? $day;
        };

        $codeFromDate = function ($date): string {
            $dow = date('w', strtotime($date));
            return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][$dow];
        };

        // Build schedules from work_days
        $schedByCode = [];
        $collegeTimesByCode = [];
        $collegeExtraMinByCode = [];
        
        $workDaysModels = $employee->workDays ?? collect();
        foreach ($workDaysModels as $wd) {
            $start = $hmToMin($wd->work_start_time);
            $end = $hmToMin($wd->work_end_time);
            if ($start === null || $end === null) continue;
            
            $rawDuration = $diffMin($start, $end);
            $durationMin = max(0, $rawDuration - 60); // Deduct 1 hour lunch
            $code = $normalizeDayKey($wd->day);
            $roleStr = strtolower((string)($wd->role ?? ''));
            $isCollegeRole = strpos($roleStr, 'college instructor') !== false;

            if (!isset($schedByCode[$code])) {
                $schedByCode[$code] = ['start' => $start, 'end' => $end, 'durationMin' => $durationMin, 'noTimes' => false, 'extraCollegeDurMin' => 0, 'isCollege' => $isCollegeRole];
            } else {
                // Merge overlapping schedules
                $prev = $schedByCode[$code];
                $mergedStart = min($prev['start'], $start);
                $mergedEnd = max($prev['end'], $end);
                $mergedRaw = $diffMin($mergedStart, $mergedEnd);
                $mergedDuration = max(0, $mergedRaw - 60);
                $schedByCode[$code] = ['start' => $mergedStart, 'end' => $mergedEnd, 'durationMin' => $mergedDuration, 'noTimes' => false, 'extraCollegeDurMin' => $prev['extraCollegeDurMin'] ?? 0, 'isCollege' => (bool)($prev['isCollege'] ?? false) || $isCollegeRole];
            }
            
            if ($isCollegeRole) {
                $collegeTimesByCode[$code] = ['start' => $start, 'end' => $end, 'durationMin' => $durationMin];
            }
        }

        // Add college schedules (hours only, no start/end)
        $collegeScheds = $employee->collegeProgramSchedules ?? collect();
        foreach ($collegeScheds as $cs) {
            $code = $normalizeDayKey($cs->day);
            $mins = (int)round(max(0, (float)$cs->hours_per_day) * 60);
            
            if (!isset($schedByCode[$code])) {
                $schedByCode[$code] = ['start' => null, 'end' => null, 'durationMin' => $mins, 'noTimes' => true, 'extraCollegeDurMin' => 0, 'isCollege' => true];
            } else {
                $prev = $schedByCode[$code];
                $prev['extraCollegeDurMin'] = ($prev['extraCollegeDurMin'] ?? 0) + $mins;
                $schedByCode[$code] = $prev;
            }
            
            $collegeExtraMinByCode[$code] = ($collegeExtraMinByCode[$code] ?? 0) + $mins;
        }

        // Load timekeeping records
        $records = TimeKeeping::where('employee_id', $employee->id)
            ->where('date', 'like', $selectedMonth . '%')
            ->get(['date', 'clock_in', 'clock_out']);
        
        $recMap = [];
        foreach ($records as $r) {
            $recMap[$r->date] = ['clock_in' => $r->clock_in, 'clock_out' => $r->clock_out];
        }

        // Load observances
        $obsArr = Observance::where('date', 'like', $selectedMonth . '%')->get(['date', 'type', 'label', 'start_time']);
        $obsMap = [];
        foreach ($obsArr as $o) {
            $d = substr((string)$o->date, 0, 10);
            // Store type and label separately (don't merge them)
            $obsMap[$d] = ['type' => $o->type, 'label' => $o->label, 'start_time' => $o->start_time ? $o->start_time->format('H:i') : null];
        }

        // Role flags
        $rolesStr = strtolower((string)($employee->roles ?? ''));
        $tokens = array_filter(array_map('trim', preg_split('/[,\n]+/', $rolesStr)));
        $hasCollege = strpos($rolesStr, 'college instructor') !== false;
        $isCollegeOnly = $hasCollege && (count($tokens) > 0 ? (count(array_filter($tokens, function ($t) {
            return strpos($t, 'college instructor') !== false;
        })) === count($tokens)) : true);
        $isCollegeMulti = $hasCollege && !$isCollegeOnly;

        // Initialize counters
        $tardMin = 0;
        $underMin = 0;
        $absentMin = 0;
        $otMin = 0;
        $otWeekdayMin = 0;
        $otWeekendMin = 0;
        $otObservanceMin = 0;
        $totalWorkedMin = 0;
        $collegePaidMin = 0;

        // Process each day of the month
        [$y, $m] = array_map('intval', explode('-', $selectedMonth));
        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $m, $y);

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $dateStr = sprintf('%04d-%02d-%02d', $y, $m, $day);
            $code = $codeFromDate($dateStr);
            $sched = $schedByCode[$code] ?? null;
            $rec = $recMap[$dateStr] ?? null;
            $timeIn = $parseClock($rec['clock_in'] ?? null);
            $timeOut = $parseClock($rec['clock_out'] ?? null);
            $hasBoth = ($timeIn !== null && $timeOut !== null);

            if ($sched) {
                $workedRaw = $hasBoth ? $diffMin($timeIn, $timeOut) : 0;
                $obs = $obsMap[$dateStr] ?? null;
                $obsType = $obs && isset($obs['type']) ? strtolower((string)$obs['type']) : '';
                
                // Check if this is a whole-day observance (either by type or if observance exists without type)
                $isWholeDayObs = (strpos($obsType, 'whole') !== false) || ($obs && !$obsType);

                // Whole-day observances: worked hours go to double pay bucket only, NOT to overtime
                if ($isWholeDayObs) {
                    $workedMinusBreak = $hasBoth ? max(0, $workedRaw - 60) : 0;
                    $totalWorkedMin += $workedMinusBreak;
                    if ($hasBoth) {
                        // Holiday hours go to double pay bucket only, NOT to overtime
                        $otObservanceMin += $workedMinusBreak;
                    }
                    continue;
                }
                
                // Half-day observances
                if (strpos($obsType, 'half') !== false) {
                    $workedMinusBreak = $hasBoth ? max(0, $workedRaw - 60) : 0;
                    $totalWorkedMin += $workedMinusBreak;
                    if ($hasBoth) {
                        // Holiday hours go to double pay bucket only, NOT to overtime
                        $otObservanceMin += $workedMinusBreak;
                    }
                    continue;
                }

                // Hours-only schedule (noTimes)
                if (!empty($sched['noTimes'])) {
                    $expected = (int)($sched['durationMin'] ?? 0);
                    if (!$hasBoth) {
                        $absentMin += $expected;
                        continue;
                    }
                    
                    // Calculate worked minutes with proper lunch break handling
                    $worked = $hasBoth ? $diffMin($timeIn, $timeOut) : 0;
                    // Only deduct lunch if shift spans across the 12:00-13:00 lunch period
                    $lunchStart = 12 * 60; // 12:00
                    $lunchEnd = 13 * 60;   // 13:00
                    $workedMinusBreak = $worked;
                    if ($timeIn < $lunchEnd && $timeOut > $lunchStart && $worked > 60) {
                        $workedMinusBreak = max(0, $worked - 60);
                    }
                    
                    $totalWorkedMin += $workedMinusBreak;
                    $collegePaidMin += min($workedMinusBreak, $expected);
                    
                    // Track undertime for all roles (for college, it will be added to absences)
                    $under = max(0, $expected - $workedMinusBreak);
                    $underMin += $under;
                    
                    // For college-only: track overtime when worked hours exceed scheduled hours by at least 1 hour
                    if ($isCollegeOnly) {
                        $excess = $workedMinusBreak - $expected;
                        // Only count overtime if excess is at least 1 hour (60 minutes), then count full excess
                        $over = $excess >= 60 ? $excess : 0;
                        $otMin += $over;
                        if ($code === 'sat' || $code === 'sun') {
                            $otWeekendMin += $over;
                        } else {
                            $otWeekdayMin += $over;
                        }
                    }
                    continue;
                }

                // Time-based schedule (default)
                $workedMinusBreak = $hasBoth ? max(0, $workedRaw - 60) : 0;
                $totalWorkedMin += $workedMinusBreak;

                if (!$hasBoth) {
                    $expected = (int)($sched['durationMin'] ?? 0);
                    if ($isCollegeMulti && isset($sched['extraCollegeDurMin']) && $sched['extraCollegeDurMin'] > 0) {
                        $expected = max($expected, (int)$sched['extraCollegeDurMin']);
                    }
                    $absentMin += $expected;
                    continue;
                }

                // College-paid hours calculation for time-based schedules
                $cSpec = $collegeTimesByCode[$code] ?? null;
                $paidTodayForCollege = 0;
                if ($cSpec) {
                    $in1 = $timeIn;
                    $out1 = $timeOut;
                    $s1 = (int)$cSpec['start'];
                    $e1 = (int)$cSpec['end'];
                    if ($out1 <= $in1) $out1 += 24 * 60;
                    if ($e1 <= $s1) $e1 += 24 * 60;
                    $left = max($in1, $s1);
                    $right = min($out1, $e1);
                    $overlap = max(0, $right - $left);
                    
                    // Deduct lunch if overlap crosses 13:00
                    $fixedBreakEnd = 13 * 60;
                    $outNorm = ($timeOut <= $timeIn) ? $timeOut + 24 * 60 : $timeOut;
                    $endNorm = ($cSpec['end'] <= $cSpec['start']) ? $cSpec['end'] + 24 * 60 : $cSpec['end'];
                    $overlapEndCandidate = min($outNorm, $endNorm);
                    if ($overlap > 0 && $overlapEndCandidate > $fixedBreakEnd) {
                        $overlap = max(0, $overlap - 60);
                    }
                    $paidTodayForCollege = min($overlap, (int)$cSpec['durationMin']);
                    $collegePaidMin += $paidTodayForCollege;
                }
                
                // Extra college minutes
                $extra = (int)($collegeExtraMinByCode[$code] ?? 0);
                if ($extra > 0) {
                    $remain = max(0, $workedMinusBreak - $paidTodayForCollege);
                    $collegePaidMin += min($remain, $extra);
                }

                // Multi-role with college: allow overtime
                if ($isCollegeMulti && ((int)($sched['extraCollegeDurMin'] ?? 0)) > (int)($sched['durationMin'] ?? 0)) {
                    $expected = max((int)($sched['durationMin'] ?? 0), (int)($sched['extraCollegeDurMin'] ?? 0));
                    $over = max(0, $workedMinusBreak - $expected);
                    $otMin += $over;
                    $otWeekdayMin += $over;
                    continue;
                }

                // College-only: track tardiness, undertime, and overtime
                if ($isCollegeOnly && isset($sched['start']) && isset($sched['end'])) {
                    $tard = max(0, $timeIn - (int)$sched['start']);
                    $under = max(0, (int)$sched['end'] - $timeOut);
                    $tardMin += $tard;
                    $underMin += $under;
                    
                    // Track overtime when worked hours exceed scheduled hours by at least 1 hour
                    $expected = (int)($sched['durationMin'] ?? 0);
                    $excess = $workedMinusBreak - $expected;
                    // Only count overtime if excess is at least 1 hour (60 minutes), then count full excess
                    $over = $excess >= 60 ? $excess : 0;
                    $otMin += $over;
                    if ($code === 'sat' || $code === 'sun') {
                        $otWeekendMin += $over;
                    } else {
                        $otWeekdayMin += $over;
                    }
                    continue;
                }

                // Non-college: standard tardiness/undertime/OT
                $tard = max(0, $timeIn - (int)$sched['start']);
                $under = max(0, (int)$sched['end'] - $timeOut);
                $over = max(0, $workedMinusBreak - (int)$sched['durationMin']);
                $tardMin += $tard;
                $underMin += $under;
                $otMin += $over;
                $otWeekdayMin += $over;
            } else {
                // Non-scheduled day (weekend/off)
                if ($hasBoth) {
                    $workedRaw = $diffMin($timeIn, $timeOut);
                    $workedMinusBreak = max(0, $workedRaw - 60);
                    $totalWorkedMin += $workedMinusBreak;
                    if (!$isCollegeOnly) {
                        $otMin += $workedMinusBreak;
                        $otWeekendMin += $workedMinusBreak;
                    }
                }
            }
        }

        // Convert to hours
        $toH = function ($min) {
            return round($min / 60, 2);
        };

        // For college-only employees: convert tardiness and undertime to absences
        if ($isCollegeOnly) {
            $absentMin += $tardMin + $underMin;
            $tardMin = 0;
            $underMin = 0;
        }

        // Ensure overtime breakdown equals total (for consistency)
        $calculatedOtMin = $otWeekdayMin + $otWeekendMin + $otObservanceMin;
        if (abs($calculatedOtMin - $otMin) > 1) { // Allow 1 minute tolerance for rounding
            \Illuminate\Support\Facades\Log::warning('Overtime calculation mismatch', [
                'employee_id' => $employee->id,
                'month' => $selectedMonth,
                'total_ot_min' => $otMin,
                'weekday_min' => $otWeekdayMin,
                'weekend_min' => $otWeekendMin,
                'observance_min' => $otObservanceMin,
                'calculated_sum' => $calculatedOtMin,
                'difference' => $otMin - $calculatedOtMin,
            ]);
        }

        // Debug: Log the final values for employee 11
        if ($employee->id == 11) {
            \Illuminate\Support\Facades\Log::info('Employee 11 Overtime Calculation', [
                'month' => $selectedMonth,
                'overtime_total_hours' => $toH($otMin),
                'overtime_weekdays_hours' => $toH($otWeekdayMin),
                'overtime_weekends_hours' => $toH($otWeekendMin),
                'overtime_observances_hours' => $toH($otObservanceMin),
                'sum_of_breakdowns' => $toH($calculatedOtMin),
            ]);
        }

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
}
