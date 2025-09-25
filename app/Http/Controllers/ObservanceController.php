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
            'add' => 'array',
            'add.*' => 'date',
            'remove' => 'array',
            'remove.*' => 'date',
            'label' => 'nullable|string',
        ]);

        $created = [];
        $removed = [];

        // Add new observances (manual entries always is_automated = false)
        if (!empty($data['add'])) {
            foreach ($data['add'] as $date) {
                $created[] = Observance::updateOrCreate(
                    ['date' => $date],
                    [
                        'label' => $data['label'] ?? null,
                        'is_automated' => false,
                    ]
                );
            }
        }

        // Remove observances (do not allow deleting automated holidays)
        if (!empty($data['remove'])) {
            foreach ($data['remove'] as $date) {
                $deleted = Observance::where('date', $date)
                    ->where(function($q) {
                        $q->where('is_automated', false)->orWhereNull('is_automated');
                    })
                    ->delete();
                if ($deleted) {
                    $removed[] = $date;
                }
            }
        }

        return response()->json([
            'success' => true,
            'added' => $created,
            'removed' => $removed,
        ]);
    }

    // Delete an observance by date
    public function destroy($date)
    {
        $deleted = Observance::where('date', $date)->delete();
        return response()->json(['success' => $deleted > 0]);
    }
}
