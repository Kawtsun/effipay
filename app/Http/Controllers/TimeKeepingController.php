<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class TimeKeepingController extends Controller
{
    public function index() {
        return Inertia::render('time-keeping/index');
    }
}
