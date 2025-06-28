<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogsController extends Controller
{
    public function index() {
        return Inertia::render('audit-logs/index');
    }
}
