<?php

namespace App\Http\Controllers;

use App\Models\Observance;
use Illuminate\Http\Request;

class ObservanceController extends Controller
{
    // List all observances
    public function index()
    {
        return response()->json(Observance::all());
    }

    // Store new observances (expects array of dates and optional label)
    public function store(Request $request)
    {
        $data = $request->validate([
            'dates' => 'required|array',
            'dates.*' => 'date',
            'label' => 'nullable|string',
        ]);
        $created = [];
        foreach ($data['dates'] as $date) {
            $created[] = Observance::updateOrCreate(
                ['date' => $date],
                ['label' => $data['label'] ?? null]
            );
        }
        return response()->json(['success' => true, 'observances' => $created]);
    }

    // Delete an observance by date
    public function destroy($date)
    {
        $deleted = Observance::where('date', $date)->delete();
        return response()->json(['success' => $deleted > 0]);
    }
}
