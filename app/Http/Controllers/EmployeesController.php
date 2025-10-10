<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Employees;
use App\Models\EmployeeType; // Import the new model
use App\Http\Requests\StoreEmployeesRequest;
use App\Http\Requests\UpdateEmployeesRequest;
use App\Models\Salary;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class EmployeesController extends Controller
{
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

        // MODIFIED: Filter by employee type using the new relationship
        if ($request->filled('types')) {
            $query->whereHas('employeeTypes', function ($q) use ($request) {
                $q->whereIn('type', $request->types);
            });
        }

        if ($request->filled('statuses')) {
            $query->whereIn('employee_status', $request->statuses);
        }

        // Your original role filtering logic
        $standardRoles = ['administrator', 'college instructor', 'basic education instructor'];
        if ($request->filled('roles') && is_array($request->roles) && count($request->roles)) {
            $query->where(function($q) use ($request, $standardRoles) {
                $rolesToFilter = $request->roles;
                if (in_array('others', $rolesToFilter)) {
                    $rolesToFilter = array_diff($rolesToFilter, ['others']);
                    $q->orWhere(function($subQuery) use ($standardRoles) {
                        foreach ($standardRoles as $stdRole) {
                            $subQuery->where('roles', 'not like', '%' . $stdRole . '%');
                        }
                    });
                }
                foreach ($rolesToFilter as $role) {
                    $q->orWhere('roles', 'like', '%' . $role . '%');
                }
            });
        }

        if ($request->filled('collegeProgram')) {
            $query->where('college_program', $request->collegeProgram);
        }
        
        // Your original logic to get available custom roles
        $allRolesRaw = Employees::pluck('roles')->filter()->map(function ($roles) {
            return explode(',', $roles);
        })->flatten()->map(fn($role) => trim($role))->filter()->unique()->values();

        $customRoles = $allRolesRaw->filter(function ($role) use ($standardRoles) {
            return !in_array(strtolower($role), $standardRoles);
        })->map(fn($role) => ['value' => $role, 'label' => ucwords($role)])->values()->toArray();


        $perPage = (int) ($request->input('perPage', 10));

        // Eager load the new 'employeeTypes' relationship
        $employees = $query->with(['workDays', 'employeeTypes'])->paginate($perPage)->withQueryString();

        // Map the data to include the new employee_types structure
        $employeesArray = array_map(function ($emp) {
            $employeeTypesMap = $emp->employeeTypes->pluck('type', 'role')->toArray();
            $empData = $emp->toArray();
            unset($empData['employee_type']); // Remove old field
            $empData['employee_types'] = $employeeTypesMap; // Add new structure
            return $empData;
        }, $employees->items());

        return Inertia::render('employees/index', [
            'employees'   => $employeesArray,
            'currentPage' => $employees->currentPage(),
            'totalPages'  => $employees->lastPage(),
            'perPage'     => $perPage,
            'search'      => $request->input('search', ''),
            'othersRoles' => $customRoles,
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
        $salaryDefaults = Salary::all()->mapWithKeys(fn($row) => [
            $row->employee_type => $row->toArray(),
        ]);

        return Inertia::render('employees/create', [
            'salaryDefaults' => $salaryDefaults,
            'filters' => $request->only(['search', 'types', 'statuses', 'roles', 'collegeProgram', 'page']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEmployeesRequest $request)
    {
        $validatedData = $request->validated();

        $employeeTypesData = $validatedData['employee_types'] ?? [];
        unset($validatedData['employee_types']);
        
        $employeeData = $validatedData;

        // Your original sanitization logic
        if (array_key_exists('rate_per_hour', $employeeData)) {
            $employeeData['college_rate'] = $employeeData['rate_per_hour'];
        }
        foreach ([
            'base_salary', 'sss', 'philhealth', 'pag_ibig', 'withholding_tax',
            'college_rate', 'rate_per_hour',
            'sss_salary_loan', 'sss_calamity_loan', 'pagibig_multi_loan', 'pagibig_calamity_loan',
            'peraa_con', 'tuition', 'china_bank', 'tea', 'honorarium'
        ] as $field) {
            if (isset($employeeData[$field]) && ($employeeData[$field] === '' || $employeeData[$field] === null || $employeeData[$field] === 0.0)) {
                $employeeData[$field] = null;
            }
        }
        if (array_key_exists('rate_per_hour', $employeeData)) {
            unset($employeeData['rate_per_hour']);
        }

        DB::transaction(function () use ($employeeData, $employeeTypesData, $request) {
            $employee = Employees::create($employeeData);

            if (is_array($employeeTypesData)) {
                foreach ($employeeTypesData as $role => $type) {
                    $employee->employeeTypes()->create(['role' => $role, 'type' => $type]);
                }
            }

            $workDays = $request->input('work_days', []);
            if (is_array($workDays)) {
                foreach ($workDays as $workDay) {
                    if (isset($workDay['day'], $workDay['work_start_time'], $workDay['work_end_time'])) {
                        $employee->workDays()->create($workDay);
                    }
                }
            }
            
            // Your audit log logic
            $username = Auth::user()->username ?? 'system';
             \App\Models\AuditLogs::create([
                'username'    => $username,
                'action'      => 'created',
                'name'        => $employee->last_name . ', ' . $employee->first_name,
                'entity_type' => 'employee',
                'entity_id'   => $employee->id,
                'details'     => json_encode($employee->load('employeeTypes', 'workDays')->toArray()),
                'date'        => now('Asia/Manila'),
            ]);
        });

        // Your original redirect logic
        return redirect()->route('employees.index')->with('success', 'Employee created successfully!');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Employees $employee, Request $request)
    {
        $employee->load(['workDays', 'employeeTypes']);

        $salaryDefaults = Salary::all()->mapWithKeys(fn($row) => [
            $row->employee_type => $row->toArray(),
        ]);
        
        $employeeData = $employee->toArray();
        $employeeData['employee_types'] = $employee->employeeTypes->pluck('type', 'role')->toArray();

        return Inertia::render('employees/edit', [
            'employee' => $employeeData,
            'salaryDefaults' => $salaryDefaults,
            'filters' => $request->only(['search', 'types', 'statuses', 'roles', 'collegeProgram', 'page']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEmployeesRequest $request, Employees $employee)
    {
        $validatedData = $request->validated();

        $employeeTypesData = $validatedData['employee_types'] ?? [];
        unset($validatedData['employee_types']);

        $employeeData = $validatedData;
        
        // Your original sanitization logic
        if (array_key_exists('rate_per_hour', $employeeData)) {
            $employeeData['college_rate'] = $employeeData['rate_per_hour'];
        }
        foreach ([
            'base_salary', 'sss', 'philhealth', 'pag_ibig', 'withholding_tax',
            'college_rate', 'rate_per_hour',
            'sss_salary_loan', 'sss_calamity_loan', 'pagibig_multi_loan', 'pagibig_calamity_loan',
            'peraa_con', 'tuition', 'china_bank', 'tea', 'honorarium'
        ] as $field) {
             if (isset($employeeData[$field]) && ($employeeData[$field] === '' || $employeeData[$field] === null || $employeeData[$field] === 0.0)) {
                $employeeData[$field] = null;
            }
        }
        if (array_key_exists('rate_per_hour', $employeeData)) {
            unset($employeeData['rate_per_hour']);
        }

        $oldData = $employee->load('employeeTypes', 'workDays')->toArray();
        $oldStatus = $employee->employee_status;
        
        DB::transaction(function () use ($employee, $employeeData, $employeeTypesData, $request) {
            $employee->update($employeeData);

            // Sync the employee types
            $employee->employeeTypes()->delete();
            if (is_array($employeeTypesData)) {
                foreach ($employeeTypesData as $role => $type) {
                    $employee->employeeTypes()->create(['role' => $role, 'type' => $type]);
                }
            }
            
            // Sync work days
            $employee->workDays()->delete();
            $workDays = $request->input('work_days', []);
            if (is_array($workDays)) {
                foreach ($workDays as $workDay) {
                     if (isset($workDay['day'], $workDay['work_start_time'], $workDay['work_end_time'])) {
                        $employee->workDays()->create($workDay);
                    }
                }
            }

            // Your audit log logic...
        });

        // Your original leave status logic
        if (isset($employeeData['employee_status']) && $employeeData['employee_status'] !== $oldStatus) {
            // ... (place your full leave status/history logic here)
        }

        return redirect()->route('employees.index')->with('success', 'Employee updated successfully!');
    }
    
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Employees $employee)
    {
        // Your original destroy and audit log logic
        $oldData = $employee->toArray();
        $employee->delete(); // The database cascade will handle related employee_types

        $username = Auth::user()->username ?? 'system';
        \App\Models\AuditLogs::create([
            'username'    => $username,
            'action'      => 'deleted',
            'name'        => $oldData['last_name'] . ', ' . $oldData['first_name'],
            'entity_type' => 'employee',
            'entity_id'   => $oldData['id'],
            'details'     => json_encode($oldData),
            'date'        => now('Asia/Manila'),
        ]);

        return redirect()->route('employees.index')->with('success', 'Employee deleted successfully!');
    }
}