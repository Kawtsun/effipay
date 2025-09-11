<?php

namespace App\Http\Controllers;

use App\Models\TimeKeeping;
use App\Http\Requests\StoreTimeKeepingRequest;
use App\Http\Requests\UpdateTimeKeepingRequest;
use Inertia\Inertia;
use Illuminate\Http\Request;

class TimeKeepingController extends Controller
{
    /**
     * Import time keeping records from uploaded file.
     */
    public function import(Request $request)
    {
        $records = $request->input('records', []);
        $imported = 0;
        foreach ($records as $row) {
            // Normalize keys to lowercase for robust matching
            $imported = 0;
            $errors = [];
            $shownIdNameError = false;
            foreach ($records as $i => $row) {
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
                // Convert MM/DD/YYYY to YYYY-MM-DD if needed
                if ($date && preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $date, $matches)) {
                    $date = $matches[3] . '-' . $matches[1] . '-' . $matches[2];
                }
                $employee = $employeeId ? \App\Models\Employees::where('id', $employeeId)->first() : null;
                if (!$employee) {
                    $errors[] = "Employee ID $employeeId.";
                    continue;
                }
                // Verify first name and last name
                if (
                    ($firstName && strtolower(trim($employee->first_name)) !== strtolower(trim($firstName))) ||
                    ($lastName && strtolower(trim($employee->last_name)) !== strtolower(trim($lastName)))
                ) {
                    if (!$shownIdNameError) {
                        $errors[] = "Import Error: An Employee's Id and Name does not match correctly";
                        $shownIdNameError = true;
                    }
                    continue;
                }
                if (empty($date)) {
                    $errors[] = "Date missing.";
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
            }
            if ($imported > 0) {
                return response()->json(['success' => true, 'imported' => $imported, 'errors' => $errors]);
            } else {
                return response()->json(['success' => false, 'imported' => 0, 'errors' => $errors], 400);
            }
        }
        return response()->json(['success' => true, 'imported' => $imported]);
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $request = request();
        $query = \App\Models\Employees::query();

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('last_name', 'like', '%' . $request->search . '%')
                    ->orWhere('first_name', 'like', '%' . $request->search . '%')
                    ->orWhere('middle_name', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('types')) {
            $query->whereIn('employee_type', $request->types);
        }

        if ($request->filled('statuses')) {
            $query->whereIn('employee_status', $request->statuses);
        }

        if ($request->filled('roles') && is_array($request->roles) && count($request->roles)) {
            $query->where(function($q) use ($request) {
                foreach ($request->roles as $role) {
                    $q->orWhere('roles', 'like', '%' . $role . '%');
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

        $employees = $query->paginate(10)->withQueryString();

        $employeesArray = array_map(function ($emp) {
            // Overtime pay calculation function (matches frontend)
            $calculateOvertimePay = function($date, $ratePerHour) {
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
            $late_threshold = null;
            if ($emp->work_start_time) {
                $late_threshold = date('H:i:s', strtotime($emp->work_start_time) + 15 * 60);
            }
            $overtime_pay_weekdays = 0;
            $overtime_pay_weekends = 0;
            $overtime_count_weekdays = 0;
            $overtime_count_weekends = 0;
            // Absences: count days with no clock_in and clock_out, then convert to decimal hours
            $absent_days = 0;
            $dates = $records->pluck('date')->unique();
            foreach ($dates as $date) {
                $dayRecords = $records->where('date', $date);
                $hasClockIn = $dayRecords->contains(function ($tk) { return !empty($tk->clock_in); });
                $hasClockOut = $dayRecords->contains(function ($tk) { return !empty($tk->clock_out); });
                if (!$hasClockIn && !$hasClockOut) {
                    $absent_days++;
                }
            }
            $absences = 0;
            if (!empty($emp->work_hours_per_day)) {
                $absences = round($absent_days * floatval($emp->work_hours_per_day), 2); // decimal hours
            } else {
                $absences = $absent_days; // fallback to days if no schedule
            }
            foreach ($records as $tk) {
                // Tardiness: count decimal hours late (not stacked)
                if ($tk->clock_in && $late_threshold && strtotime($tk->clock_in) > strtotime($late_threshold)) {
                    $late_minutes = (strtotime($tk->clock_in) - strtotime($late_threshold)) / 60;
                    if ($late_minutes > 0) {
                        $late_count += round($late_minutes / 60, 2); // decimal hours
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
                if ($tk->clock_out && $emp->work_end_time) {
                    $workEnd = strtotime($emp->work_end_time);
                    $clockOut = strtotime($tk->clock_out);
                    if ($clockOut >= $workEnd + 3600) { // 1 hour after work_end_time
                        $overtime_minutes = ($clockOut - $workEnd) / 60 - 59; // subtract 59 minutes (inclusive)
                        if ($overtime_minutes >= 1) {
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
            $overtime_count = $overtime_count_weekdays + $overtime_count_weekends;
            $overtime_pay_total = $overtime_pay_weekdays + $overtime_pay_weekends;

            return [
                'base_salary' => $emp->base_salary,
                'id' => $emp->id,
                'last_name' => $emp->last_name,
                'first_name' => $emp->first_name,
                'middle_name' => $emp->middle_name,
                'employee_type' => $emp->employee_type,
                'employee_status' => $emp->employee_status,
                'roles' => $emp->roles,
                'college_program' => $emp->college_program,
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
            ];
        }, $employees->items());

        return Inertia::render('time-keeping/index', [
            'employees'   => $employeesArray,
            'currentPage' => $employees->currentPage(),
            'totalPages'  => $employees->lastPage(),
            'search'      => $request->input('search', ''),
            'filters'     => [
                'types'    => (array) $request->input('types', []),
                'statuses' => (array) $request->input('statuses', []),
                'roles'    => array_values((array) $request->input('roles', [])),
                'collegeProgram' => $request->input('collegeProgram', ''),
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

        // Get all timekeeping records for this employee in the selected month
        $records = \App\Models\TimeKeeping::where('employee_id', $employeeId)
            ->where('date', 'like', "$month%")
            ->get();

        // --- Compute summary values ---
        $late_count = 0;
        $early_count = 0;
        $overtime_count = 0;
        $absences = 0;
        $overtime_pay_total = 0;

        $rate_per_day = ($employee->base_salary * 12) / 288;
        $rate_per_hour = $rate_per_day / 8;

        $late_threshold = $employee->work_start_time ? date('H:i:s', strtotime($employee->work_start_time) + 15 * 60) : null;

        foreach ($records as $tk) {
            // Tardiness (decimal hours)
            if ($tk->clock_in && $late_threshold && strtotime($tk->clock_in) > strtotime($late_threshold)) {
                $late_minutes = (strtotime($tk->clock_in) - strtotime($late_threshold)) / 60;
                if ($late_minutes > 0) {
                    $late_count += round($late_minutes / 60, 2);
                }
            }
            // Undertime (decimal hours)
            if ($tk->clock_out && $employee->work_end_time && strtotime($tk->clock_out) < strtotime($employee->work_end_time)) {
                $early_minutes = (strtotime($employee->work_end_time) - strtotime($tk->clock_out)) / 60;
                if ($early_minutes > 0) {
                    $early_count += round($early_minutes / 60, 2);
                }
            }
            // Overtime (decimal hours, start counting after exactly 1 hour past work end time)
            if ($tk->clock_out && $employee->work_end_time) {
                $workEnd = strtotime($employee->work_end_time);
                $clockOut = strtotime($tk->clock_out);
                // Only count overtime after exactly 1 hour past work end time
                if ($clockOut > $workEnd + 3600) {
                    $overtime_minutes = ($clockOut - ($workEnd + 3600)) / 60;
                    if ($overtime_minutes > 0) {
                        $overtime_hours = round($overtime_minutes / 60, 2);
                        $dayOfWeek = date('N', strtotime($tk->date));
                        $pay = ($dayOfWeek >= 1 && $dayOfWeek <= 5)
                            ? round($rate_per_hour * 0.25, 2)
                            : round($rate_per_hour * 0.30, 2);
                        $overtime_count += $overtime_hours;
                        $overtime_pay_total += $pay * $overtime_hours;
                    }
                }
            }
        }

        // Absences: count days with no clock_in and clock_out, then convert to decimal hours
        $absent_days = 0;
        $dates = $records->pluck('date')->unique();
        foreach ($dates as $date) {
            $dayRecords = $records->where('date', $date);
            $hasClockIn = $dayRecords->contains(function ($tk) { return !empty($tk->clock_in); });
            $hasClockOut = $dayRecords->contains(function ($tk) { return !empty($tk->clock_out); });
            if (!$hasClockIn && !$hasClockOut) {
                $absent_days++;
            }
        }
        $absences = 0;
        if (!empty($employee->work_hours_per_day)) {
            $absences = round($absent_days * floatval($employee->work_hours_per_day), 2);
        } else {
            $absences = $absent_days;
        }

        // If there is at least one record in the month, always return success and computed values
        $hasData = $records->count() > 0;
        return response()->json([
            'success' => $hasData,
            'tardiness' => $late_count,
            'undertime' => $early_count,
            'overtime' => $overtime_count,
            'absences' => $absences,
            'base_salary' => $employee->base_salary,
            'rate_per_day' => $rate_per_day,
            'rate_per_hour' => $rate_per_hour,
            'overtime_pay_total' => $overtime_pay_total,
        ]);
    }
}
