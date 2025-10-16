<?php
namespace App\Http\Controllers;

use App\Models\Observance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class ObservanceController extends Controller
{
    // Trigger artisan command to fetch holidays
    public function fetchHolidays()
    {
        Artisan::call('observances:fetch-holidays');
        return response()->json(['status' => 'ok']);
    }
    // List all observances
    public function index()
    {
        return response()->json(Observance::all());
    }

    // Store new observances (expects array of dates and optional label)
    public function store(Request $request)
    {
        // Accept either array of date strings (backwards compatible) or array of objects
        $data = $request->validate([
            'add' => 'array',
            'remove' => 'array',
            'label' => 'nullable|string',
        ]);

        $created = [];
        $removed = [];

        // Add new observances (manual entries always is_automated = false)
        if (!empty($data['add'])) {
            foreach ($data['add'] as $item) {
                // support string date (backwards compatible) or object { date, label, type, start_time }
                if (is_string($item)) {
                    $date = $item;
                    $label = $data['label'] ?? null;
                    $type = null;
                    $start_time = null;
                } elseif (is_array($item)) {
                    $date = $item['date'] ?? null;
                    $label = $item['label'] ?? ($data['label'] ?? null);
                    $type = $item['type'] ?? null;
                    $start_time = $item['start_time'] ?? null;
                } else {
                    continue;
                }
                if (!$date) continue;
                $created[] = Observance::updateOrCreate(
                    ['date' => $date],
                    [
                        'label' => $label,
                        'is_automated' => false,
                        'type' => $type,
                        'start_time' => $start_time,
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
