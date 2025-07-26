<?php

namespace App\Http\Controllers;

use App\Models\Salary;
use App\Http\Requests\StoreSalaryRequest;
use App\Http\Requests\UpdateSalaryRequest;
use Illuminate\Http\Request;
use App\Models\Employees;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class SalaryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $types    = ['Full Time', 'Part Time', 'Provisionary'];
        $selected = $request->input('type', $types[0]);

        // firstOrCreate() ensures there's always a row to edit
        $defaults = Salary::firstOrCreate(
            ['employee_type' => $selected],
            [
                'base_salary' => 0,
                'overtime_pay' => 0,
                'sss' => 0,
                'philhealth' => 250, // Default minimum when base_salary is 0
                'pag_ibig' => 0,
                'withholding_tax' => 0
            ]
        );

        return Inertia::render('salary/index', [
            'types'     => $types,
            'selected'  => $selected,
            'defaults'  => $defaults,
            'flash'     => session('success'),
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
    public function store(StoreSalaryRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Salary $salary)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Salary $salary)
    {
        return Inertia::render('salary/edit', [
            'defaults' => $salary,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSalaryRequest $request, Salary $salary): RedirectResponse
    {
        $data = $request->validated();
        
        // If base_salary is being updated, automatically calculate PhilHealth
        if (isset($data['base_salary'])) {
            $calculatedPhilHealth = ($data['base_salary'] * 0.05) / 4;
            $data['philhealth'] = max(250, min(2500, $calculatedPhilHealth));
        }
        
        $salary->update($data);

        return redirect()
            ->route('salary.index', ['type' => $salary->employee_type])
            ->with('success', 'Salary updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Salary $salary)
    {
        //
    }
}
