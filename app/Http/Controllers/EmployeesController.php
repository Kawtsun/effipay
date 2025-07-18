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

        $category = $request->input('category', 'Teaching');

        if ($request->filled('search')) {
            $query->where('employee_name', 'like', '%' . $request->search . '%');
        }

        if ($category) {
            $query->where('employee_category', $category);
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
                'category' => $category,
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
        $search   = $request->input('search', '');
        $types    = (array) $request->input('types', []);
        $statuses = (array) $request->input('statuses', []);
        $page     = $request->input('page', 1);
        $category = $request->input('category', 'Teaching');

        // Employee types by category
        $teachingTypes = ['Full Time', 'Part Time', 'Provisionary'];
        $nonTeachingTypes = ['Regular', 'Provisionary'];
        $employeeTypes = $category === 'Non-Teaching' ? $nonTeachingTypes : $teachingTypes;

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
                ],
            ])
            ->toArray();

        return Inertia::render('employees/create', [
            'search'          => $search,
            'filters'         => ['category' => $category, 'types' => $types, 'statuses' => $statuses],
            'page'            => $page,
            'employeeTypes'   => $employeeTypes,
            'salaryDefaults'  => $salaryDefaults,
            'employeeCategory'=> $category,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEmployeesRequest $request)
    {
        Employees::create($request->validated());

        return redirect()
            ->route('employees.index', [
                'search' => $request['search'] ?? '',
                'category' => $request['category'] ?? 'Teaching',
                'types' => $request['types'] ?? [],
                'statuses' => $request['statuses'] ?? [],
                'page' => $request['page'] ?? 1,
            ])
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
        $category = $employee->employee_category ?? 'Teaching';
        $teachingTypes = ['Full Time', 'Part Time', 'Provisionary'];
        $nonTeachingTypes = ['Regular', 'Provisionary'];
        $employeeTypes = $category === 'Non-Teaching' ? $nonTeachingTypes : $teachingTypes;

        return Inertia::render('employees/edit', [
            'employee' => $employee,
            'search'   => $request->input('search', ''),
            'filters'  => [
                'category' => $category,
                'types'    => (array) $request->input('types', []),
                'statuses' => (array) $request->input('statuses', []),
            ],
            'page'     => $request->input('page', 1),
            'employeeTypes' => $employeeTypes,
            'employeeCategory' => $category,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEmployeesRequest $request, Employees $employee)
    {
        $employee->update($request->validated());

        return redirect()
            ->route('employees.index', [
                'search' => $request['search'] ?? '',
                'category' => $request['category'] ?? 'Teaching',
                'types' => $request['types'] ?? [],
                'statuses' => $request['statuses'] ?? [],
                'page' => $request['page'] ?? 1,
            ])
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
            ->route('employees.index', [
                'search' => $request['search'] ?? '',
                'category' => $request['category'] ?? 'Teaching',
                'types' => $request['types'] ?? [],
                'statuses' => $request['statuses'] ?? [],
                'page' => $request['page'] ?? 1,
            ])
            ->with('success', 'Employee deleted successfully!');
    }
}
