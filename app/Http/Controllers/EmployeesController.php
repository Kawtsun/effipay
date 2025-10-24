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
use Carbon\Carbon;

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

        // Map frontend basic_education_level to DB column basic_edu_level
        if (array_key_exists('basic_education_level', $employeeData)) {
            $employeeData['basic_edu_level'] = $employeeData['basic_education_level'];
            unset($employeeData['basic_education_level']);
        }
        
        // Correctly handle the rate_per_hour field before sanitation
        if (isset($employeeData['rate_per_hour'])) {
            $employeeData['college_rate'] = $employeeData['rate_per_hour'];
            unset($employeeData['rate_per_hour']);
        }
        
        // Remove fields that shouldn't be stored in employees table
        unset($employeeData['work_days']);
        unset($employeeData['college_work_hours_by_program']);
        unset($employeeData['college_work_days_by_program']);
        
        // Sanitize numeric fields to null if they are empty
        foreach ([
            'base_salary', 'honorarium', 'college_rate',
            'pag_ibig',
            'sss_salary_loan', 'sss_calamity_loan', 'pagibig_multi_loan', 
            'pagibig_calamity_loan', 'peraa_con', 'tuition', 'china_bank', 'tea'
        ] as $field) {
            if (isset($employeeData[$field]) && ($employeeData[$field] === '' || $employeeData[$field] === null)) {
                $employeeData[$field] = null;
            }
        }
        
    // Extract and flatten work_days from role-based structure
        $workDaysRaw = $validatedData['work_days'] ?? [];
    $workDaysFlattened = [];
        
        // Handle both flat array and role-based object structure
        if (is_array($workDaysRaw)) {
            // Check if it's a role-based structure (object with role keys)
            $isRoleBased = false;
            foreach ($workDaysRaw as $key => $value) {
                if (is_string($key) && is_array($value)) {
                    $isRoleBased = true;
                    break;
                }
            }
            
            if ($isRoleBased) {
                // Flatten role-based structure: { "administrator": [...], "college instructor": [...] }
                foreach ($workDaysRaw as $role => $days) {
                    if (is_array($days)) {
                        foreach ($days as $day) {
                            if (isset($day['day'], $day['work_start_time'], $day['work_end_time'])) {
                                $workDaysFlattened[] = [
                                    'day' => $day['day'],
                                    'work_start_time' => $day['work_start_time'],
                                    'work_end_time' => $day['work_end_time'],
                                    'work_hours' => $day['work_hours'] ?? null,
                                    'role' => $role, // Optionally store the role
                                ];
                            }
                        }
                    }
                }
            } else {
                // Already flat array structure
                $workDaysFlattened = $workDaysRaw;
            }
        }

        // Determine role mix
        $rolesRaw = (string)($employeeData['roles'] ?? '');
        $rolesArr = array_map('strtolower', array_filter(array_map('trim', explode(',', $rolesRaw))));
        $hasNonCollegeRole = !empty(array_filter($rolesArr, fn ($r) => str_contains($r, 'admin') || str_contains($r, 'basic education') || (!str_contains($r, 'college') && $r !== '')));
        $hasCollegeRole = !empty(array_filter($rolesArr, fn ($r) => str_contains($r, 'college')));

        // Build college-only per-day hours when applicable
        $workDaysCollege = [];
        if ($hasCollegeRole) {
            $daysByProgram = $validatedData['college_work_days_by_program'] ?? [];
            $hoursByProgram = $validatedData['college_work_hours_by_program'] ?? [];
            $sumPerDay = [];
            if (is_array($daysByProgram)) {
                foreach ($daysByProgram as $code => $days) {
                    $hours = isset($hoursByProgram[$code]) ? (float)$hoursByProgram[$code] : 0.0;
                    if ($hours <= 0) { continue; }
                    if (is_array($days)) {
                        foreach ($days as $d) {
                            $label = is_array($d) && isset($d['day']) ? (string)$d['day'] : (is_string($d) ? (string)$d : null);
                            if (!$label) { continue; }
                            $dayKey = strtolower($label);
                            if (!isset($sumPerDay[$dayKey])) {
                                $sumPerDay[$dayKey] = ['hours' => 0.0, 'label' => $label];
                            }
                            $sumPerDay[$dayKey]['hours'] += $hours;
                        }
                    }
                }
            }
            foreach ($sumPerDay as $entry) {
                if (($entry['hours'] ?? 0) > 0) {
                    $workDaysCollege[] = [
                        'day' => $entry['label'],
                        'work_start_time' => null,
                        'work_end_time' => null,
                        'work_hours' => round($entry['hours'], 2),
                    ];
                }
            }
        }

        // Decide which set to insert
        if ($hasNonCollegeRole && $hasCollegeRole) {
            // Merge: keep time-based rows, inject work_hours from college per matching day,
            // and add any extra college-only days as rows with null times + hours.
            $byDay = [];
            foreach ($workDaysFlattened as $wd) {
                $key = strtolower($wd['day'] ?? '');
                if ($key !== '') { $byDay[$key] = $wd; }
            }
            foreach ($workDaysCollege as $cd) {
                $key = strtolower($cd['day'] ?? '');
                if ($key === '') { continue; }
                if (isset($byDay[$key])) {
                    $byDay[$key]['work_hours'] = $cd['work_hours'] ?? null;
                } else {
                    $byDay[$key] = $cd;
                }
            }
            $workDaysForInsert = array_values($byDay);
        } elseif ($hasNonCollegeRole) {
            $workDaysForInsert = $workDaysFlattened;
        } else {
            $workDaysForInsert = $workDaysCollege;
        }

        DB::transaction(function () use ($employeeData, $employeeTypesData, $workDaysForInsert, $validatedData) {
            $employee = Employees::create($employeeData);

            if (is_array($employeeTypesData)) {
                foreach ($employeeTypesData as $role => $type) {
                    $employee->employeeTypes()->create(['role' => $role, 'type' => $type]);
                }
            }

            if (is_array($workDaysForInsert) && count($workDaysForInsert) > 0) {
                // Normalize current roles declared on the employee so we only persist
                // schedules for roles that are actually assigned to the employee.
                $currentRolesRaw = (string)($employeeData['roles'] ?? '');
                $currentRoles = array_map('strtolower', array_map('trim', explode(',', $currentRolesRaw)));

                foreach ($workDaysForInsert as $workDay) {
                    if (!isset($workDay['day'])) continue;

                    // If a role is provided on the workDay, only persist it when the
                    // role is present in the currentRoles list. This prevents stale
                    // schedules from previous roles being re-inserted when the role
                    // has been removed from the employee.
                    $wdRole = isset($workDay['role']) ? strtolower(trim($workDay['role'])) : null;
                    if ($wdRole !== null && $wdRole !== '') {
                        if (!in_array($wdRole, $currentRoles, true)) {
                            // Skip persisting schedules for roles no longer assigned.
                            continue;
                        }

                        // Only persist to role_work_days when the role is a non-college role.
                        if (stripos($wdRole, 'college') === false) {
                            $employee->roleWorkDays()->create([
                                'role' => $workDay['role'],
                                'day' => $workDay['day'],
                                'work_start_time' => $workDay['work_start_time'] ?? null,
                                'work_end_time' => $workDay['work_end_time'] ?? null,
                                'work_hours' => $workDay['work_hours'] ?? null,
                            ]);
                        } else {
                            // Persist college role entries to legacy table for now (they are
                            // also handled in college_program_schedules).
                            $employee->workDays()->create([
                                'day' => $workDay['day'],
                                'work_start_time' => $workDay['work_start_time'] ?? null,
                                'work_end_time' => $workDay['work_end_time'] ?? null,
                                'work_hours' => $workDay['work_hours'] ?? null,
                            ]);
                        }
                    } else {
                        // Untagged entries go to legacy table
                        $employee->workDays()->create([
                            'day' => $workDay['day'],
                            'work_start_time' => $workDay['work_start_time'] ?? null,
                            'work_end_time' => $workDay['work_end_time'] ?? null,
                            'work_hours' => $workDay['work_hours'] ?? null,
                        ]);
                    }
                }
            }
            
            // Persist college program schedules (per program/day with hours)
            $daysByProgram = $validatedData['college_work_days_by_program'] ?? [];
            $hoursByProgram = $validatedData['college_work_hours_by_program'] ?? [];
            if (is_array($daysByProgram) && is_array($hoursByProgram)) {
                foreach ($daysByProgram as $code => $days) {
                    $hours = isset($hoursByProgram[$code]) ? (float)$hoursByProgram[$code] : 0.0;
                    if (!is_array($days) || count($days) === 0) { continue; }
                    foreach ($days as $d) {
                        $label = is_array($d) && isset($d['day']) ? (string)$d['day'] : (is_string($d) ? (string)$d : null);
                        if (!$label) { continue; }
                        $employee->collegeProgramSchedules()->create([
                            'program_code' => $code,
                            'day' => $label,
                            'hours_per_day' => $hours > 0 ? $hours : 0,
                        ]);
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
    $employee->load(['workDays', 'roleWorkDays', 'employeeTypes', 'collegeProgramSchedules']);

        $salaryDefaults = Salary::all()->mapWithKeys(fn($row) => [
            $row->employee_type => $row->toArray(),
        ]);
        
    $employeeData = $employee->toArray();
        $employeeData['employee_types'] = $employee->employeeTypes->pluck('type', 'role')->toArray();

    // Expose DB column basic_edu_level as basic_education_level for the UI
    $employeeData['basic_education_level'] = $employeeData['basic_edu_level'] ?? null;

        // Ensure college_rate is populated for older records that used rate_per_hour
        if (!isset($employeeData['college_rate']) || $employeeData['college_rate'] === null || $employeeData['college_rate'] === '') {
            if (isset($employeeData['rate_per_hour']) && $employeeData['rate_per_hour'] !== '') {
                $employeeData['college_rate'] = $employeeData['rate_per_hour'];
            }
        }

        // Normalize work schedule payload for the edit page
        // 1) Build per-role map for NON-college roles from time-based entries
        $rolesRaw = (string)($employeeData['roles'] ?? '');
        $rolesArr = array_values(array_filter(array_map('trim', explode(',', $rolesRaw))));
        $nonCollegeRoles = array_values(array_filter($rolesArr, fn ($r) => stripos($r, 'college') === false));

        $timeBasedDays = $employee->workDays
            ->filter(function ($wd) {
                return !empty($wd->work_start_time) || !empty($wd->work_end_time);
            })
            ->values();

        if (count($nonCollegeRoles) > 0) {
            // First, collect any schedules already stored in the new role_work_days table
            // and map them by role so they take precedence.
            $map = [];
            foreach ($employee->roleWorkDays as $rwd) {
                $role = $rwd->role ?? 'other';
                // Ignore any role_work_days that reference college roles — college
                // schedules are stored separately in college_program_schedules.
                if (stripos($role, 'college') !== false) {
                    continue;
                }
                if (!isset($map[$role])) $map[$role] = [];
                $map[$role][] = [
                    'day' => $rwd->day,
                    'work_start_time' => $rwd->work_start_time,
                    'work_end_time' => $rwd->work_end_time,
                    'work_hours' => $rwd->work_hours,
                ];
            }

            // Next, any legacy time-based rows (in work_days) that weren't saved with
            // a role should be merged in using contiguous chunking and only assigned
            // for roles that don't already have entries for those days.
            $timeBasedArray = $timeBasedDays->map(function ($wd) {
                return [
                    'day' => $wd->day,
                    'work_start_time' => $wd->work_start_time,
                    'work_end_time' => $wd->work_end_time,
                    'work_hours' => $wd->work_hours,
                ];
            })->toArray();

            // Remove any days already present via roleWorkDays to avoid duplicates
            $existingDays = [];
            foreach ($map as $role => $days) {
                foreach ($days as $d) {
                    $existingDays[strtolower($d['day'])] = true;
                }
            }
            $legacyToAssign = array_values(array_filter($timeBasedArray, function ($d) use ($existingDays) {
                return !isset($existingDays[strtolower($d['day'])]);
            }));

            if (count($legacyToAssign) > 0) {
                $countRoles = count($nonCollegeRoles);
                $total = count($legacyToAssign);
                $base = intdiv($total, $countRoles);
                $rem = $total % $countRoles;
                $index = 0;
                for ($r = 0; $r < $countRoles; $r++) {
                    $chunkSize = $base + ($r < $rem ? 1 : 0);
                    $role = $nonCollegeRoles[$r];
                    if (!isset($map[$role])) $map[$role] = [];
                    if ($chunkSize > 0) {
                        $slice = array_slice($legacyToAssign, $index, $chunkSize);
                        foreach ($slice as $s) $map[$role][] = $s;
                        $index += $chunkSize;
                    }
                }
            }

            $employeeData['work_days'] = $map;
        }

        // 2) Prefill college program days and hours from the new schedules table when available
        $programsRaw = (string)($employeeData['college_program'] ?? '');
        $programCodes = array_values(array_filter(array_map('trim', explode(',', $programsRaw))));
        if (count($programCodes) > 0) {
            $daysByProgram = [];
            $hoursByProgram = [];
            $byProgram = $employee->collegeProgramSchedules
                ->groupBy('program_code');
            foreach ($programCodes as $code) {
                $rows = $byProgram->get($code);
                if ($rows && $rows->count() > 0) {
                    $daysByProgram[$code] = $rows->map(fn($r) => ['day' => $r->day])->values()->toArray();
                    // hours_per_day is stored per program; use as-is (assumes same hours across its selected days)
                    // If rows contain varying hours, prefer the first non-zero
                    $hp = (float)($rows->firstWhere('hours_per_day', '>', 0)->hours_per_day ?? 0);
                    $hoursByProgram[$code] = $hp > 0 ? (string)$hp : '';
                }
            }
            if (!empty($daysByProgram)) {
                $employeeData['college_work_days_by_program'] = $daysByProgram;
            }
            if (!empty($hoursByProgram)) {
                $employeeData['college_work_hours_by_program'] = $hoursByProgram;
            }
        }

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

        // Map frontend basic_education_level to DB column basic_edu_level
        if (array_key_exists('basic_education_level', $employeeData)) {
            $employeeData['basic_edu_level'] = $employeeData['basic_education_level'];
            unset($employeeData['basic_education_level']);
        }
        
        // Map rate_per_hour to college_rate then remove it (use array_key_exists so null clears the value)
        if (array_key_exists('rate_per_hour', $employeeData)) {
            $employeeData['college_rate'] = $employeeData['rate_per_hour'];
            unset($employeeData['rate_per_hour']);
        }

        // Remove fields that shouldn't be stored in employees table
        unset($employeeData['work_days']);
        unset($employeeData['college_work_hours_by_program']);
        unset($employeeData['college_work_days_by_program']);

        // Sanitize numeric fields for update:
        // - If the incoming value is an empty string, treat it as "no change" and remove the key
        //   so the current DB value is preserved.
        // - If the incoming value is null, allow null (explicit clear).
        foreach ([
            'base_salary', 'honorarium', 'college_rate',
            'pag_ibig',
            'sss_salary_loan', 'sss_calamity_loan', 'pagibig_multi_loan', 
            'pagibig_calamity_loan', 'peraa_con', 'tuition', 'china_bank', 'tea'
        ] as $field) {
            if (array_key_exists($field, $employeeData)) {
                if ($employeeData[$field] === '') {
                    // Remove empty-string fields to avoid unintentionally clearing DB values
                    unset($employeeData[$field]);
                } elseif ($employeeData[$field] === null) {
                    // Explicit null should clear the DB value
                    $employeeData[$field] = null;
                }
            }
        }
        
        $oldData = $employee->load('employeeTypes', 'workDays')->toArray();
        $oldStatus = $employee->employee_status;
        
    // Extract and flatten work_days from role-based structure
        $workDaysRaw = $validatedData['work_days'] ?? [];
    $workDaysFlattened = [];
        
        // Handle both flat array and role-based object structure
        if (is_array($workDaysRaw)) {
            // Check if it's a role-based structure (object with role keys)
            $isRoleBased = false;
            foreach ($workDaysRaw as $key => $value) {
                if (is_string($key) && is_array($value)) {
                    $isRoleBased = true;
                    break;
                }
            }
            
            if ($isRoleBased) {
                // Flatten role-based structure: { "administrator": [...], "college instructor": [...] }
                foreach ($workDaysRaw as $role => $days) {
                    if (is_array($days)) {
                        foreach ($days as $day) {
                            if (isset($day['day'], $day['work_start_time'], $day['work_end_time'])) {
                                $workDaysFlattened[] = [
                                    'day' => $day['day'],
                                    'work_start_time' => $day['work_start_time'],
                                    'work_end_time' => $day['work_end_time'],
                                    'work_hours' => $day['work_hours'] ?? null,
                                    'role' => $role, // Optionally store the role
                                ];
                            }
                        }
                    }
                }
            } else {
                // Already flat array structure
                $workDaysFlattened = $workDaysRaw;
            }
        }

        // Determine role mix
        $rolesRaw = (string)($employeeData['roles'] ?? '');
        $rolesArr = array_map('strtolower', array_filter(array_map('trim', explode(',', $rolesRaw))));
        $hasNonCollegeRole = !empty(array_filter($rolesArr, fn ($r) => str_contains($r, 'admin') || str_contains($r, 'basic education') || (!str_contains($r, 'college') && $r !== '')));
        $hasCollegeRole = !empty(array_filter($rolesArr, fn ($r) => str_contains($r, 'college')));

        // Build college-only per-day hours when applicable
        $workDaysCollege = [];
        if ($hasCollegeRole) {
            $daysByProgram = $validatedData['college_work_days_by_program'] ?? [];
            $hoursByProgram = $validatedData['college_work_hours_by_program'] ?? [];
            $sumPerDay = [];
            if (is_array($daysByProgram)) {
                foreach ($daysByProgram as $code => $days) {
                    $hours = isset($hoursByProgram[$code]) ? (float)$hoursByProgram[$code] : 0.0;
                    if ($hours <= 0) { continue; }
                    if (is_array($days)) {
                        foreach ($days as $d) {
                            $label = is_array($d) && isset($d['day']) ? (string)$d['day'] : (is_string($d) ? (string)$d : null);
                            if (!$label) { continue; }
                            $dayKey = strtolower($label);
                            if (!isset($sumPerDay[$dayKey])) {
                                $sumPerDay[$dayKey] = ['hours' => 0.0, 'label' => $label];
                            }
                            $sumPerDay[$dayKey]['hours'] += $hours;
                        }
                    }
                }
            }
            foreach ($sumPerDay as $entry) {
                if (($entry['hours'] ?? 0) > 0) {
                    $workDaysCollege[] = [
                        'day' => $entry['label'],
                        'work_start_time' => null,
                        'work_end_time' => null,
                        'work_hours' => round($entry['hours'], 2),
                    ];
                }
            }
        }

        if ($hasNonCollegeRole && $hasCollegeRole) {
            $byDay = [];
            foreach ($workDaysFlattened as $wd) {
                $key = strtolower($wd['day'] ?? '');
                if ($key !== '') { $byDay[$key] = $wd; }
            }
            foreach ($workDaysCollege as $cd) {
                $key = strtolower($cd['day'] ?? '');
                if ($key === '') { continue; }
                if (isset($byDay[$key])) {
                    $byDay[$key]['work_hours'] = $cd['work_hours'] ?? null;
                } else {
                    $byDay[$key] = $cd;
                }
            }
            $workDaysForInsert = array_values($byDay);
        } elseif ($hasNonCollegeRole) {
            $workDaysForInsert = $workDaysFlattened;
        } else {
            $workDaysForInsert = $workDaysCollege;
        }

        DB::transaction(function () use ($employee, $employeeData, $employeeTypesData, $workDaysForInsert, $oldData, $validatedData) {
            $employee->update($employeeData);

            $employee->employeeTypes()->delete();
            if (is_array($employeeTypesData)) {
                foreach ($employeeTypesData as $role => $type) {
                    $employee->employeeTypes()->create(['role' => $role, 'type' => $type]);
                }
            }
            
            // Clear both legacy work_days and new role_work_days, then re-insert as appropriate
            $employee->workDays()->delete();
            $employee->roleWorkDays()->delete();
            if (is_array($workDaysForInsert)) {
                foreach ($workDaysForInsert as $workDay) {
                    if (!isset($workDay['day'])) continue;
                    if (!empty($workDay['role'])) {
                        $employee->roleWorkDays()->create([
                            'role' => $workDay['role'],
                            'day' => $workDay['day'],
                            'work_start_time' => $workDay['work_start_time'] ?? null,
                            'work_end_time' => $workDay['work_end_time'] ?? null,
                            'work_hours' => $workDay['work_hours'] ?? null,
                        ]);
                    } else {
                        $employee->workDays()->create([
                            'day' => $workDay['day'],
                            'work_start_time' => $workDay['work_start_time'] ?? null,
                            'work_end_time' => $workDay['work_end_time'] ?? null,
                            'work_hours' => $workDay['work_hours'] ?? null,
                        ]);
                    }
                }
            }

            // Ensure there are no leftover role_work_days for roles that are no
            // longer assigned to the employee. This is defensive cleanup in case
            // the incoming payload still contained stale entries.
            $currentRolesRaw = (string)($employeeData['roles'] ?? '');
            $currentRoles = array_map('strtolower', array_map('trim', explode(',', $currentRolesRaw)));
            foreach ($employee->roleWorkDays as $rwd) {
                if (!in_array(strtolower(trim($rwd->role)), $currentRoles, true)) {
                    $rwd->delete();
                }
            }

            // Replace college program schedules with latest data
            $employee->collegeProgramSchedules()->delete();
            $daysByProgram = $validatedData['college_work_days_by_program'] ?? [];
            $hoursByProgram = $validatedData['college_work_hours_by_program'] ?? [];
            if (is_array($daysByProgram) && is_array($hoursByProgram)) {
                foreach ($daysByProgram as $code => $days) {
                    $hours = isset($hoursByProgram[$code]) ? (float)$hoursByProgram[$code] : 0.0;
                    if (!is_array($days) || count($days) === 0) { continue; }
                    foreach ($days as $d) {
                        $label = is_array($d) && isset($d['day']) ? (string)$d['day'] : (is_string($d) ? (string)$d : null);
                        if (!$label) { continue; }
                        $employee->collegeProgramSchedules()->create([
                            'program_code' => $code,
                            'day' => $label,
                            'hours_per_day' => $hours > 0 ? $hours : 0,
                        ]);
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