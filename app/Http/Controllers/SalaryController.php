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
                'withholding_tax' => 0,
                'work_hours_per_day' => 8
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
            $calculatedPhilHealth = ($data['base_salary'] * 0.05) / 2;
            $data['philhealth'] = max(250, min(2500, $calculatedPhilHealth));
        }

        // Automate withholding tax: if total_compensation is 20,832 or below, set withholding_tax to 0
        $base_salary = isset($data['base_salary']) ? $data['base_salary'] : $salary->base_salary;
        $sss = isset($data['sss']) ? $data['sss'] : $salary->sss;
        $pag_ibig = isset($data['pag_ibig']) ? $data['pag_ibig'] : $salary->pag_ibig;
        $philhealth = isset($data['philhealth']) ? $data['philhealth'] : $salary->philhealth;
        $total_compensation = $base_salary - ($sss + $pag_ibig + $philhealth);
        if ($total_compensation <= 20832) {
            $data['withholding_tax'] = 0;
        } elseif ($total_compensation >= 20833 && $total_compensation <= 33332) {
            $data['withholding_tax'] = ($total_compensation - 20833) * 0.15;
        } elseif ($total_compensation >= 33333 && $total_compensation <= 66666) {
            $data['withholding_tax'] = ($total_compensation - 33333) * 0.20 + 1875;
        } elseif ($total_compensation >= 66667 && $total_compensation <= 166666) {
            $data['withholding_tax'] = ($total_compensation - 66667) * 0.25 + 8541.80;
        } elseif ($total_compensation >= 166667 && $total_compensation <= 666666) {
            $data['withholding_tax'] = ($total_compensation - 166667) * 0.30 + 33541.80;
        } elseif ($total_compensation >= 666667) {
            $data['withholding_tax'] = ($total_compensation - 666667) * 0.35 + 183541.80;
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
