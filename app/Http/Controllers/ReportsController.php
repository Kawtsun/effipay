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

        $standardRoles = ['administrator', 'college instructor', 'basic education instructor'];

        if ($request->filled('roles') && is_array($request->roles) && count($request->roles)) {
            $query->where(function($q) use ($request, $standardRoles) {
                $rolesToFilter = $request->roles;

                // If 'others' is in the filter, it means "any role that is not a standard one".
                if (in_array('others', $rolesToFilter)) {
                    $rolesToFilter = array_diff($rolesToFilter, ['others']); // Remove 'others' from specific checks
                    $q->orWhere(function($subQuery) use ($standardRoles) {
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

        // Filter by college program if set (only when college instructor is selected)
        if ($request->filled('collegeProgram') && 
            $request->filled('roles') && 
            is_array($request->roles) && 
            in_array('college instructor', $request->roles)) {
            $query->where('college_program', $request->collegeProgram);
        }

        // Get available custom roles (others roles)
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

        // Get perPage from request, prioritizing 'perPage' then 'per_page', defaulting to 10
        $perPage = $request->input('perPage') ?? $request->input('per_page', 10);
        $perPage = max(1, min(100, (int) $perPage)); // Ensure it's between 1 and 100
        
        $employees = $query->with('workDays')->paginate($perPage)->withQueryString();
        $month = $request->input('month'); // Optionally filter by month
        $employeesArray = array_map(function ($emp) use ($month) {
            // Fetch payroll for this employee and month (if month provided)
            $payroll = null;
            if ($month) {
                $payroll = \App\Models\Payroll::where('employee_id', $emp->id)
                    ->where('month', $month)
                    ->orderBy('payroll_date', 'desc')
                    ->first();
            }
            // Fallback to employee values if no payroll
            $base_salary = $payroll ? $payroll->base_salary : $emp->base_salary;
            $overtime_pay_total = $payroll ? $payroll->overtime_pay : 0;
            $sss = $payroll ? $payroll->sss : $emp->sss;
            $philhealth = $payroll ? $payroll->philhealth : $emp->philhealth;
            $pag_ibig = $payroll ? $payroll->pag_ibig : $emp->pag_ibig;
            $withholding_tax = $payroll ? $payroll->withholding_tax : $emp->withholding_tax;
            $gross_pay = $payroll ? $payroll->gross_pay : null;
            $total_deductions = $payroll ? $payroll->total_deductions : null;
            $net_pay = $payroll ? $payroll->net_pay : null;
            return [
                'id' => $emp->id,
                'last_name' => $emp->last_name,
                'first_name' => $emp->first_name,
                'middle_name' => $emp->middle_name,
                'employee_type' => $emp->employee_type,
                'employee_status' => $emp->employee_status,
                'roles' => $emp->roles,
                'base_salary' => $base_salary,
                'overtime_pay_total' => $overtime_pay_total,
                'sss' => $sss,
                'philhealth' => $philhealth,
                'pag_ibig' => $pag_ibig,
                'college_program' => $emp->college_program,
                'withholding_tax' => $withholding_tax,
                'work_hours_per_day' => $emp->work_hours_per_day,
                'work_start_time' => $emp->work_start_time,
                'work_end_time' => $emp->work_end_time,
                'gross_pay' => $gross_pay,
                'total_deductions' => $total_deductions,
                'net_pay' => $net_pay,
                'per_payroll' => $net_pay, // For summary, just net_pay
                // Optionally add more payroll fields as needed
                'work_days' => $emp->workDays ? $emp->workDays->map(function($wd) {
                    return [
                        'id' => $wd->id,
                        'day' => $wd->day,
                        'work_start_time' => $wd->work_start_time,
                        'work_end_time' => $wd->work_end_time,
                    ];
                })->toArray() : [],
            ];
        }, $employees->items());

        return Inertia::render('reports/index', [
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
