<?php

namespace App\Http\Controllers;

use App\Models\Reports;
use App\Http\Requests\StoreReportsRequest;
use App\Http\Requests\UpdateReportsRequest;
use Inertia\Inertia;

class ReportsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(\Illuminate\Http\Request $request)
    {
        $query = \App\Models\Employees::query();

                if ($request->filled('search')) {
                        $query->where(function($q) use ($request) {
                                $q->where('last_name', 'like', '%' . $request->search . '%')
                                    ->orWhere('first_name', 'like', '%' . $request->search . '%')
                                    ->orWhere('middle_name', 'like', '%' . $request->search . '%');
                        });
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

        return Inertia::render('reports/index', [
            'employees'   => $employees->items(),
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
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreReportsRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Reports $reports)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Reports $reports)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateReportsRequest $request, Reports $reports)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Reports $reports)
    {
        //
    }
}
