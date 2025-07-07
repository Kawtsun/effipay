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
    public function index(Request $request)
    {
        $query = Employees::query();

        if ($request->has('search')) {
            $query->where('employee_name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('types')) {
            $query->whereIn('employee_type', $request->types);
        }

        if ($request->has('statuses')) {
            $query->whereIn('employee_status', $request->statuses);
        }

        $employees = $query->paginate(10)->withQueryString();

        return Inertia::render('employees/index', [
            'employees' => $employees->items(),
            'currentPage' => $employees->currentPage(),
            'totalPages' => $employees->lastPage(),
            'search' => $request->input('search', ''),
            'filters' => [
                'types' => (array) $request->input('types', []),
                'statuses' => (array) $request->input('statuses', []),
            ],
            'flash' => ['success' => session('success')],
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
    public function edit(Employees $employee, Request $request)
    {
        return Inertia::render('employees/edit', [
            'employee' => $employee,
            'search' => $request->input('search', ''),
            'filters' => [
                'types' => (array) $request->input('types', []),
                'statuses' => (array) $request->input('statuses', []),
            ],
            'page' => $request->input('page', 1),
        ]);
    }




    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEmployeesRequest $request, Employees $employee)
    {
        $employee->update($request->validated());

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

        // “Back” to the exact same /employees?search=...&types[]=... URL
        return redirect()->back()
            ->with('success', 'Employee deleted successfully!');
    }




    public function hints(Request $request)
    {
        $q = $request->query('q', '');
        $names = Employees::where('employee_name', 'like', "%{$q}%")
            ->limit(5)
            ->pluck('employee_name');

        return response()->json($names);
    }
}
