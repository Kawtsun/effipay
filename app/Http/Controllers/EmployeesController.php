<?php

namespace App\Http\Controllers;

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

        // Ensure all required fields are present for each employee
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
    $isCollege = isset($data['roles']) && (is_array($data['roles']) ? in_array('college instructor', $data['roles']) : str_contains($data['roles'], 'college instructor'));
    // If role is college instructor, nullify base_salary only
    if ($isCollege) {
        $data['base_salary'] = null;
    }
    // Recalculate PhilHealth using new formula (divide by 2) only if not college instructor
    if (!$isCollege && isset($data['base_salary']) && $data['base_salary'] !== null) {
        $base_salary = (float) $data['base_salary'];
        $philhealth = max(250, min(2500, ($base_salary * 0.05) / 2));
        $data['philhealth'] = round($philhealth, 2);
    }
    $employee = Employees::create($data);

    // Audit log: employee created
    $username = (Auth::check() && Auth::user() && Auth::user()->username) ? Auth::user()->username : 'system';
    \App\Models\AuditLogs::create([
        'username'    => $username,
        'action'      => 'create',
        'name'        => $employee->last_name . ', ' . $employee->first_name,
        'entity_type' => 'Employee',
        'entity_id'   => $employee->id,
        'details'     => json_encode($data),
        'date'        => now(),
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
    $isCollege = isset($data['roles']) && (is_array($data['roles']) ? in_array('college instructor', $data['roles']) : str_contains($data['roles'], 'college instructor'));
    // If role is college instructor, nullify base_salary only
    if ($isCollege) {
        $data['base_salary'] = null;
    }
    // Recalculate PhilHealth using new formula (divide by 2) only if not college instructor
    if (!$isCollege && isset($data['base_salary']) && $data['base_salary'] !== null) {
        $base_salary = (float) $data['base_salary'];
        $philhealth = max(250, min(2500, ($base_salary * 0.05) / 2));
        $data['philhealth'] = round($philhealth, 2);
    }
    $oldData = $employee->toArray();
    $employee->update($data);

    // Audit log: employee updated
    $username = (Auth::check() && Auth::user() && Auth::user()->username) ? Auth::user()->username : 'system';
    \App\Models\AuditLogs::create([
        'username'    => $username,
        'action'      => 'update',
        'name'        => $employee->last_name . ', ' . $employee->first_name,
        'entity_type' => 'Employee',
        'entity_id'   => $employee->id,
        'details'     => json_encode(['old' => $oldData, 'new' => $data]),
        'date'        => now(),
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
            'action'      => 'delete',
            'name'        => $oldData['last_name'] . ', ' . $oldData['first_name'],
            'entity_type' => 'Employee',
            'entity_id'   => $oldData['id'],
            'details'     => json_encode($oldData),
            'date'        => now(),
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
