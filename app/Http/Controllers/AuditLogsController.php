<?php

namespace App\Http\Controllers;

use App\Models\AuditLogs;
use App\Http\Requests\StoreAuditLogsRequest;
use App\Http\Requests\UpdateAuditLogsRequest;
use Inertia\Inertia;

class AuditLogsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('audit-logs/index');
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
}
