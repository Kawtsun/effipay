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
                // Resolve employee WITHOUT requiring employee_id: prefer First+Last name match; fallback to ID if provided.
                $employee = null;
                $fn = is_string($firstName) ? trim($firstName) : null;
                $ln = is_string($lastName) ? trim($lastName) : null;
                if ($fn && $ln) {
                    $employee = \App\Models\Employees::whereRaw('LOWER(TRIM(first_name)) = ?', [strtolower($fn)])
                        ->whereRaw('LOWER(TRIM(last_name)) = ?', [strtolower($ln)])
                        ->first();
                }
                if (!$employee && $employeeId) {
                    $employee = \App\Models\Employees::find($employeeId);
                }
                if (!$employee) {
                    $label = trim(($firstName ?? '') . ' ' . ($lastName ?? ''));
                    $label = $label !== '' ? $label : ($employeeId ? ('ID ' . $employeeId) : 'unknown');
                    $errors[] = "Employee not found for row $i ($label).";
                    continue;
                }
                if (empty($date)) {
                    $errors[] = "Date missing for employee #{$employee->id}.";
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
            $overtime_pay_weekdays = 0;
            $overtime_pay_weekends = 0;
            // Night Shift Differential (NSD): hours and pay after 10:00 PM
            $nsd_hours_total = 0; // total hours after 22:00
            $nsd_pay_total = 0;   // corresponding pay (includes +10% bonus)
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
                // Get leave date intervals for this employee (treat any status as leave)
                $leaveIntervals = DB::table('leaves')
                    ->where('employee_id', $emp->id)
                    ->whereNotNull('leave_start_day')
                    ->get(['leave_start_day', 'leave_end_day']);
                $isInLeaveInterval = function ($date) use ($leaveIntervals) {
                    foreach ($leaveIntervals as $interval) {
                        $start = $interval->leave_start_day;
                        $end = $interval->leave_end_day;
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
                // Overtime and Night Shift Differential (NSD):
                // - Overtime starts when actual clock-out is >= 1 hour past scheduled work_end_time
                // - Hours from work_end_time up to 22:00 are counted as regular OT
                // - Hours after 22:00 (10 PM) are counted as NSD (OT with +10% bonus)
                if ($tk->clock_out && $emp->work_end_time) {
                    $workEnd = strtotime($emp->work_end_time);
                    $clockOut = strtotime($tk->clock_out);
                    if ($clockOut >= $workEnd + 3600) { // 1 hour after work_end_time
                        $rawSeconds = $clockOut - $workEnd; // total seconds beyond scheduled end

                        // Split at 22:00 (10 PM) boundary of the same day
                        $boundary22 = strtotime('22:00:00');
                        $otStart = $workEnd;
                        $otEnd = $clockOut;

                        // Pre-22:00 overtime seconds
                        $pre22Seconds = 0;
                        if ($otEnd > $otStart) {
                            $pre22Seconds = max(0, min($otEnd, $boundary22) - $otStart);
                        }
                        // Post-22:00 NSD seconds
                        $post22Seconds = 0;
                        if ($otEnd > $boundary22) {
                            $post22Seconds = max(0, $otEnd - max($otStart, $boundary22));
                        }

                        // Convert to hours with 2-decimals rounding at the end of accumulation
                        $pre22Hours = $pre22Seconds > 0 ? ($pre22Seconds / 3600) : 0;
                        $post22Hours = $post22Seconds > 0 ? ($post22Seconds / 3600) : 0;

                        if ($pre22Hours > 0 || $post22Hours > 0) {
                            $dayOfWeek = date('N', strtotime($tk->date)); // 1 (Mon) - 7 (Sun)
                            $basePayPerHour = ($dayOfWeek >= 1 && $dayOfWeek <= 5)
                                ? ($rate_per_hour * 0.25)
                                : ($rate_per_hour * 0.30);
                            // NSD: add +0.10 of base hourly rate (not +10% of OT rate)
                            // e.g., weekday: 0.25 + 0.10 = 0.35; weekend: 0.30 + 0.10 = 0.40
                            $nsdPayPerHour = $basePayPerHour + ($rate_per_hour * 0.10);

                            // Accumulate pay/hours
                            if ($pre22Hours > 0) {
                                if ($dayOfWeek >= 1 && $dayOfWeek <= 5) {
                                    $overtime_count_weekdays += $pre22Hours;
                                    $overtime_pay_weekdays += $basePayPerHour * $pre22Hours;
                                } else {
                                    $overtime_count_weekends += $pre22Hours;
                                    $overtime_pay_weekends += $basePayPerHour * $pre22Hours;
                                }
                            }
                            if ($post22Hours > 0) {
                                // NSD hours also count toward overtime hours total
                                if ($dayOfWeek >= 1 && $dayOfWeek <= 5) {
                                    $overtime_count_weekdays += $post22Hours;
                                } else {
                                    $overtime_count_weekends += $post22Hours;
                                }
                                $nsd_hours_total += $post22Hours;
                                $nsd_pay_total += $nsdPayPerHour * $post22Hours;
                            }
                        }
                    }
                }
            }
            $overtime_count = $overtime_count_weekdays + $overtime_count_weekends;
            // Total OT pay includes both regular OT pay and NSD pay
            $overtime_pay_total = $overtime_pay_weekdays + $overtime_pay_weekends + $nsd_pay_total;

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
                'nsd_hours' => round($nsd_hours_total, 2),
                'nsd_pay_total' => round($nsd_pay_total, 2),
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

        // Fetch payroll data for this employee and month
        $payroll = \App\Models\Payroll::where('employee_id', $employeeId)
            ->where('month', $month)
            ->orderBy('payroll_date', 'desc')
            ->first();

        // Get all timekeeping records for this employee in the selected month
        $records = \App\Models\TimeKeeping::where('employee_id', $employeeId)
            ->where('date', 'like', "$month%")
            ->get();

        // --- Compute summary values ---

        $late_count = 0;
        $early_count = 0;
    $overtime_count = 0;
        $overtime_count_weekdays = 0;
        $overtime_count_weekends = 0;
        $absences = 0;
    $overtime_pay_total = 0;
    // Night Shift Differential (NSD): hours and pay after 10:00 PM
    $nsd_hours_total = 0;
    $nsd_pay_total = 0;
        // Holiday/Observance double-pay bucket
        $overtime_count_observances = 0; // deprecated: we no longer count observances as OT hours
        $holidayProcessed = [];
        $holiday_hours_total = 0; // total worked hours on whole-day/automated observances
        $holiday_double_pay_amount = 0; // total double-pay amount (2.0x base hourly)
        $holiday_worked = []; // [{date, type, hours, amount}]

        // Use payroll values if available, otherwise fallback to employee
        $base_salary = $payroll ? $payroll->base_salary : $employee->base_salary;
        // Use the employee's specific schedule, fallback to 8
        $work_hours_per_day = $employee->work_hours_per_day ?? 8;

        $rate_per_day = ($base_salary * 12) / 288;
        $rate_per_hour = ($work_hours_per_day > 0) ? ($rate_per_day / $work_hours_per_day) : 0;
        $work_start_time = $employee->work_start_time;
        $work_end_time = $employee->work_end_time;

        $grace_period_default_minutes = 15;

        // Fetch observances for this month early so we can apply per-date rules (e.g., rainy-day -> 60min grace)
        $observancesRows = DB::table('observances')
            ->where('date', 'like', "$month%")
            ->get(['date', 'type', 'is_automated', 'start_time'])
            ->toArray();
        $observanceDates = array_map(function ($o) { return $o->date; }, $observancesRows);
        $observanceSet = array_flip($observanceDates);
        $observanceTypeMap = [];
        $observanceAutomatedMap = [];
        $observanceStartTimeMap = [];
        foreach ($observancesRows as $orow) {
            $observanceTypeMap[$orow->date] = isset($orow->type) ? strtolower(trim((string)$orow->type)) : null;
            $observanceAutomatedMap[$orow->date] = isset($orow->is_automated) ? (bool)$orow->is_automated : false;
            $observanceStartTimeMap[$orow->date] = $orow->start_time ?? null;
        }

        foreach ($records as $tk) {
            // Tardiness (decimal hours)
            if ($tk->clock_in && $work_start_time) {
                $date = $tk->date;
                // Skip tardiness entirely on whole-day suspension
                if (isset($observanceTypeMap[$date]) && $observanceTypeMap[$date] === 'whole-day') {
                    // no tardiness on whole-day observance
                } else {
                    // default grace, override for rainy-day observance
                    $grace = $grace_period_default_minutes;
                    if (isset($observanceTypeMap[$date]) && $observanceTypeMap[$date] === 'rainy-day') {
                        $grace = 60; // 1 hour grace for rainy day
                    }
                    $late_threshold = date('H:i:s', strtotime($work_start_time) + $grace * 60);
                    if (strtotime($tk->clock_in) > strtotime($late_threshold)) {
                        // Count all minutes late from scheduled start time, not from grace period
                        $late_minutes = (strtotime($tk->clock_in) - strtotime($work_start_time)) / 60;
                        if ($late_minutes > 0) {
                            $late_count += ($late_minutes / 60);
                        }
                    }
                }
            }
            // Undertime (decimal hours)
            if ($tk->clock_out && $employee->work_end_time && strtotime($tk->clock_out) < strtotime($employee->work_end_time)) {
                $early_minutes = (strtotime($employee->work_end_time) - strtotime($tk->clock_out)) / 60;
                if ($early_minutes > 0) {
                    $early_count += ($early_minutes / 60);
                }
            }
            // Overtime and Night Shift Differential (NSD)
            // - Overtime starts when actual clock-out is >= 1 hour past scheduled work_end_time
            // - Hours from work_end_time up to 22:00 are counted as regular OT
            // - Hours after 22:00 (10 PM) are counted as NSD (OT with +10% bonus)
            if ($tk->clock_out && $employee->work_end_time) {
                $date = $tk->date;
                // Check holiday/observance: whole-day or automated holiday -> double pay for all worked hours
                $isObservance = isset($observanceSet[$date]);
                $isWholeDay = $isObservance && (isset($observanceTypeMap[$date]) && $observanceTypeMap[$date] === 'whole-day');
                $isAutomatedHoliday = $isObservance && (!empty($observanceAutomatedMap[$date]));
                if (($isWholeDay || $isAutomatedHoliday) && !isset($holidayProcessed[$date])) {
                    // Compute earliest clock_in and latest clock_out for this date
                    $dayRecs = $records->where('date', $date);
                    $earliestIn = null; $latestOut = null;
                    foreach ($dayRecs as $dr) {
                        if (!empty($dr->clock_in)) {
                            $t = strtotime($dr->clock_in);
                            if ($t !== false && ($earliestIn === null || $t < $earliestIn)) $earliestIn = $t;
                        }
                        if (!empty($dr->clock_out)) {
                            $t = strtotime($dr->clock_out);
                            if ($t !== false && ($latestOut === null || $t > $latestOut)) $latestOut = $t;
                        }
                    }
                    if ($earliestIn !== null && $latestOut !== null) {
                        $worked = $latestOut - $earliestIn; if ($worked < 0) $worked += 24 * 60 * 60;
                        // Deduct 1 hour lunch only if shift ended strictly after 13:00 (1 PM)
                        $breakEnd = strtotime('13:00:00');
                        $deduct = ($latestOut > $breakEnd) ? 3600 : 0;
                        $workedSeconds = max(0, $worked - $deduct);
                        $hours = $workedSeconds / 3600;
                        if ($hours > 0) {
                            // Entire worked hours are paid double on holiday/automated observance
                            // IMPORTANT: Do NOT add to overtime counters or overtime pay totals.
                            $holiday_hours_total += $hours;
                            $amount = ($rate_per_hour * 2.0 * $hours);
                            $holiday_double_pay_amount += $amount;
                            $holiday_worked[] = [
                                'date' => $date,
                                'type' => $isAutomatedHoliday ? 'automated-holiday' : ($observanceTypeMap[$date] ?? 'observance'),
                                'hours' => round($hours, 2),
                                'amount' => round($amount, 2),
                            ];
                        }
                    }
                    $holidayProcessed[$date] = true;
                    // Skip regular OT/NSD processing for this date to avoid double counting
                    continue;
                }
                // Half-day observance handling: apply double pay only for hours worked after the half-day start
                $isHalfDay = $isObservance && (isset($observanceTypeMap[$date]) && $observanceTypeMap[$date] === 'half-day');
                if ($isHalfDay && !isset($holidayProcessed[$date])) {
                    // Determine half-day start time; default to 13:00:00 if not provided
                    $halfStart = $observanceStartTimeMap[$date] ?? '13:00:00';
                    // Compute earliest clock_in and latest clock_out for this date
                    $dayRecs = $records->where('date', $date);
                    $earliestIn = null; $latestOut = null;
                    foreach ($dayRecs as $dr) {
                        if (!empty($dr->clock_in)) {
                            $t = strtotime($dr->clock_in);
                            if ($t !== false && ($earliestIn === null || $t < $earliestIn)) $earliestIn = $t;
                        }
                        if (!empty($dr->clock_out)) {
                            $t = strtotime($dr->clock_out);
                            if ($t !== false && ($latestOut === null || $t > $latestOut)) $latestOut = $t;
                        }
                    }
                    if ($earliestIn !== null && $latestOut !== null) {
                        // Build absolute timestamps for half-day start relative to the same day
                        $dayStart = strtotime(date('Y-m-d 00:00:00', strtotime($date)));
                        $halfStartParts = explode(':', $halfStart);
                        $absHalfStart = $dayStart + ((int)$halfStartParts[0]) * 3600 + ((int)$halfStartParts[1]) * 60 + (isset($halfStartParts[2]) ? (int)$halfStartParts[2] : 0);
                        // Adjust for overnight shifts
                        $adjLatestOut = $latestOut;
                        if ($adjLatestOut < $earliestIn) $adjLatestOut += 24 * 60 * 60;
                        // Overlap window is from max(earliestIn, absHalfStart) to latestOut
                        $overlapStart = max($earliestIn, $absHalfStart);
                        $overlapEnd = $adjLatestOut;
                        if ($overlapEnd > $overlapStart) {
                            $overlapSeconds = $overlapEnd - $overlapStart;
                            // Deduct lunch only if overlap crosses 13:00 and starts before 13:00
                            $breakEnd = $dayStart + 13 * 3600; // 13:00:00
                            $deduct = ($overlapEnd > $breakEnd && $overlapStart < $breakEnd) ? 3600 : 0;
                            $workedSeconds = max(0, $overlapSeconds - $deduct);
                            $hours = $workedSeconds / 3600;
                            if ($hours > 0) {
                                $holiday_hours_total += $hours;
                                $amount = ($rate_per_hour * 2.0 * $hours);
                                $holiday_double_pay_amount += $amount;
                                $holiday_worked[] = [
                                    'date' => $date,
                                    'type' => 'half-day',
                                    'hours' => round($hours, 2),
                                    'amount' => round($amount, 2),
                                ];
                            }
                        }
                    }
                    // Prevent double-processing for the same date but keep OT/NSD logic running
                    $holidayProcessed[$date] = true;
                }
                $workEnd = strtotime($employee->work_end_time);
                $clockOut = strtotime($tk->clock_out);

                // Calculate the total raw difference in seconds between actual clock out and scheduled work end
                $rawOvertimeSeconds = $clockOut - $workEnd;

                if ($rawOvertimeSeconds >= 3600) { // threshold: at least 1 hour beyond scheduled end
                    $otStart = $workEnd;
                    $otEnd = $clockOut;
                    $boundary22 = strtotime('22:00:00');

                    // Pre-22:00 OT seconds and Post-22:00 NSD seconds
                    $pre22Seconds = max(0, min($otEnd, $boundary22) - $otStart);
                    $post22Seconds = $otEnd > $boundary22 ? max(0, $otEnd - max($otStart, $boundary22)) : 0;

                    $pre22Hours = $pre22Seconds > 0 ? ($pre22Seconds / 3600) : 0;
                    $post22Hours = $post22Seconds > 0 ? ($post22Seconds / 3600) : 0;

                    if ($pre22Hours > 0 || $post22Hours > 0) {
                        $dayOfWeek = date('N', strtotime($tk->date));
                        $basePayPerHour = ($dayOfWeek >= 1 && $dayOfWeek <= 5)
                            ? ($rate_per_hour * 0.25)
                            : ($rate_per_hour * 0.30);
                        // NSD: +10% of base hourly rate on top of the OT rate
                        $nsdPayPerHour = $basePayPerHour + ($rate_per_hour * 0.10);

                        // Count hours
                        $overtime_count += ($pre22Hours + $post22Hours);
                        if ($dayOfWeek >= 1 && $dayOfWeek <= 5) {
                            $overtime_count_weekdays += ($pre22Hours + $post22Hours);
                        } else {
                            $overtime_count_weekends += ($pre22Hours + $post22Hours);
                        }

                        // Accumulate pay
                        $overtime_pay_total += ($basePayPerHour * $pre22Hours);
                        $overtime_pay_total += ($nsdPayPerHour * $post22Hours);

                        // Track NSD breakdown
                        $nsd_hours_total += $post22Hours;
                        $nsd_pay_total += ($nsdPayPerHour * $post22Hours);
                    }
                }
                // If < 1 hour beyond scheduled end, no overtime/NSD is counted.
            }
        }

        // --- NEW LEAVE DATE CALCULATION (Fix for Missing Status Column) ---
        $monthStart = $month . '-01';
        $monthEnd = date('Y-m-t', strtotime($monthStart));

        // 1. Fetch ALL leave records that intersect with the current month.
        // We are skipping the 'status' filter as the column does not yet exist.
        // All found leaves are currently treated as excused/approved for absence calculation.
    $approvedLeaves = \App\Models\Leave::where('employee_id', $employeeId)
            ->where(function ($query) use ($monthStart, $monthEnd) {
                // Ensure the leave period overlaps the month
                $query->where('leave_start_day', '<=', $monthEnd)
                    ->where('leave_end_day', '>=', $monthStart);
            })
            // ->where('status', 'Approved') // Ensure we only count approved leaves
            ->get(['leave_start_day', 'leave_end_day', 'status']);

    $leaveDatesMap = []; // NEW: This will hold date => type mapping

        foreach ($approvedLeaves as $leave) {
            $startDate = max($leave->leave_start_day, $monthStart);
            $endDate = min($leave->leave_end_day, $monthEnd);

            $period = new \DatePeriod(
                new \DateTime($startDate),
                new \DateInterval('P1D'),
                (new \DateTime($endDate))->modify('+1 day')
            );

            // CHANGE HERE: Access $leave->status, not $leave->leave_type
            $type = $leave->status ?? 'DEFAULT'; // Use the status, fallback to DEFAULT if null (shouldn't happen)

            foreach ($period as $dateObj) {
                // Use the status as the value in the map
                $leaveDatesMap[$dateObj->format('Y-m-d')] = $type;
            }
        }
    // Build a quick lookup set for leave dates
    $leaveDatesSet = [];
    foreach ($leaveDatesMap as $d => $_type) { $leaveDatesSet[$d] = true; }
    // --- END MODIFIED LEAVE DATE CALCULATION ---

        // Note: observanceSet and observanceTypeMap were populated earlier for this month

        // FIX: Define daysInMonth for the loop to work
        $daysInMonth = (int)date('t', strtotime($monthStart));

        // Build merged schedules from workDays and college program schedules (parity with AttendanceCards)
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

            // If worked, compute deficit for college roles and treat as absence hours
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

        $hasData = $records->count() > 0;
        // Calculate total_hours for all roles: sum of actual hours worked from time in/out (only on scheduled work days, minus 1 hour break per day if worked at least 4 hours)
        $actualHoursWorked = 0;
        foreach ($records as $tk) {
            $date = $tk->date;
            $dayOfWeekNum = date('w', strtotime($date));
            $dayOfWeekStr = $phpDayToStr[$dayOfWeekNum];
            $workDay = $workDaysModels->get($dayOfWeekStr, $workDaysModels->get($dayOfWeekNum));
            if (!$workDay) continue;
            if (!empty($tk->clock_in) && !empty($tk->clock_out)) {
                // Use scheduled start from workDay if available
                $scheduledStart = !empty($workDay->work_start_time) ? strtotime($workDay->work_start_time) : null;
                $in = strtotime($tk->clock_in);
                $out = strtotime($tk->clock_out);
                // If clock_in is earlier than scheduled start, use scheduled start
                if ($scheduledStart && $in < $scheduledStart) {
                    $in = $scheduledStart;
                }
                $worked = $out - $in;
                if ($worked < 0) $worked += 24 * 60 * 60;
                $hours = $worked / 3600;

                // Define the fixed break end time and deduction duration
                $fixedBreakEnd = strtotime('13:00:00'); // 1:00:00 PM
                $breakDurationSeconds = 3600;             // 1 hour

                // Check 1: Did the actual clock-out end strictly LATER THAN 1:00 PM?
                // Note the change from >= to >
                $actualShiftEndsAfterBreak = ($out > $fixedBreakEnd);

                if ($actualShiftEndsAfterBreak) {
                    // If yes, deduct the fixed 1 hour.
                    $finalDeductionSeconds = $breakDurationSeconds;
                } else {
                    // If no, deduct nothing.
                    $finalDeductionSeconds = 0;
                }

                $workedSeconds = $worked - $finalDeductionSeconds;
                $hours = $workedSeconds / 3600;
                $actualHoursWorked += max(0, $hours);
            }
        }

        // --- DEBUG BLOCK ---
        $isAbsencesValidNumber = is_numeric($absences);
        $workHoursExists = !empty($employee->work_hours_per_day);

        $debug = [
            'has_timekeeping_records' => $hasData,
            'is_absences_numeric' => $isAbsencesValidNumber,
            'employee_work_hours_per_day_value' => $employee->work_hours_per_day,
            'work_hours_per_day_exists' => $workHoursExists,
            'calculated_absences' => round($absences, 2),
            'display_absences_condition_2' => $isAbsencesValidNumber && $workHoursExists,
            'leave_dates_map' => $leaveDatesMap,
        ];
        // --- END DEBUG BLOCK ---

        $response = [
            'success' => $hasData,
            'tardiness' => round($late_count, 2),
            'undertime' => round($early_count, 2),
            'overtime' => round($overtime_count, 2),
            'overtime_count_weekdays' => round($overtime_count_weekdays, 2),
            'overtime_count_weekends' => round($overtime_count_weekends, 2),
            'overtime_count_observances' => 0.0, // observance hours are paid separately as Double Pay
            'absences' => round($absences, 2),
            'base_salary' => $base_salary,
            'rate_per_day' => $rate_per_day,
            'rate_per_hour' => $rate_per_hour,
            'overtime_pay_total' => round($overtime_pay_total, 2),
            'nsd_hours' => round($nsd_hours_total, 2),
            'nsd_pay_total' => round($nsd_pay_total, 2),
            // New: separate double pay fields for whole-day/automated observances
            'holiday_double_pay_hours' => round($holiday_hours_total, 2),
            'holiday_double_pay_amount' => round($holiday_double_pay_amount, 2),
            'holiday_worked' => $holiday_worked,
            'payroll_gross_pay' => $payroll ? $payroll->gross_pay : null,
            'payroll_total_deductions' => $payroll ? $payroll->total_deductions : null,
            'payroll_net_pay' => $payroll ? $payroll->net_pay : null,
            'total_hours' => round($actualHoursWorked, 2),
            // Including work_hours_per_day for front-end conditional logic
            'work_hours_per_day' => $employee->work_hours_per_day,

            // DEBUG DATA
            '_debug' => $debug,
        ];

        // If College Instructor, add college_rate
        if ($employee && is_string($employee->roles) && stripos($employee->roles, 'college instructor') !== false) {
            $response['college_rate'] = $employee->college_rate ?? null;
        }
        return response()->json($response);
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

    /**
     * Fetch all leave ranges for a given employee.
     * GET /api/leaves?employee_id=123
     */
    public function getEmployeeLeaves(Request $request)
    {
        $employeeId = $request->query('employee_id');
        if (!$employeeId) {
            return response()->json(['success' => false, 'error' => 'Missing employee_id'], 400);
        }
        try {
            $rows = DB::table('leaves')
                ->where('employee_id', $employeeId)
                ->orderByDesc('leave_start_day')
                ->get(['id', 'status', 'leave_start_day', 'leave_end_day']);
            return response()->json(['success' => true, 'leaves' => $rows]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => 'Failed to fetch leaves'], 500);
        }
    }

    /**
     * Create or update a leave range for an employee.
     * POST /api/leaves/upsert
     * Body: { leave_id?, employee_id, status, leave_start_day(YYYY-MM-DD), leave_end_day(YYYY-MM-DD|null) }
     */
    public function upsertEmployeeLeave(Request $request)
    {
        $data = $request->validate([
            'leave_id' => 'nullable|integer',
            'employee_id' => 'required|integer|exists:employees,id',
            'status' => 'required|string|max:255',
            'leave_start_day' => 'required|date_format:Y-m-d',
            'leave_end_day' => 'nullable|date_format:Y-m-d|after_or_equal:leave_start_day',
        ]);

        try {
            $id = $data['leave_id'] ?? null;
            unset($data['leave_id']);

            if ($id) {
                DB::table('leaves')->where('id', $id)->update([
                    'employee_id' => $data['employee_id'],
                    'status' => $data['status'],
                    'leave_start_day' => $data['leave_start_day'],
                    'leave_end_day' => $data['leave_end_day'] ?? null,
                    'updated_at' => now('Asia/Manila'),
                ]);
                $row = DB::table('leaves')->where('id', $id)->first();
                // Audit
                try {
                    AuditLogs::create([
                        'username'    => Auth::user()->username ?? 'system',
                        'action'      => 'update leave',
                        'name'        => (string)($row->status ?? 'leave'),
                        'entity_type' => 'leave',
                        'entity_id'   => $id,
                        'details'     => json_encode($data),
                        'date'        => now('Asia/Manila'),
                    ]);
                } catch (\Throwable $e) {}
                return response()->json(['success' => true, 'leave' => $row]);
            } else {
                $newId = DB::table('leaves')->insertGetId([
                    'employee_id' => $data['employee_id'],
                    'status' => $data['status'],
                    'leave_start_day' => $data['leave_start_day'],
                    'leave_end_day' => $data['leave_end_day'] ?? null,
                    'created_at' => now('Asia/Manila'),
                    'updated_at' => now('Asia/Manila'),
                ]);
                $row = DB::table('leaves')->where('id', $newId)->first();
                try {
                    AuditLogs::create([
                        'username'    => Auth::user()->username ?? 'system',
                        'action'      => 'create leave',
                        'name'        => (string)($row->status ?? 'leave'),
                        'entity_type' => 'leave',
                        'entity_id'   => $newId,
                        'details'     => json_encode($data),
                        'date'        => now('Asia/Manila'),
                    ]);
                } catch (\Throwable $e) {}
                return response()->json(['success' => true, 'leave' => $row]);
            }
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json(['success' => false, 'errors' => $ve->errors()], 422);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => 'Failed to save leave'], 500);
        }
    }

    /**
     * Delete a leave by ID.
     * POST /api/leaves/delete  Body: { leave_id }
     */
    public function deleteEmployeeLeave(Request $request)
    {
        $request->validate(['leave_id' => 'required|integer|exists:leaves,id']);
        $id = (int)$request->input('leave_id');
        try {
            $row = DB::table('leaves')->where('id', $id)->first();
            DB::table('leaves')->where('id', $id)->delete();
            try {
                AuditLogs::create([
                    'username'    => Auth::user()->username ?? 'system',
                    'action'      => 'delete leave',
                    'name'        => (string)($row->status ?? 'leave'),
                    'entity_type' => 'leave',
                    'entity_id'   => $id,
                    'details'     => json_encode(['id' => $id]),
                    'date'        => now('Asia/Manila'),
                ]);
            } catch (\Throwable $e) {}
            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'error' => 'Failed to delete leave'], 500);
        }
    }
}
