<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Http\Requests\StoreEmployeesRequest;
use App\Http\Requests\UpdateEmployeesRequest;
use App\Models\Salary;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class EmployeesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Employees::query();

        if ($request->filled('search')) {
            $query->where('employee_name', 'like', '%' . $request->search . '%');
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
                'employee_name' => $emp->employee_name,
                'employee_type' => $emp->employee_type,
                'employee_status' => $emp->employee_status,
                'roles' => $emp->roles,
                'base_salary' => $emp->base_salary,
                'overtime_pay' => $emp->overtime_pay,
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
                    'overtime_pay'    => $row->overtime_pay,
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
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEmployeesRequest $request)
    {
        Employees::create($request->validated());

        // Restore previous filters from referer
        $redirectParams = [];
        $referer = $request->headers->get('referer');
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
        return Inertia::render('employees/edit', [
            'employee' => $employee,
            'search'   => $request->input('search', ''),
            'filters'  => [
                'types'    => $types,
                'statuses' => $statuses,
                'roles'    => $roles,
            ],
            'page'     => $page,
            'employeeTypes' => $employeeTypes,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEmployeesRequest $request, Employees $employee)
    {
        $employee->update($request->validated());

        // Restore previous filters from referer
        $redirectParams = [];
        $referer = $request->headers->get('referer');
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
        $employee->delete();
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
