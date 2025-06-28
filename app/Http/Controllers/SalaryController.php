<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class SalaryController extends Controller
{
    public function index() {
        return Inertia::render('salary/index');
    }
}
