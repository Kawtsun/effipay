<?php

namespace App\Http\Controllers;

use App\Models\Reports;
use App\Http\Requests\StoreReportsRequest;
use App\Http\Requests\UpdateReportsRequest;
use Inertia\Inertia;

class ReportsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(\Illuminate\Http\Request $request)
    {
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

        // Filter by college program if set
        if ($request->filled('collegeProgram')) {
            $query->where('college_program', $request->collegeProgram);
        }

        $employees = $query->paginate(10)->withQueryString();
        $employeesArray = array_map(function ($emp) {
            $rate_per_day = ($emp->base_salary * 12) / 288;
            $rate_per_hour = $rate_per_day / 8;
            $records = \App\Models\TimeKeeping::where('employee_id', $emp->id)->get();
            $overtime_pay_weekdays = 0;
            $overtime_pay_weekends = 0;
            $overtime_count_weekdays = 0;
            $overtime_count_weekends = 0;
            $tardiness = 0;
            $undertime = 0;
            $absences = 0;
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
            if (!empty($emp->work_hours_per_day)) {
                $absences = round($absent_days * floatval($emp->work_hours_per_day), 2);
            } else {
                $absences = $absent_days;
            }
            foreach ($records as $tk) {
                // Tardiness
                if ($tk->clock_in && $emp->work_start_time) {
                    $late_threshold = date('H:i:s', strtotime($emp->work_start_time) + 15 * 60);
                    if (strtotime($tk->clock_in) > strtotime($late_threshold)) {
                        $late_minutes = (strtotime($tk->clock_in) - strtotime($late_threshold)) / 60;
                        if ($late_minutes > 0) {
                            $tardiness += round($late_minutes / 60, 2);
                        }
                    }
                }
                // Undertime
                if ($tk->clock_out && $emp->work_end_time && strtotime($tk->clock_out) < strtotime($emp->work_end_time)) {
                    $early_minutes = (strtotime($emp->work_end_time) - strtotime($tk->clock_out)) / 60;
                    if ($early_minutes > 0) {
                        $undertime += round($early_minutes / 60, 2);
                    }
                }
                // Overtime
                if ($tk->clock_out && $emp->work_end_time) {
                    $workEnd = strtotime($emp->work_end_time);
                    $clockOut = strtotime($tk->clock_out);
                    if ($clockOut >= $workEnd + 3600) {
                        $overtime_minutes = ($clockOut - $workEnd) / 60 - 59;
                        if ($overtime_minutes >= 1) {
                            $overtime_hours = round($overtime_minutes / 60, 2);
                            $dayOfWeek = date('N', strtotime($tk->date));
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
            $overtime_pay_total = $overtime_pay_weekdays + $overtime_pay_weekends;
            // Deductions
            $total_deductions = floatval($emp->sss) + floatval($emp->philhealth) + floatval($emp->pag_ibig) + floatval($emp->withholding_tax);
            // Gross Pay (subtract tardiness, undertime, absences)
            $gross_pay = floatval($emp->base_salary) + $overtime_pay_total
                - (($rate_per_hour * $tardiness) + ($rate_per_hour * $undertime) + ($rate_per_hour * $absences));
            // Net Pay
            $net_pay = $gross_pay - $total_deductions;
            // Per Payroll (for summary, just net_pay)
            $per_payroll = $net_pay;
            return [
                'id' => $emp->id,
                'last_name' => $emp->last_name,
                'first_name' => $emp->first_name,
                'middle_name' => $emp->middle_name,
                'employee_type' => $emp->employee_type,
                'employee_status' => $emp->employee_status,
                'roles' => $emp->roles,
                'base_salary' => $emp->base_salary,
                'overtime_pay_total' => $overtime_pay_total, // This matches the time keeping tab
                'sss' => $emp->sss,
                'philhealth' => $emp->philhealth,
                'pag_ibig' => $emp->pag_ibig,
                'college_program' => $emp->college_program,
                'withholding_tax' => $emp->withholding_tax,
                'work_hours_per_day' => $emp->work_hours_per_day,
                'work_start_time' => $emp->work_start_time,
                'work_end_time' => $emp->work_end_time,
                'gross_pay' => $gross_pay,
                'total_deductions' => $total_deductions,
                'net_pay' => $net_pay,
                'per_payroll' => $per_payroll,
                'tardiness' => $tardiness,
                'undertime' => $undertime,
                'absences' => $absences,
            ];
        }, $employees->items());

        return Inertia::render('reports/index', [
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
    public function store(StoreReportsRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Reports $reports)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Reports $reports)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateReportsRequest $request, Reports $reports)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Reports $reports)
    {
        //
    }
}
