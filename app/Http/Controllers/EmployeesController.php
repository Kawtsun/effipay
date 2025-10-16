<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Employees;
use App\Models\EmployeeType;
use App\Http\Requests\StoreEmployeesRequest;
use App\Http\Requests\UpdateEmployeesRequest;
use App\Models\Salary;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class EmployeesController extends Controller
{
    public const LEAVE_LIMIT = 2;

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
            $query->whereHas('employeeTypes', function ($q) use ($request) {
                $q->whereIn('type', $request->types);
            });
        }

        if ($request->filled('statuses')) {
            $query->whereIn('employee_status', $request->statuses);
        }

        $standardRoles = ['administrator', 'college instructor', 'basic education instructor'];
        if ($request->filled('roles') && is_array($request->roles) && count($request->roles)) {
            $query->where(function ($q) use ($request, $standardRoles) {
                $rolesToFilter = $request->roles;
                if (in_array('others', $rolesToFilter)) {
                    $rolesToFilter = array_diff($rolesToFilter, ['others']);
                    $q->orWhere(function ($subQuery) use ($standardRoles) {
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

        $allRolesRaw = Employees::pluck('roles')->filter()->map(function ($roles) {
            return explode(',', $roles);
        })->flatten()->map(fn ($role) => trim($role))->filter()->unique()->values();

        $customRoles = $allRolesRaw->filter(function ($role) use ($standardRoles) {
            return !in_array(strtolower($role), $standardRoles);
        })->map(fn ($role) => ['value' => $role, 'label' => ucwords($role)])->values()->toArray();

        $perPage = (int) ($request->input('perPage', 10));

        // Eager load the relationships
        $employees = $query->with(['workDays', 'employeeTypes'])->paginate($perPage)->withQueryString();

        // Transform the paginated items
        $employees->getCollection()->transform(function ($emp) {
            // ** THE FIX IS HERE **
            // We now map the collection to the correct array structure
            $employeeTypesArray = $emp->employeeTypes->map(function ($type) {
                return [
                    'role' => $type->role,
                    'type' => $type->type,
                ];
            });

            // Unset the original relationship to avoid sending redundant data
            unset($emp->employeeTypes);
            // Assign the newly formatted array
            $emp->employee_types = $employeeTypesArray;

            return $emp;
        });

        return Inertia::render('employees/index', [
            // No need to map over the items again, the collection is already transformed
            'employees'   => $employees->items(),
            'currentPage' => $employees->currentPage(),
            'totalPages'  => $employees->lastPage(),
            'perPage'     => $perPage,
            'search'      => $request->input('search', ''),
            'othersRoles' => $customRoles,
            'filters'     => [
                'types'        => (array) $request->input('types', []),
                'statuses'     => (array) $request->input('statuses', []),
                'roles'        => array_values((array) $request->input('roles', [])),
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
        
        // Correctly handle the rate_per_hour field before sanitation
        if (isset($employeeData['rate_per_hour'])) {
            $employeeData['college_rate'] = $employeeData['rate_per_hour'];
            unset($employeeData['rate_per_hour']);
        }
        
        // Sanitize numeric fields to null if they are empty
        foreach ([
            'base_salary', 'honorarium', 'college_rate',
            'sss', 'philhealth', 'pag_ibig', 'withholding_tax',
            'sss_salary_loan', 'sss_calamity_loan', 'pagibig_multi_loan', 
            'pagibig_calamity_loan', 'peraa_con', 'tuition', 'china_bank', 'tea'
        ] as $field) {
            if (isset($employeeData[$field]) && ($employeeData[$field] === '' || $employeeData[$field] === null)) {
                $employeeData[$field] = null;
            }
        }
        
        // Use validated work_days to avoid relying on Request accessor inside closure
        $workDays = $validatedData['work_days'] ?? [];

        DB::transaction(function () use ($employeeData, $employeeTypesData, $workDays) {
            $employee = Employees::create($employeeData);

            if (is_array($employeeTypesData)) {
                foreach ($employeeTypesData as $role => $type) {
                    $employee->employeeTypes()->create(['role' => $role, 'type' => $type]);
                }
            }

            if (is_array($workDays) && count($workDays) > 0) {
                foreach ($workDays as $workDay) {
                    if (isset($workDay['day'], $workDay['work_start_time'], $workDay['work_end_time'])) {
                        $employee->workDays()->create($workDay);
                    }
                }
            }
            
            // --- RESTORED AUDIT LOGIC FOR STORE ---
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
        
        // Map rate_per_hour to college_rate then remove it (use array_key_exists so null clears the value)
        if (array_key_exists('rate_per_hour', $employeeData)) {
            $employeeData['college_rate'] = $employeeData['rate_per_hour'];
            unset($employeeData['rate_per_hour']);
        }

        // Sanitize numeric fields to null if they are empty ('' or null) — same list and behavior as store()
        foreach ([
            'base_salary', 'honorarium', 'college_rate',
            'sss', 'philhealth', 'pag_ibig', 'withholding_tax',
            'sss_salary_loan', 'sss_calamity_loan', 'pagibig_multi_loan', 
            'pagibig_calamity_loan', 'peraa_con', 'tuition', 'china_bank', 'tea'
        ] as $field) {
            if (isset($employeeData[$field]) && ($employeeData[$field] === '' || $employeeData[$field] === null)) {
                $employeeData[$field] = null;
            }
        }
        
        $oldData = $employee->load('employeeTypes', 'workDays')->toArray();
        $oldStatus = $employee->employee_status;
        
        // Use validated work_days to avoid relying on Request accessor inside closure
        $workDays = $validatedData['work_days'] ?? [];

        DB::transaction(function () use ($employee, $employeeData, $employeeTypesData, $workDays, $oldData) {
            $employee->update($employeeData);

            $employee->employeeTypes()->delete();
            if (is_array($employeeTypesData)) {
                foreach ($employeeTypesData as $role => $type) {
                    $employee->employeeTypes()->create(['role' => $role, 'type' => $type]);
                }
            }
            
            $employee->workDays()->delete();
            if (is_array($workDays)) {
                foreach ($workDays as $workDay) {
                    if (isset($workDay['day'], $workDay['work_start_time'], $workDay['work_end_time'])) {
                        $employee->workDays()->create($workDay);
                    }
                }
            }

            // --- RESTORED AUDIT LOGIC FOR UPDATE ---
            $username = Auth::user()->username ?? 'system';
            \App\Models\AuditLogs::create([
                'username'    => $username,
                'action'      => 'updated',
                'name'        => $employee->last_name . ', ' . $employee->first_name,
                'entity_type' => 'employee',
                'entity_id'   => $employee->id,
                'details'     => json_encode(['old' => $oldData, 'new' => $employeeData]),
                'date'        => now('Asia/Manila'),
            ]);
        });

        if (isset($employeeData['employee_status']) && $employeeData['employee_status'] !== $oldStatus) {
             // --- RESTORED LEAVE STATUS LOGIC ---
             if (Schema::hasTable('employee_status_histories')) {
                 $leaveStatuses = ['paid leave', 'sick leave', 'vacation leave', 'maternity leave', 'study leave'];
                 $activeStatuses = ['active'];
                 $currentStatus = strtolower(trim($employeeData['employee_status']));
                 $oldStatusNormalized = strtolower(trim($oldStatus));
                 
                 // If changing to a leave status, record leave start only if no open leave exists
                 if (in_array($currentStatus, $leaveStatuses)) {
                     $openLeave = DB::table('employee_status_histories')
                         ->where('employee_id', $employee->id)
                         ->whereIn('status', $leaveStatuses)
                         ->whereNull('leave_end_date')
                         ->first();
                     if (!$openLeave) {
                         DB::table('employee_status_histories')->insert([
                             'employee_id' => $employee->id,
                             'status' => $employeeData['employee_status'],
                             'effective_date' => date('Y-m-d'),
                             'leave_start_date' => date('Y-m-d'),
                             'leave_end_date' => null,
                             'created_at' => now(),
                             'updated_at' => now(),
                         ]);
                         if (Schema::hasTable('leaves')) {
                             DB::table('leaves')->insert([
                                 'employee_id' => $employee->id,
                                 'status' => $employeeData['employee_status'],
                                 'leave_start_day' => date('Y-m-d'),
                                 'leave_end_day' => null,
                                 'created_at' => now(),
                                 'updated_at' => now(),
                             ]);
                         }
                     }
                 }
                 // If changing from leave to active, record leave end
                 elseif (in_array($currentStatus, $activeStatuses) && in_array($oldStatusNormalized, $leaveStatuses)) {
                     $lastLeave = DB::table('employee_status_histories')
                         ->where('employee_id', $employee->id)
                         ->whereIn('status', $leaveStatuses)
                         ->whereNull('leave_end_date')
                         ->orderByDesc('leave_start_date')
                         ->first();
                     if ($lastLeave) {
                         DB::table('employee_status_histories')
                             ->where('id', $lastLeave->id)
                             ->update(['leave_end_date' => date('Y-m-d'), 'updated_at' => now()]);
                         if (Schema::hasTable('leaves')) {
                             $openLeaveRow = DB::table('leaves')
                                 ->where('employee_id', $employee->id)
                                 ->whereIn('status', $leaveStatuses)
                                 ->whereNull('leave_end_day')
                                 ->orderByDesc('leave_start_day')
                                 ->first();
                             if ($openLeaveRow) {
                                 DB::table('leaves')
                                     ->where('id', $openLeaveRow->id)
                                     ->update(['leave_end_day' => date('Y-m-d'), 'updated_at' => now()]);
                             }
                         }
                     }
                 }
                 else {
                     DB::table('employee_status_histories')->insert([
                         'employee_id' => $employee->id,
                         'status' => $employeeData['employee_status'],
                         'effective_date' => date('Y-m-d'),
                         'leave_start_date' => null,
                         'leave_end_date' => null,
                         'created_at' => now(),
                         'updated_at' => now(),
                     ]);
                 }
             }
        }

        return redirect()->route('employees.index')->with('success', 'Employee updated successfully!');
    }
    
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Employees $employee)
    {
        $oldData = $employee->toArray();
        $employee->delete();

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