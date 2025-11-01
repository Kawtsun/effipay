<?php

namespace App\Http\Controllers;

use App\Models\TimeKeeping;
use App\Http\Requests\StoreTimeKeepingRequest;
use App\Http\Requests\UpdateTimeKeepingRequest;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLogs;


class TimeKeepingController extends Controller
{

    /**
     * Get daily biometric records for an employee and month (for BTRDialog)
     * URL: /api/timekeeping/records?employee_id=123&month=2025-08
     * Returns: [{date, clock_in, clock_out} ...]
     */
    public function getEmployeeRecordsForMonth(Request $request)
    {
        $employeeId = $request->query('employee_id');
        $month = $request->query('month'); // format: YYYY-MM
        if (!$employeeId || !$month) {
            return response()->json(['success' => false, 'error' => 'Missing employee_id or month'], 400);
        }

        // Calculate first and last day of the month
        $firstDay = $month . '-01';
        $lastDay = date('Y-m-t', strtotime($firstDay));
        // Get all records for the employee in the given month (inclusive)
        $records = \App\Models\TimeKeeping::where('employee_id', $employeeId)
            ->where('date', '>=', $firstDay)
            ->where('date', '<=', $lastDay)
            ->orderBy('date')
            ->get(['date', 'clock_in', 'clock_out']);

        // Get employee and compute rate per hour
        $employee = \App\Models\Employees::find($employeeId);
        $base_salary = $employee ? $employee->base_salary : 0;
        // Use the employee's specific schedule, fallback to 8
        $work_hours_per_day = $employee && $employee->work_hours_per_day ? $employee->work_hours_per_day : 8;
        $rate_per_day = ($base_salary * 12) / 288;
        $rate_per_hour = ($work_hours_per_day > 0) ? ($rate_per_day / $work_hours_per_day) : 0;

        // Format clock_in and clock_out as 12-hour time (h:i A)
        $formatted = $records->map(function ($rec) {
            return [
                'date' => $rec->date,
                'clock_in' => $rec->clock_in ? date('g:i A', strtotime($rec->clock_in)) : null,
                'clock_out' => $rec->clock_out ? date('g:i A', strtotime($rec->clock_out)) : null,
            ];
        });

        return response()->json([
            'success' => true,
            'records' => $formatted,
            'rate_per_hour' => $rate_per_hour,
        ]);
    }
    /**
     * Import time keeping records from uploaded file.
     */
    public function import(Request $request)
    {
        $records = $request->input('records', []);
        // Try to capture file name if provided (either as uploaded file or as a simple field)
        $fileName = $request->input('file_name');
        if (!$fileName && $request->hasFile('file')) {
            try {
                $fileName = $request->file('file')->getClientOriginalName();
            } catch (\Throwable $e) {
                $fileName = null;
            }
        }
        $imported = 0;
        $errors = [];
        $shownIdNameError = false;
        $importMonths = [];
        foreach ($records as $i => $row) {
            try {
                // Normalize keys to lowercase for robust matching
                $normalized = [];
                foreach ($row as $key => $value) {
                    $normalized[strtolower(str_replace([' ', '_'], '', $key))] = $value;
                }
                $employeeId = $normalized['personid'] ?? null;
                $firstName = $normalized['firstname'] ?? null;
                $lastName = $normalized['lastname'] ?? null;
                $date = $normalized['date'] ?? null;
                $clockIn = $normalized['clockin'] ?? null;
                $clockOut = $normalized['clockout'] ?? null;
                // Convert M/D/YYYY or MM/DD/YYYY to YYYY-MM-DD if needed
                if ($date && preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $date, $matches)) {
                    $date = sprintf('%04d-%02d-%02d', $matches[3], $matches[1], $matches[2]);
                }
                $employee = $employeeId ? \App\Models\Employees::where('id', $employeeId)->first() : null;
                if (!$employee) {
                    $errors[] = "Employee ID $employeeId not found.";
                    continue;
                }
                // Verify first name and last name
                if (
                    ($firstName && strtolower(trim($employee->first_name)) !== strtolower(trim($firstName))) ||
                    ($lastName && strtolower(trim($employee->last_name)) !== strtolower(trim($lastName)))
                ) {
                    if (!$shownIdNameError) {
                        $errors[] = "Import Error: Employee ID $employeeId: DB name '{$employee->first_name} {$employee->last_name}', CSV name '$firstName $lastName' do not match.";
                        $shownIdNameError = true;
                    }
                    continue;
                }
                if (empty($date)) {
                    $errors[] = "Date missing for Employee ID $employeeId.";
                    continue;
                }
                \App\Models\TimeKeeping::updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'date' => $date,
                    ],
                    [
                        'clock_in' => $clockIn,
                        'clock_out' => $clockOut,
                    ]
                );
                $imported++;
                if (!empty($date) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                    $importMonths[] = substr($date, 0, 7);
                }
            } catch (\Throwable $e) {
                $errors[] = "Row $i: " . $e->getMessage();
            }
        }
        // Create Audit Log for import attempt
        try {
            $username = Auth::user()->username ?? 'system';
            $months = array_values(array_unique($importMonths));
            $name = count($months) === 1 ? $months[0] : (count($months) > 1 ? 'multiple months' : date('Y-m'));
            $details = [
                'imported' => $imported,
                'errors_count' => count($errors),
                'sample_errors' => array_slice($errors, 0, 5),
                'file_name' => $fileName,
            ];
            AuditLogs::create([
                'username'    => $username,
                'action'      => 'import timekeeping',
                'name'        => $name,
                'entity_type' => 'timekeeping',
                'entity_id'   => null,
                'details'     => json_encode($details),
                'date'        => now('Asia/Manila'),
            ]);
        } catch (\Throwable $e) {
            // fail silently for logging
        }

        if ($imported > 0) {
            return response()->json(['success' => true, 'imported' => $imported, 'errors' => $errors]);
        } else {
            return response()->json(['success' => false, 'imported' => 0, 'errors' => $errors], 400);
        }
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $request = request();
        $query = \App\Models\Employees::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('last_name', 'like', '%' . $request->search . '%')
                    ->orWhere('first_name', 'like', '%' . $request->search . '%')
                    ->orWhere('middle_name', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('types')) {
            $query->whereHas('employeeTypes', function ($q) use ($request) {
                $q->whereIn('type', $request->types);
            });
        }

        if ($request->filled('statuses')) {
            $query->whereIn('employee_status', $request->statuses);
        }

        $standardRoles = ['administrator', 'college instructor', 'basic education instructor'];

        if ($request->filled('roles') && is_array($request->roles) && count($request->roles)) {
            $query->where(function ($q) use ($request, $standardRoles) {
                $rolesToFilter = $request->roles;

                // If 'others' is in the filter, it means "any role that is not a standard one".
                if (in_array('others', $rolesToFilter)) {
                    $rolesToFilter = array_diff($rolesToFilter, ['others']); // Remove 'others' from specific checks
                    $q->orWhere(function ($subQuery) use ($standardRoles) {
                        // This subquery should find employees where the roles string does NOT contain ANY of the standard roles.
                        foreach ($standardRoles as $stdRole) {
                            $subQuery->where('roles', 'not like', '%' . $stdRole . '%');
                        }
                    });
                }

                foreach ($rolesToFilter as $role) {
                    $q->orWhere('roles', $role)
                        ->orWhere('roles', 'like', $role . ',%')
                        ->orWhere('roles', 'like', '%,' . $role . ',%')
                        ->orWhere('roles', 'like', '%,' . $role);
                }
            });
        }

        if (
            $request->filled('collegeProgram') &&
            $request->filled('roles') &&
            is_array($request->roles) &&
            in_array('college instructor', $request->roles)
        ) {
            $query->where('college_program', $request->collegeProgram);
        }

        // Filter by basic education level if set (only when basic education instructor is selected)
        if (
            $request->filled('basicEducationLevel') &&
            $request->filled('roles') &&
            is_array($request->roles) &&
            in_array('basic education instructor', $request->roles)
        ) {
            $query->where('basic_edu_level', $request->basicEducationLevel);
        }

        // Get available custom roles (others roles)
        $standardRoles = ['administrator', 'college instructor', 'basic education instructor'];
        $othersRoles = [];

        // Get all unique roles from employees
        $allRoles = \App\Models\Employees::pluck('roles')->filter()->map(function ($roles) {
            return explode(',', $roles);
        })->flatten()->map(function ($role) {
            return trim($role);
        })->filter()->unique()->values();

        // Filter out standard roles to get custom roles
        $customRoles = $allRoles->filter(function ($role) use ($standardRoles) {
            return !in_array(strtolower($role), $standardRoles);
        })->map(function ($role) {
            return [
                'value' => $role,
                'label' => ucwords($role)
            ];
        })->values()->toArray();

        $othersRoles = $customRoles;

        // Support perPage/per_page like EmployeesController
        $perPage = (int) ($request->input('perPage', $request->input('per_page', 10)));
        if ($perPage <= 0) {
            $perPage = 10;
        }
    // Eager-load workDays, employeeTypes, and college program schedules to mirror EmployeesController
    $employees = $query->with(['workDays', 'employeeTypes', 'collegeProgramSchedules'])->paginate($perPage)->withQueryString();

        $employees->getCollection()->transform(function ($emp) {
            // ** THE FIX IS HERE **
            // We now map the collection to the correct array structure
            $employeeTypesArray = $emp->employeeTypes->map(function ($type) {
                return [
                    'role' => $type->role,
                    'type' => $type->type,
                ];
            });

            // Unset the original relationship to avoid sending redundant data
            unset($emp->employeeTypes);
            // Assign the newly formatted array
            $emp->employee_types = $employeeTypesArray;

            // Leave relations on the model for the next mapping stage where we compute
            // additional timekeeping metrics; we'll shape work_days and college_schedules there.
            return $emp;
        });

        $employeesArray = array_map(function ($emp) {
            // Overtime pay calculation function (matches frontend)
            $calculateOvertimePay = function ($date, $ratePerHour) {
                $dayOfWeek = date('w', strtotime($date)); // 0 (Sun) - 6 (Sat)
                if ($dayOfWeek >= 1 && $dayOfWeek <= 5) {
                    return round($ratePerHour * 0.25, 2);
                } else {
                    return round($ratePerHour * 0.30, 2);
                }
            };
            // Calculate rate per day and rate per hour
            $rate_per_day = ($emp->base_salary * 12) / 288;
            $rate_per_hour = $rate_per_day / 8;
            $latestTK = \App\Models\TimeKeeping::where('employee_id', $emp->id)
                ->orderByDesc('date')
                ->first();
            $clock_in = $latestTK ? $latestTK->clock_in : null;
            $clock_out = $latestTK ? $latestTK->clock_out : null;
            $overtime = false;
            if ($clock_out) {
                $overtime = strtotime($clock_out) > strtotime('20:00:00');
            }

            // Late/Early Departure & Overtime Counters
            $late_count = 0;
            $early_count = 0;
            $overtime_count = 0;
            $records = \App\Models\TimeKeeping::where('employee_id', $emp->id)->get();
            // Preload observances for the dates present in records so we can apply per-date rules (e.g., rainy-day grace)
            $recordDates = $records->pluck('date')->unique()->values()->toArray();
            $observanceRows = [];
            if (count($recordDates) > 0) {
                $observanceRows = DB::table('observances')->whereIn('date', $recordDates)->get(['date', 'type']);
            }
            $observanceTypeMap = [];
            foreach ($observanceRows as $or) {
                $observanceTypeMap[$or->date] = $or->type ?? null;
            }
            $late_threshold = null;
            if ($emp->work_start_time) {
                $late_threshold = date('H:i:s', strtotime($emp->work_start_time) + 15 * 60);
            }
            // Build per-weekday non-college scheduled end times for multi-role handling
            // Map: weekday number (1=Mon..7=Sun) => work_end_time string
            $nonCollegeEndByDay = [];
            $timeToMinutes = function($t) {
                if (!$t) return null; $p = explode(':', (string)$t); if (count($p) < 2) return null; return intval($p[0]) * 60 + intval($p[1]);
            };
            if ($emp->workDays && count($emp->workDays)) {
                foreach ($emp->workDays as $wd) {
                    $roleStr = strtolower((string)($wd->role ?? ''));
                    if (strpos($roleStr, 'college') !== false) continue; // only consider non-college roles here
                    $d = (string)$wd->day;
                    $dayNum = is_numeric($d) ? intval($d) : null;
                    if ($dayNum === null) {
                        $dn = strtolower(trim($d));
                        $map = ['mon'=>1,'tue'=>2,'wed'=>3,'thu'=>4,'fri'=>5,'sat'=>6,'sun'=>7,'monday'=>1,'tuesday'=>2,'wednesday'=>3,'thursday'=>4,'friday'=>5,'saturday'=>6,'sunday'=>7];
                        $dayNum = $map[$dn] ?? null;
                    }
                    if ($dayNum) {
                        $existingMin = isset($nonCollegeEndByDay[$dayNum]) ? $timeToMinutes($nonCollegeEndByDay[$dayNum]) : null;
                        $thisMin = $timeToMinutes($wd->work_end_time);
                        // pick the latest end time if multiple non-college roles exist on same day
                        if ($thisMin !== null && ($existingMin === null || $thisMin > $existingMin)) {
                            $nonCollegeEndByDay[$dayNum] = $wd->work_end_time;
                        }
                    }
                }
            }
            $overtime_pay_weekdays = 0;
            $overtime_pay_weekends = 0;
            $overtime_count_weekdays = 0;
            $overtime_count_weekends = 0;
            // Absences: check all workdays, exclude leave days, count as absent if no clock-in/out and not a leave day
            $absent_days = 0;
            // Get all workdays for this employee (assuming Mon-Fri, or use $emp->workDays if available)
            $workDays = $emp->workDays && count($emp->workDays) ? $emp->workDays->pluck('day')->toArray() : [1, 2, 3, 4, 5]; // 1=Mon, 7=Sun
            // Get the full date range from the earliest to latest timekeeping record
            $allDates = $records->pluck('date')->unique()->toArray();
            if (count($allDates) > 0) {
                $startDate = min($allDates);
                $endDate = max($allDates);
                $period = new \DatePeriod(
                    new \DateTime($startDate),
                    new \DateInterval('P1D'),
                    (new \DateTime($endDate))->modify('+1 day')
                );
                // Get leave dates for this employee
                $leaveStatuses = ['on leave', 'sick leave', 'vacation leave', 'Paid Leave'];
                $leaveIntervals = DB::table('leaves')
                    ->where('employee_id', $emp->id)
                    ->whereIn('status', $leaveStatuses)
                    ->whereNotNull('leave_start_day')
                    ->get(['leave_start_day', 'leave_end_day']);
                $isInLeaveInterval = function ($date) use ($leaveIntervals) {
                    foreach ($leaveIntervals as $interval) {
                        $start = $interval->leave_start_date;
                        $end = $interval->leave_end_date;
                        if ($start && !$end && $date >= $start) return true;
                        if ($start && $end && $date >= $start && $date <= $end) return true;
                    }
                    return false;
                };
                // Fetch observances for the whole period so we can exclude whole-day suspensions
                $periodStart = $startDate;
                $periodEnd = $endDate;
                $observancesForPeriod = [];
                try {
                    $observancesForPeriod = DB::table('observances')
                        ->where('date', '>=', $periodStart)
                        ->where('date', '<=', $periodEnd)
                        ->get(['date', 'type', 'is_automated']);
                } catch (\Throwable $e) {
                    $observancesForPeriod = [];
                }
                $observanceExcludeMap = [];
                foreach ($observancesForPeriod as $o) {
                    $d = $o->date;
                    // exclude if whole-day suspension OR automated holiday
                    if ((isset($o->type) && strtolower(trim((string)$o->type)) === 'whole-day') || (!empty($o->is_automated))) {
                        $observanceExcludeMap[$d] = true;
                    }
                }
                foreach ($period as $dateObj) {
                    $date = $dateObj->format('Y-m-d');
                    $dayOfWeek = $dateObj->format('N'); // 1=Mon, 7=Sun
                    if (!in_array($dayOfWeek, $workDays)) continue; // skip if not a workday
                    if ($isInLeaveInterval($date)) continue; // skip if in leave interval
                    if (isset($observanceExcludeMap[$date]) && $observanceExcludeMap[$date]) continue; // skip whole-day/automated observances
                    $dayRecords = $records->where('date', $date);
                    $hasClockIn = $dayRecords->contains(function ($tk) {
                        return !empty($tk->clock_in);
                    });
                    $hasClockOut = $dayRecords->contains(function ($tk) {
                        return !empty($tk->clock_out);
                    });
                    if (!$hasClockIn && !$hasClockOut) {
                        $absent_days++;
                    }
                }
            }
            $absences = 0;
            if (!empty($emp->work_hours_per_day)) {
                // Calculate work hours per day from start/end, minus 1 hour for break
                if (!empty($emp->work_start_time) && !empty($emp->work_end_time)) {
                    $start = strtotime($emp->work_start_time);
                    $end = strtotime($emp->work_end_time);
                    $workMinutes = $end - $start;
                    if ($workMinutes <= 0) $workMinutes += 24 * 60 * 60;
                    $workHours = max(1, round(($workMinutes / 3600) - 1, 2)); // minus 1 hour for break
                } else {
                    $workHours = floatval($emp->work_hours_per_day);
                }
                $absences = round($absent_days * $workHours, 2); // decimal hours
            } else {
                $absences = $absent_days; // fallback to days if no schedule
            }
            foreach ($records as $tk) {
                // Tardiness: count decimal hours late (not stacked)
                if ($tk->clock_in && $emp->work_start_time) {
                    $obsType = $observanceTypeMap[$tk->date] ?? null;
                    // Skip tardiness entirely on whole-day suspension
                    if ($obsType && strtolower(trim($obsType)) === 'whole-day') {
                        // do not add tardiness for whole-day suspension
                    } else {
                        // Determine grace minutes: rainy-day gets 60, otherwise default 15
                        $graceMinutes = 15;
                        if ($obsType && strtolower(trim($obsType)) === 'rainy-day') {
                            $graceMinutes = 60;
                        }
                        $scheduled = strtotime($emp->work_start_time);
                        $threshold = $scheduled + ($graceMinutes * 60);
                        $clockIn = strtotime($tk->clock_in);
                        // Only count tardiness if clock-in is after scheduled start + grace
                        if ($clockIn > $threshold) {
                            // tardiness is measured from the original scheduled start (includes the grace period)
                            $late_minutes = ($clockIn - $scheduled) / 60;
                            if ($late_minutes > 0) {
                                $late_count += round($late_minutes / 60, 2); // decimal hours
                            }
                        }
                    }
                }
                // Undertime: count decimal hours early (not stacked)
                if ($tk->clock_out && $emp->work_end_time && strtotime($tk->clock_out) < strtotime($emp->work_end_time)) {
                    $early_minutes = (strtotime($emp->work_end_time) - strtotime($tk->clock_out)) / 60;
                    if ($early_minutes > 0) {
                        $early_count += round($early_minutes / 60, 2); // decimal hours
                    }
                }
                // Overtime: count decimal hours overtime (not stacked)
                if ($tk->clock_out) {
                    $clockOut = strtotime($tk->clock_out);

                    // Determine scheduled work end to use for overtime calculation.
                    // For multi-role employees that include college, prefer the non-college role's schedule for that weekday.
                    $rolesStrTmp = strtolower((string)($emp->roles ?? ''));
                    $hasCollegeTmp = strpos($rolesStrTmp, 'college instructor') !== false;
                    $tokensTmp = array_filter(array_map('trim', preg_split('/[,\n]+/', $rolesStrTmp)));
                    $isCollegeMultiTmp = $hasCollegeTmp && (count($tokensTmp) > 0 ? (count(array_filter($tokensTmp, function($t){ return strpos($t, 'college instructor') !== false; })) < count($tokensTmp)) : false);

                    $dayOfWeekNum = date('N', strtotime($tk->date)); // 1-7
                    $scheduledEnd = null;
                    if ($isCollegeMultiTmp && isset($nonCollegeEndByDay[$dayOfWeekNum])) {
                        $scheduledEnd = $nonCollegeEndByDay[$dayOfWeekNum];
                    } elseif (!empty($emp->work_end_time)) {
                        $scheduledEnd = $emp->work_end_time;
                    }

                    // If multi-role and we don't have a non-college schedule for that day, do not count OT
                    if ($isCollegeMultiTmp && $scheduledEnd === null) {
                        continue;
                    }

                    if ($scheduledEnd) {
                        $workEnd = strtotime($scheduledEnd);
                        $rawOvertimeSeconds = $clockOut - $workEnd;

                        // Start counting overtime only if adjusted raw overtime is >= 3600 seconds (1 hour)
                        if ($rawOvertimeSeconds >= 3600) {
                            $overtime_minutes = $rawOvertimeSeconds / 60;
                            if ($overtime_minutes > 0) {
                                $overtime_hours = round($overtime_minutes / 60, 2); // decimal hours
                                $dayOfWeek = date('N', strtotime($tk->date)); // 1 (Mon) - 7 (Sun)
                                if ($dayOfWeek >= 1 && $dayOfWeek <= 5) {
                                    $pay = round($rate_per_hour * 0.25, 2);
                                    $overtime_count_weekdays += $overtime_hours;
                                    $overtime_pay_weekdays += $pay * $overtime_hours;
                                } else {
                                    $pay = round($rate_per_hour * 0.30, 2);
                                    $overtime_count_weekends += $overtime_hours;
                                    $overtime_pay_weekends += $pay * $overtime_hours;
                                }
                            }
                        }
                    }
                }
            }
            $overtime_count = $overtime_count_weekdays + $overtime_count_weekends;
            $overtime_pay_total = $overtime_pay_weekdays + $overtime_pay_weekends;

            // If employee is a College Instructor ONLY, convert late/undertime to absences
            // and do not count overtime originating from timekeeping records.
            $rolesStrLocal = strtolower((string)($emp->roles ?? ''));
            $tokensLocal = array_filter(array_map('trim', preg_split('/[,\n]+/', $rolesStrLocal)));
            $hasCollegeLocal = strpos($rolesStrLocal, 'college instructor') !== false;
            $isCollegeOnlyLocal = $hasCollegeLocal && (count($tokensLocal) > 0 ? (count(array_filter($tokensLocal, function($t){ return strpos($t, 'college instructor') !== false; })) === count($tokensLocal)) : true);
            if ($isCollegeOnlyLocal) {
                // Move tardiness and undertime to absences
                $absences += round($late_count + $early_count, 2);
                $late_count = 0;
                $early_count = 0;
                // Zero out overtime and pay for college-only instructors
                $overtime_count = 0;
                $overtime_count_weekdays = 0;
                $overtime_count_weekends = 0;
                $overtime_pay_total = 0;
                $overtime = false;
            }

            return [
                'base_salary' => $emp->base_salary,
                'id' => $emp->id,
                'last_name' => $emp->last_name,
                'first_name' => $emp->first_name,
                'middle_name' => $emp->middle_name,
                'employee_types' => $emp->employee_types,
                'employee_status' => $emp->employee_status,
                'roles' => $emp->roles,
                'college_program' => $emp->college_program,
                // Expose basic education level for dialogs (support both keys used in UI)
                'basic_edu_level' => $emp->basic_edu_level ?? null,
                'basic_education_level' => $emp->basic_edu_level ?? null,
                'work_start_time' => $emp->work_start_time,
                'work_end_time' => $emp->work_end_time,
                'work_hours_per_day' => $emp->work_hours_per_day,
                'clock_in' => $clock_in,
                'clock_out' => $clock_out,
                'overtime' => $overtime,
                'late_count' => $late_count,
                'early_count' => $early_count,
                'overtime_count' => $overtime_count,
                'overtime_count_weekdays' => $overtime_count_weekdays,
                'overtime_count_weekends' => $overtime_count_weekends,
                'overtime_pay_total' => $overtime_pay_total,
                'absences' => $absences,
                'rate_per_day' => $rate_per_day,
                'rate_per_hour' => $rate_per_hour,
                // Mirror EmployeesController: expose work_days with role and work_hours, and
                // expose college_schedules (program/day with hours) for UI badge aggregation.
                'work_days' => $emp->workDays
                    ? $emp->workDays->map(function ($wd) {
                        return [
                            'day' => (string) $wd->day,
                            'work_start_time' => $wd->work_start_time,
                            'work_end_time' => $wd->work_end_time,
                            'work_hours' => $wd->work_hours,
                            'role' => $wd->role,
                        ];
                    })->values()->toArray()
                    : [],
                'college_schedules' => $emp->relationLoaded('collegeProgramSchedules') && $emp->collegeProgramSchedules
                    ? $emp->collegeProgramSchedules->map(function ($row) {
                        return [
                            'program_code' => (string) $row->program_code,
                            'day' => (string) $row->day,
                            'hours_per_day' => (float) $row->hours_per_day,
                        ];
                    })->values()->toArray()
                    : [],
            ];
        }, $employees->items());

        return Inertia::render('time-keeping/index', [
            'employees'   => $employeesArray,
            'currentPage' => $employees->currentPage(),
            'totalPages'  => $employees->lastPage(),
            'search'      => $request->input('search', ''),
            'perPage'     => $perPage,
            'othersRoles' => $othersRoles,
            'filters'     => [
                'types'    => (array) $request->input('types', []),
                'statuses' => (array) $request->input('statuses', []),
                'roles'    => array_values((array) $request->input('roles', [])),
                'collegeProgram' => $request->input('collegeProgram', ''),
                'basicEducationLevel' => $request->input('basicEducationLevel', ''),
                'othersRole' => '', // No longer a separate filter, reset for frontend state
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTimeKeepingRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(TimeKeeping $timeKeeping)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TimeKeeping $timeKeeping)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTimeKeepingRequest $request, TimeKeeping $timeKeeping)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TimeKeeping $timeKeeping)
    {
        //
    }
    /**
     * Return computed timekeeping summary for a given employee and month.
     */
    public function monthlySummary(Request $request)
    {
        $employeeId = $request->input('employee_id');
        $month = $request->input('month'); // format: YYYY-MM

        if (!$employeeId || !$month) {
            return response()->json(['success' => false, 'error' => 'Missing parameters']);
        }

        $employee = \App\Models\Employees::find($employeeId);
        if (!$employee) {
            return response()->json(['success' => false, 'error' => 'Employee not found']);
        }

        // Delegate core computation to the shared service
        $service = app(\App\Services\TimekeepingService::class);
        $data = $service->computeMonthlySummary($employeeId, $month);

        // Augment with payroll snapshot to preserve API contract
        $payroll = \App\Models\Payroll::where('employee_id', $employeeId)
            ->where('month', $month)
            ->orderBy('payroll_date', 'desc')
            ->first();
        $data['payroll_gross_pay'] = $payroll ? $payroll->gross_pay : null;
        $data['payroll_total_deductions'] = $payroll ? $payroll->total_deductions : null;
        $data['payroll_net_pay'] = $payroll ? $payroll->net_pay : null;

        // Lightweight debug info to keep shape stable (was previously verbose)
        if (!isset($data['_debug'])) {
            $data['_debug'] = [
                'has_timekeeping_records' => !empty($data['success']) ? (bool)$data['success'] : false,
                'calculated_absences' => $data['absences'] ?? null,
            ];
        }

        return response()->json($data);
    }

    /**
     * Return distinct YYYY-MM months present in timekeeping records, sorted descending.
     */
    public function getAvailableMonths(Request $request)
    {
        $tkMonths = \App\Models\TimeKeeping::selectRaw('DISTINCT LEFT(date, 7) as month')
            ->orderBy('month', 'desc')
            ->pluck('month')
            ->filter()
            ->unique()
            ->values();

        return response()->json([
            'success' => true,
            'months' => $tkMonths,
        ]);
    }

    /**
     * Return employees grouped by whether they have timekeeping records for the given month.
     * GET /api/timekeeping/employees-by-month?month=YYYY-MM
     */
    public function employeesByMonth(Request $request)
    {
        $month = $request->query('month');
        if (!$month || !preg_match('/^\d{4}-\d{2}$/', $month)) {
            return response()->json(['success' => false, 'error' => 'Invalid or missing month'], 400);
        }
        $firstDay = $month . '-01';
        $lastDay = date('Y-m-t', strtotime($firstDay));

        // Employee IDs that have at least one TK record in the month
        $withIds = \App\Models\TimeKeeping::whereBetween('date', [$firstDay, $lastDay])
            ->distinct()
            ->pluck('employee_id')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        $withSet = array_flip($withIds);

        $employees = \App\Models\Employees::select('id', 'first_name', 'middle_name', 'last_name', 'employee_status', 'roles', 'college_program')->get();
        $with = [];
        $without = [];
        foreach ($employees as $e) {
            $fullName = trim(
                trim(($e->last_name ?? '')) . ', ' .
                trim(($e->first_name ?? '') . ' ' . ($e->middle_name ?? ''))
            );
            $item = [
                'id' => $e->id,
                'name' => trim(($e->last_name ?? '') . ', ' . ($e->first_name ?? '')),
                'full_name' => $fullName,
                'first_name' => $e->first_name,
                'middle_name' => $e->middle_name,
                'last_name' => $e->last_name,
                'employee_status' => $e->employee_status,
                'roles' => $e->roles,
                'college_program' => $e->college_program,
            ];
            if (isset($withSet[$e->id])) {
                $with[] = $item;
            } else {
                $without[] = $item;
            }
        }

        return response()->json([
            'success' => true,
            'month' => $month,
            'with' => $with,
            'without' => $without,
            'with_count' => count($with),
            'without_count' => count($without),
        ]);
    }
}
