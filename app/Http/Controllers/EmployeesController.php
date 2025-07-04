<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Http\Requests\StoreEmployeesRequest;
use App\Http\Requests\UpdateEmployeesRequest;
use Inertia\Inertia;
use Illuminate\Http\Request;

class EmployeesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, $page = null)
    {
        $perPage = 10;
        $query = Employees::query();

        if ($request->search) {
            $query->where('employee_name', 'like', '%' . $request->search . '%');
            // Add more fields if you want to search by other columns
        }

        $employees = $query->orderBy('id')->paginate($perPage)->withQueryString();

        return inertia('employees/index', [
            'employees' => $employees->items(),
            'currentPage' => $employees->currentPage(),
            'totalPages' => $employees->lastPage(),
            'search' => $request->search,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('employees/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEmployeesRequest $request)
    {
        $validated = $request->validated();
        Employees::create($validated);

        return redirect()->route('employees.index')->with('success', 'Employee added successfully!');
    
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
    public function edit(Employees $employee)
    {
        return Inertia::render('employees/edit', [
            'employee' => $employee
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEmployeesRequest $request, Employees $employee)
    {
        $validated = $request->validated();
        $employee->update($validated);

        return redirect()->route('employees.index')->with('success', 'Employee updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Employees $employee)
    {
        $employee->delete();

        return redirect(route('employees.index'))->with('success', 'Employee deleted successfully!');
    }
}
