<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\Observance;

class FetchHolidaysCommand extends Command
{
    protected $signature = 'observances:fetch-holidays {year?}';
    protected $description = 'Fetch Philippine public holidays from Nager.Date API and store them in the observances table.';

    public function handle()
    {
        $year = $this->argument('year') ?? now()->year;
        $url = "https://date.nager.at/api/v3/PublicHolidays/{$year}/PH";
        $this->info("Fetching holidays for year $year...");
    $response = Http::withoutVerifying()->get($url);
        if (!$response->ok()) {
            $this->error('Failed to fetch holidays from Nager.Date API.');
            return 1;
        }
        $holidays = $response->json();
        $count = 0;
        foreach ($holidays as $holiday) {
            $date = $holiday['date'];
            $label = $holiday['name'] ?? $holiday['name'] ?? 'Holiday';
            $existing = Observance::where('date', $date)->first();
            if ($existing) {
                if (!$existing->is_automated) continue; // Don't overwrite manual
                $existing->label = $label;
                $existing->is_automated = true;
                $existing->save();
            } else {
                Observance::create([
                    'date' => $date,
                    'label' => $label,
                    'is_automated' => true,
                ]);
            }
            $count++;
        }
        $this->info("Fetched and stored $count holidays for $year.");
        return 0;
    }
}
