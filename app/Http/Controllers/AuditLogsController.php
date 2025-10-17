<?php

namespace App\Http\Controllers;

use App\Models\AuditLogs;
use App\Http\Requests\StoreAuditLogsRequest;
use App\Http\Requests\UpdateAuditLogsRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class AuditLogsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = 6;
        $search = trim((string) $request->input('q', ''));
        $selectedAction = trim((string) $request->input('action', ''));

        $query = AuditLogs::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                // Basic text matches across common fields
                $q->where('action', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('entity_type', 'like', "%{$search}%")
                    ->orWhere('details', 'like', "%{$search}%");

                // Date handling: support YYYY-MM or YYYY-MM-DD, else attempt a parse
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $search)) {
                    // Exact date
                    try {
                        $date = Carbon::createFromFormat('Y-m-d', $search, 'Asia/Manila');
                        $q->orWhereDate('date', '=', $date->toDateString());
                    } catch (\Throwable $e) {
                        // ignore parse errors
                    }
                } elseif (preg_match('/^\d{4}-\d{2}$/', $search)) {
                    // Month
                    try {
                        [$year, $month] = explode('-', $search);
                        $q->orWhere(function ($qq) use ($year, $month) {
                            $qq->whereYear('date', (int) $year)->whereMonth('date', (int) $month);
                        });
                    } catch (\Throwable $e) {
                        // ignore parse errors
                    }
                } else {
                    // Attempt a lenient parse (e.g., "Oct 2025", "October 16, 2025")
                    try {
                        $parsed = Carbon::parse($search, 'Asia/Manila');
                        if ($parsed) {
                            $q->orWhereDate('date', '=', $parsed->toDateString());
                        }
                    } catch (\Throwable $e) {
                        // not a date-like input; do nothing
                    }
                }
            });
        }

        if ($selectedAction !== '' && strtolower($selectedAction) !== 'all') {
            $query->where('action', $selectedAction);
        }

        $logs = $query->orderByDesc('date')->paginate($perPage)->appends([
            'q' => $search,
            'action' => $selectedAction,
        ]);

        // Format logs for frontend
        $auditLogs = array_map(function ($log) {
            return [
                'id' => $log->id,
                'action' => $log->action,
                'name' => $log->name,
                'username' => $log->username,
                'entity_type' => $log->entity_type,
                'entity_id' => $log->entity_id,
                'date' => $log->date,
                'details' => $log->details,
            ];
        }, $logs->items());

        return Inertia::render('audit-logs/index', [
            'auditLogs' => $auditLogs,
            'currentPage' => $logs->currentPage(),
            'totalPages' => $logs->lastPage(),
            'q' => $search,
            'action' => $selectedAction,
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
    public function store(StoreAuditLogsRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(AuditLogs $auditLogs)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(AuditLogs $auditLogs)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAuditLogsRequest $request, AuditLogs $auditLogs)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AuditLogs $auditLogs)
    {
        //
    }

    /**
     * Log print-related actions from the frontend: payslip or BTR
     */
    public function logPrint(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:payslip,btr,ledger',
            'employee_id' => 'nullable|integer',
            'month' => 'nullable|string',
            'details' => 'array',
        ]);

        try {
            $username = \Illuminate\Support\Facades\Auth::user()->username ?? 'system';
            $entityName = $validated['type'] === 'payslip' ? 'Print Payslip' : ($validated['type'] === 'btr' ? 'Print BTR' : 'Export Ledger');
            $entityType = $validated['type'];
            $entityId = $validated['employee_id'] ?? null;
            $details = $validated['details'] ?? [];

            // If individual printing (employee_id present), include employee name
            if (!empty($entityId)) {
                try {
                    $emp = \App\Models\Employees::find($entityId);
                    if ($emp) {
                        $fullName = trim($emp->last_name . ', ' . $emp->first_name . ($emp->middle_name ? ' ' . $emp->middle_name : ''));
                        $details['employee_id'] = $entityId;
                        $details['employee_name'] = $fullName;
                    }
                } catch (\Throwable $e) {
                    // ignore lookup errors
                }
            }

            AuditLogs::create([
                'username'    => $username,
                'action'      => strtolower($entityName),
                'name'        => $validated['month'] ?? now('Asia/Manila')->toDateString(),
                'entity_type' => $entityType,
                'entity_id'   => $entityId,
                'details'     => json_encode($details),
                'date'        => now('Asia/Manila'),
            ]);

            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Failed to log print action'], 500);
        }
    }
}
