<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use Inertia\Inertia;
use Illuminate\Http\Request;

class LeaveReportController extends Controller
{
    public function index()
    {
        // Fetch the data using the static method from the Model
        $leaveSummary = Leave::countWorkdayLeaves();

        // Use Inertia to render the React page, passing the data as a prop
        return Inertia::render('LeaveReport', [
            'leaveSummary' => $leaveSummary->toArray(), // Inertia prefers arrays/JSON
        ]);
    }
}