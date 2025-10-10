<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class CreditsController extends Controller
{
    public function index()
    {
        // This is the only line of logic needed.
        return Inertia::render('Credits');
    }
}