<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

use App\Models\Employees;
use App\Http\Requests\StoreEmployeesRequest;
use App\Http\Requests\UpdateEmployeesRequest;
use App\Models\Salary;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Auth;

class EmployeesController extends Controller
{
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

        if ($request->filled('roles') && is_array($request->roles) && count($request->roles)) {
            $query->where(function ($q) use ($request) {
                foreach ($request->roles as $role) {
                    $q->orWhere('roles', 'like', '%' . $role . '%');
                }
            });
        }

        // Filter by college program if set
        if ($request->filled('collegeProgram')) {
            $query->where('college_program', $request->collegeProgram);
        }


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

        return Inertia::render('employees/index', [
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
    public function create(Request $request)
    {
        $search   = $request->input('search', '');
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
        // Always set college_rate from rate_per_hour if present in request
        if (request()->has('rate_per_hour')) {
            $data['college_rate'] = request()->input('rate_per_hour');
        }
        $rolesArr = isset($data['roles']) ? (is_array($data['roles']) ? $data['roles'] : explode(',', $data['roles'])) : [];
        $isCollege = in_array('college instructor', $rolesArr);
        $isAdmin = in_array('administrator', $rolesArr);
        $isBasicEdu = in_array('basic education instructor', $rolesArr);
        // Only nullify base_salary if college instructor is the ONLY role (not also admin/basic edu)
        if ($isCollege && !$isAdmin && !$isBasicEdu) {
            $data['base_salary'] = null;
        }
        // Recalculate PhilHealth using new formula (divide by 2) only if not college instructor (and not mixed roles)
        if ((!$isCollege || ($isAdmin || $isBasicEdu)) && isset($data['base_salary']) && $data['base_salary'] !== null) {
            $base_salary = (float) $data['base_salary'];
            $philhealth = max(250, min(2500, ($base_salary * 0.05) / 2));
            $data['philhealth'] = round($philhealth, 2);
        }

        $oldData = $employee->toArray();
        $oldStatus = $employee->employee_status;
        $employee->update($data);
        // If status changed, record in status history
        if (isset($data['employee_status']) && $data['employee_status'] !== $oldStatus) {
            DB::table('employee_status_histories')->insert([
                'employee_id' => $employee->id,
                'status' => $data['employee_status'],
                'effective_date' => date('Y-m-d'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
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
                foreach (['search', 'types', 'statuses', 'roles', 'collegeProgram', 'page'] as $key) {
                    if (isset($params[$key])) {
                        if ($key === 'roles') {
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
            ])
            ->with('success', 'Employee deleted successfully!');
    }
}
