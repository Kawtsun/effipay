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
            foreach ($records as $tk) {
                if ($tk->clock_out && $emp->work_end_time) {
                    $workEnd = strtotime($emp->work_end_time);
                    $clockOut = strtotime($tk->clock_out);
                    if ($clockOut >= $workEnd + 3600) { // 1 hour after work_end_time
                        $dayOfWeek = date('N', strtotime($tk->date)); // 1 (Mon) - 7 (Sun)
                        if ($dayOfWeek >= 1 && $dayOfWeek <= 5) {
                            $pay = round($rate_per_hour * 0.25, 2); // Weekdays: 25%
                            $overtime_count_weekdays++;
                            $overtime_pay_weekdays += $pay;
                        } else {
                            $pay = round($rate_per_hour * 0.30, 2); // Weekends: 30%
                            $overtime_count_weekends++;
                            $overtime_pay_weekends += $pay;
                        }
                    }
                }
            }
            $overtime_pay_total = $overtime_pay_weekdays + $overtime_pay_weekends;
            return [
                'id' => $emp->id,
                'last_name' => $emp->last_name,
                'first_name' => $emp->first_name,
                'middle_name' => $emp->middle_name,
                'employee_type' => $emp->employee_type,
                'employee_status' => $emp->employee_status,
                'roles' => $emp->roles,
                'base_salary' => $emp->base_salary,
                'overtime_pay_total' => $overtime_pay_total,
                'sss' => $emp->sss,
                'philhealth' => $emp->philhealth,
                'pag_ibig' => $emp->pag_ibig,
                'college_program' => $emp->college_program,
                'withholding_tax' => $emp->withholding_tax,
                'work_hours_per_day' => $emp->work_hours_per_day,
                'work_start_time' => $emp->work_start_time,
                'work_end_time' => $emp->work_end_time,
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
