<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Http\Requests\StoreEmployeesRequest;
use App\Http\Requests\UpdateEmployeesRequest;
use App\Models\Salary;
use Inertia\Inertia;
use Illuminate\Http\Request;

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

        $employees = $query->paginate(10)->withQueryString();

        return Inertia::render('employees/index', [
            'employees'   => $employees->items(),
            'currentPage' => $employees->currentPage(),
            'totalPages'  => $employees->lastPage(),
            'search'      => $request->input('search', ''),
            'filters'     => [
                'types'    => (array) $request->input('types', []),
                'statuses' => (array) $request->input('statuses', []),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        // preserve existing query data
        $search   = $request->input('search', '');
        $types    = (array) $request->input('types', []);
        $statuses = (array) $request->input('statuses', []);
        $page     = $request->input('page', 1);

        // ← NEW: pull all types (must match your salaries table)
        $employeeTypes = \App\Models\Salary::pluck('employee_type')->all();

        // ← NEW: build a map: [ 'Full Time' => [ base_salary => 50000, … ], … ]
        $salaryDefaults = \App\Models\Salary::all()
            ->mapWithKeys(fn($row) => [
                $row->employee_type => [
                    'base_salary'     => $row->base_salary,
                    'overtime_pay'    => $row->overtime_pay,
                    'sss'             => $row->sss,
                    'philhealth'      => $row->philhealth,
                    'pag_ibig'        => $row->pag_ibig,
                    'withholding_tax' => $row->withholding_tax,
                ],
            ])
            ->toArray();

        return Inertia::render('employees/create', [
            'search'          => $search,
            'filters'         => ['types' => $types, 'statuses' => $statuses],
            'page'            => $page,
            // ← NEW props
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

        return redirect()
            ->route('employees.index', $request->only(['search', 'types', 'statuses', 'page']))
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
        return Inertia::render('employees/edit', [
            'employee' => $employee,
            'search'   => $request->input('search', ''),
            'filters'  => [
                'types'    => (array) $request->input('types', []),
                'statuses' => (array) $request->input('statuses', []),
            ],
            'page'     => $request->input('page', 1),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEmployeesRequest $request, Employees $employee)
    {
        $employee->update($request->validated());

        // Explicitly build the /employees?… URL with filters + page
        return redirect()
            ->route('employees.index', $request->only(['search', 'types', 'statuses', 'page']))
            ->with('success', 'Employee updated successfully!');
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Employees $employee)
    {
        $employee->delete();

        // Same here: never use redirect()->back()
        return redirect()
            ->route('employees.index', $request->only(['search', 'types', 'statuses', 'page']))
            ->with('success', 'Employee deleted successfully!');
    }
}
