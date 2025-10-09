<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

use App\Models\Employees;
use App\Http\Requests\StoreEmployeesRequest;
use App\Http\Requests\UpdateEmployeesRequest;
use App\Models\Salary;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class EmployeesController extends Controller
{
    // Fixed allowed number of leaves per employee
    public const LEAVE_LIMIT = 2; // Change this value as needed
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Employees::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
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

        // Robust comma-separated role matching for all roles (including custom roles)
        if ($request->filled('roles') && is_array($request->roles) && count($request->roles)) {
            $query->where(function($q) use ($request, $standardRoles) {
                $rolesToFilter = $request->roles;

                // If 'others' is in the filter, it means "any role that is not a standard one".
                if (in_array('others', $rolesToFilter)) {
                    $rolesToFilter = array_diff($rolesToFilter, ['others']); // Remove 'others' from specific checks
                    $q->orWhere(function($subQuery) use ($standardRoles) {
                        // This subquery should find employees where the roles string does NOT contain ANY of the standard roles.
                        // The AND logic here is correct.
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
        
        // Get all unique roles from employees, robust to spaces/casing, but preserve original for display
        $allRolesRaw = Employees::pluck('roles')->filter()->map(function ($roles) {
            return explode(',', $roles);
        })->flatten()->map(function ($role) {
            return trim($role);
        })->filter()->unique()->values();

        $standardRoles = ['administrator', 'college instructor', 'basic education instructor'];
        // Build a lookup for lowercased/trimmed roles
        $allRolesLookup = $allRolesRaw->mapWithKeys(function ($role) {
            return [strtolower($role) => $role];
        });
        $customRoles = $allRolesLookup->filter(function ($origRole, $lowerRole) use ($standardRoles) {
            return !in_array($lowerRole, $standardRoles);
        })->map(function ($origRole) {
            return [
                'value' => $origRole,
                'label' => ucwords($origRole)
            ];
        })->values()->toArray();
        $othersRoles = $customRoles;

        // ...existing code...

        // Resolve page size from request (supports both perPage and per_page)
        $perPage = (int) ($request->input('perPage', $request->input('per_page', 10)));
        if ($perPage <= 0) { $perPage = 10; }
        $employees = $query->with('workDays')->paginate($perPage)->withQueryString();

        // Ensure all required fields are present for each employee, including work_days
        $employeesArray = array_map(function ($emp) {
            return [
                'id' => $emp->id,
                'last_name' => $emp->last_name,
                'first_name' => $emp->first_name,
                'middle_name' => $emp->middle_name,
                'employee_type' => $emp->employee_type,
                'employee_status' => $emp->employee_status,
                'roles' => $emp->roles,
                'base_salary' => $emp->base_salary,
                'college_rate' => $emp->college_rate,
                'sss' => $emp->sss,
                'philhealth' => $emp->philhealth,
                'pag_ibig' => $emp->pag_ibig,
                'college_program' => $emp->college_program,
                'withholding_tax' => $emp->withholding_tax,
                'work_hours_per_day' => $emp->work_hours_per_day,
                'work_start_time' => $emp->work_start_time,
                'work_end_time' => $emp->work_end_time,
                'sss_salary_loan' => $emp->sss_salary_loan,
                'sss_calamity_loan' => $emp->sss_calamity_loan,
                'pagibig_multi_loan' => $emp->pagibig_multi_loan,
                'pagibig_calamity_loan' => $emp->pagibig_calamity_loan,
                'peraa_con' => $emp->peraa_con,
                'tuition' => $emp->tuition,
                'china_bank' => $emp->china_bank,
                'tea' => $emp->tea,
                'honorarium' => $emp->honorarium,
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

        // DEBUG: Log all roles and custom roles extraction (after variables are defined)
        Log::info('EMPLOYEES_ROLES_DEBUG', [
            'allRolesRaw' => isset($allRolesRaw) ? $allRolesRaw->toArray() : null,
            'allRolesLookup' => isset($allRolesLookup) ? $allRolesLookup->toArray() : null,
            'customRoles' => isset($customRoles) ? $customRoles : null,
        ]);
        return Inertia::render('employees/index', [
            'employees'   => $employeesArray,
            'currentPage' => $employees->currentPage(),
            'totalPages'  => $employees->lastPage(),
            'perPage'     => $perPage,
            'search'      => $request->input('search', ''),
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
    public function create(Request $request)
    {
        $search   = $request->input('search', '');
        $types    = (array) $request->input('types', []);
        $statuses = (array) $request->input('statuses', []);
        $roles    = (array) $request->input('roles', []);
        $page     = $request->input('page', 1);
        $perPage  = (int) $request->input('perPage', $request->input('per_page', 10));

        $employeeTypes = ['Full Time', 'Part Time', 'Provisionary', 'Regular'];
        $salaryDefaults = \App\Models\Salary::whereIn('employee_type', $employeeTypes)
            ->get()
            ->mapWithKeys(fn($row) => [
                $row->employee_type => [
                    'base_salary'     => $row->base_salary,
                    'college_rate'    => $row->college_rate,
                    'sss'             => $row->sss,
                    'philhealth'      => $row->philhealth,
                    'pag_ibig'        => $row->pag_ibig,
                    'withholding_tax' => $row->withholding_tax,
                    'work_hours_per_day' => $row->work_hours_per_day,
                ],
            ])
            ->toArray();

        return Inertia::render('employees/create', [
            'search'          => $search,
            'filters'         => ['types' => $types, 'statuses' => $statuses, 'roles' => $roles],
            'page'            => $page,
            'perPage'         => $perPage,
            'employeeTypes'   => $employeeTypes,
            'salaryDefaults'  => $salaryDefaults,
            'employee'        => [
                'honorarium' => '', // default empty for new employee
                'work_days' => [], // default empty work_days for new employee
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEmployeesRequest $request)
    {

        $data = $request->validated();
        // Always set college_rate from rate_per_hour if present in request
        if (request()->has('rate_per_hour')) {
            $data['college_rate'] = request()->input('rate_per_hour');
        }
        $rolesArr = isset($data['roles']) ? (is_array($data['roles']) ? $data['roles'] : explode(',', $data['roles'])) : [];
        $isCollege = in_array('college instructor', $rolesArr);
        $isAdmin = in_array('administrator', $rolesArr);
        $isBasicEdu = in_array('basic education instructor', $rolesArr);
        $isOthersOnly = count($rolesArr) === 1 && !$isCollege && !$isAdmin && !$isBasicEdu && $rolesArr[0] !== '';
        // Do not force nulls; always save what the frontend sends so backend matches frontend

        // Sanitize numeric fields: convert empty strings to null
        foreach ([
            'base_salary', 'sss', 'philhealth', 'pag_ibig', 'withholding_tax',
            'college_rate', 'rate_per_hour',
            'sss_salary_loan', 'sss_calamity_loan', 'pagibig_multi_loan', 'pagibig_calamity_loan',
            'peraa_con', 'tuition', 'china_bank', 'tea', 'honorarium'
        ] as $field) {
            if (isset($data[$field]) && ($data[$field] === '' || $data[$field] === null)) {
                $data[$field] = null;
            }
        }

        $employee = Employees::create($data);

        // Save per-day work times if provided
    $workDays = $request['work_days'] ?? [];
        if (is_array($workDays) && count($workDays)) {
            foreach ($workDays as $workDay) {
                if (
                    isset($workDay['day']) &&
                    isset($workDay['work_start_time']) &&
                    isset($workDay['work_end_time'])
                ) {
                    $employee->workDays()->create([
                        'day' => $workDay['day'],
                        'work_start_time' => $workDay['work_start_time'],
                        'work_end_time' => $workDay['work_end_time'],
                    ]);
                }
            }
        }
        // Audit log: employee created
        $username = (Auth::check() && Auth::user() && Auth::user()->username) ? Auth::user()->username : 'system';
        \App\Models\AuditLogs::create([
            'username'    => $username,
            'action'      => 'created',
            'name'        => $employee->last_name . ', ' . $employee->first_name,
            'entity_type' => 'employee',
            'entity_id'   => $employee->id,
            'details'     => json_encode($data),
            'date'        => now('Asia/Manila'),
        ]);

        // Restore previous filters from referer
        $redirectParams = [];
        $referer = request()->header('referer');
        if ($referer) {
            $query = parse_url($referer, PHP_URL_QUERY);
            if ($query) {
                parse_str($query, $params);
                // In store and update, always preserve all filters, and ensure roles is always an array if present
                foreach (['search', 'types', 'statuses', 'roles', 'collegeProgram', 'page'] as $key) {
                    if (isset($params[$key])) {
                        if ($key === 'roles') {
                            // Ensure 'othersRole' is not passed as a separate filter here if it was in the referer
                            $redirectParams[$key] = (array)$params[$key];
                        } else {
                            $redirectParams[$key] = $params[$key];
                        }
                    }
                }
            }
        }
        return redirect()
            ->route('employees.index', $redirectParams)
            ->with('success', 'Employee created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Employees $employees)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Employees $employee, Request $request)
    {
        $types    = (array) $request->input('types', []);
        $statuses = (array) $request->input('statuses', []);
        $roles    = (array) $request->input('roles', []);
        $page     = $request->input('page', 1);
        $employeeTypes = ['Full Time', 'Part Time', 'Provisionary', 'Regular'];
        $salaryDefaults = \App\Models\Salary::whereIn('employee_type', $employeeTypes)
            ->get()
            ->mapWithKeys(fn($row) => [
                $row->employee_type => [
                    'base_salary'     => $row->base_salary,
                    'sss'             => $row->sss,
                    'philhealth'      => $row->philhealth,
                    'pag_ibig'        => $row->pag_ibig,
                    'withholding_tax' => $row->withholding_tax,
                    'work_hours_per_day' => $row->work_hours_per_day,
                ],
            ])
            ->toArray();
        $employee->load('workDays');
        return Inertia::render('employees/edit', [
            'employee' => [
                'id' => $employee->id,
                'last_name' => $employee->last_name,
                'first_name' => $employee->first_name,
                'middle_name' => $employee->middle_name,
                'employee_type' => $employee->employee_type,
                'employee_status' => $employee->employee_status,
                'roles' => $employee->roles,
                'base_salary' => $employee->base_salary,
                'college_rate' => $employee->college_rate,
                'sss' => $employee->sss,
                'philhealth' => $employee->philhealth,
                'pag_ibig' => $employee->pag_ibig,
                'college_program' => $employee->college_program,
                'withholding_tax' => $employee->withholding_tax,
                'work_hours_per_day' => $employee->work_hours_per_day,
                'work_start_time' => $employee->work_start_time,
                'work_end_time' => $employee->work_end_time,
                'sss_salary_loan' => $employee->sss_salary_loan,
                'sss_calamity_loan' => $employee->sss_calamity_loan,
                'pagibig_multi_loan' => $employee->pagibig_multi_loan,
                'pagibig_calamity_loan' => $employee->pagibig_calamity_loan,
                'peraa_con' => $employee->peraa_con,
                'tuition' => $employee->tuition,
                'china_bank' => $employee->china_bank,
                'tea' => $employee->tea,
                'honorarium' => $employee->honorarium,
                'work_days' => $employee->workDays ? $employee->workDays->map(function($wd) {
                    return [
                        'id' => $wd->id,
                        'day' => $wd->day,
                        'work_start_time' => $wd->work_start_time,
                        'work_end_time' => $wd->work_end_time,
                    ];
                })->toArray() : [],
            ],
            'search'   => $request->input('search', ''),
            'filters'  => [
                'types'    => $types,
                'statuses' => $statuses,
                'roles'    => $roles,
            ],
            'page'     => $page,
            'employeeTypes' => $employeeTypes,
            'salaryDefaults' => $salaryDefaults,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEmployeesRequest $request, Employees $employee)
    {
        $data = $request->validated();
        // Log the data being saved for debugging
        Log::info('Employee update data', $data);
        $data = $request->validated();
        // Only set college_rate from rate_per_hour if college instructor is selected
        $rolesArr = isset($data['roles']) ? (is_array($data['roles']) ? $data['roles'] : explode(',', $data['roles'])) : [];
        $isCollege = in_array('college instructor', $rolesArr);
        if ($isCollege && request()->has('rate_per_hour')) {
            $data['college_rate'] = request()->input('rate_per_hour');
        } else {
            $data['college_rate'] = null;
        }
        $rolesArr = isset($data['roles']) ? (is_array($data['roles']) ? $data['roles'] : explode(',', $data['roles'])) : [];
        $isCollege = in_array('college instructor', $rolesArr);
        $isAdmin = in_array('administrator', $rolesArr);
        $isBasicEdu = in_array('basic education instructor', $rolesArr);
        // Only nullify base_salary if college instructor is the ONLY role (not also admin/basic edu)
        if ($isCollege && !$isAdmin && !$isBasicEdu) {
            $data['base_salary'] = null;
        }
        // Recalculate PhilHealth using new formula (divide by 2) only if not college instructor (and not mixed roles),
        // and only if the user did not clear the field (i.e., if philhealth is not empty/null)
        if (
            (!$isCollege || ($isAdmin || $isBasicEdu)) &&
            isset($data['base_salary']) && $data['base_salary'] !== null &&
            isset($data['philhealth']) && $data['philhealth'] !== '' && $data['philhealth'] !== null
        ) {
            $base_salary = (float) $data['base_salary'];
            $philhealth = max(250, min(2500, ($base_salary * 0.05) / 2));
            $data['philhealth'] = round($philhealth, 2);
        }
        // Sanitize numeric fields: convert empty strings or null to null (for consistency with store)
        foreach ([
            'base_salary', 'sss', 'philhealth', 'pag_ibig', 'withholding_tax',
            'college_rate', 'rate_per_hour',
            'sss_salary_loan', 'sss_calamity_loan', 'pagibig_multi_loan', 'pagibig_calamity_loan',
            'peraa_con', 'tuition', 'china_bank', 'tea', 'honorarium'
        ] as $field) {
            if (isset($data[$field]) && ($data[$field] === '' || $data[$field] === null)) {
                $data[$field] = null;
            }
        }

    $oldData = $employee->toArray();
    $oldStatus = $employee->employee_status;
    $employee->update($data);

    // Only record leave status in history if under leave limit
    if (isset($data['employee_status']) && $data['employee_status'] !== $oldStatus) {
        if (Schema::hasTable('employee_status_histories')) {
            $leaveStatuses = ['paid leave', 'sick leave', 'vacation leave', 'maternity leave', 'study leave'];
            $activeStatuses = ['active'];
            $currentStatus = strtolower(trim($data['employee_status']));
            $oldStatusNormalized = strtolower(trim($oldStatus));
            // If changing to a leave status, record leave start only if no open leave exists
            if (in_array($currentStatus, $leaveStatuses)) {
                $openLeave = DB::table('employee_status_histories')
                    ->where('employee_id', $employee->id)
                    ->whereIn('status', $leaveStatuses)
                    ->whereNull('leave_end_date')
                    ->first();
                if (!$openLeave) {
                    DB::table('employee_status_histories')->insert([
                        'employee_id' => $employee->id,
                        'status' => $data['employee_status'],
                        'effective_date' => date('Y-m-d'),
                        'leave_start_date' => date('Y-m-d'),
                        'leave_end_date' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            // If changing from leave to active, record leave end
            elseif (in_array($currentStatus, $activeStatuses) && in_array($oldStatusNormalized, $leaveStatuses)) {
                $lastLeave = DB::table('employee_status_histories')
                    ->where('employee_id', $employee->id)
                    ->whereIn('status', $leaveStatuses)
                    ->whereNull('leave_end_date')
                    ->orderByDesc('leave_start_date')
                    ->first();
                if ($lastLeave) {
                    DB::table('employee_status_histories')
                        ->where('id', $lastLeave->id)
                        ->update(['leave_end_date' => date('Y-m-d'), 'updated_at' => now()]);
                }
                // Do NOT insert a new 'active' row here; only update the leave record
            }
            // For other status changes, just record the change
            else {
                DB::table('employee_status_histories')->insert([
                    'employee_id' => $employee->id,
                    'status' => $data['employee_status'],
                    'effective_date' => date('Y-m-d'),
                    'leave_start_date' => null,
                    'leave_end_date' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

        // Update per-day work times if provided
        $workDays = $request['work_days'] ?? [];
        if (is_array($workDays)) {
            // Remove all previous work days for this employee
            $employee->workDays()->delete();
            // Add new work days
            foreach ($workDays as $workDay) {
                if (
                    isset($workDay['day']) &&
                    isset($workDay['work_start_time']) &&
                    isset($workDay['work_end_time'])
                ) {
                    $employee->workDays()->create([
                        'day' => $workDay['day'],
                        'work_start_time' => $workDay['work_start_time'],
                        'work_end_time' => $workDay['work_end_time'],
                    ]);
                }
            }
        }

        // Audit log: employee updated
        $username = (Auth::check() && Auth::user() && Auth::user()->username) ? Auth::user()->username : 'system';
        \App\Models\AuditLogs::create([
            'username'    => $username,
            'action'      => 'updated',
            'name'        => $employee->last_name . ', ' . $employee->first_name,
            'entity_type' => 'employee',
            'entity_id'   => $employee->id,
            'details'     => json_encode(['old' => $oldData, 'new' => $data]),
            'date'        => now('Asia/Manila'),
        ]);

        // Restore previous filters from referer
        $redirectParams = [];
        $referer = request()->header('referer');
        if ($referer) {
            $query = parse_url($referer, PHP_URL_QUERY);
            if ($query) {
                parse_str($query, $params);
                // In store and update, always preserve all filters, and ensure roles is always an array if present
                foreach (['search', 'types', 'statuses', 'roles', 'collegeProgram', 'page', 'perPage', 'per_page'] as $key) {
                    if (isset($params[$key])) {
                        if ($key === 'roles') {
                            // Ensure 'othersRole' is not passed as a separate filter here if it was in the referer
                            $redirectParams[$key] = (array)$params[$key];
                        } else {
                            $redirectParams[$key] = $params[$key];
                        }
                    }
                }
            }
        }
        return redirect()
            ->route('employees.index', $redirectParams)
            ->with('success', 'Employee updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Employees $employee)
    {
        $oldData = $employee->toArray();
        $employee->delete();

        // Audit log: employee deleted
        $username = (Auth::check() && Auth::user() && Auth::user()->username) ? Auth::user()->username : 'system';
        \App\Models\AuditLogs::create([
            'username'    => $username,
            'action'      => 'deleted',
            'name'        => $oldData['last_name'] . ', ' . $oldData['first_name'],
            'entity_type' => 'employee',
            'entity_id'   => $oldData['id'],
            'details'     => json_encode($oldData),
            'date'        => now('Asia/Manila'),
        ]);
        return redirect()
            ->route('employees.index', [
                'search' => $request['search'] ?? '',
                'types' => $request['types'] ?? [],
                'statuses' => $request['statuses'] ?? [],
                'roles' => array_values((array) ($request['roles'] ?? [])),
                'collegeProgram' => $request['collegeProgram'] ?? '',
                'page' => $request['page'] ?? 1,
                'perPage' => $request['perPage'] ?? $request['per_page'] ?? 10,
            ])
            ->with('success', 'Employee deleted successfully!');
    }
}
