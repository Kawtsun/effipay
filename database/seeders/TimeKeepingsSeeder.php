<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TimeKeepingsSeeder extends Seeder
{
    public function run()
    {
        $employeeIds = [1, 2, 3, 4]; // Example employee IDs
        $startDate = Carbon::create(2025, 9, 1);
        $endDate = Carbon::create(2025, 9, 30);
        $classifications = [
            'late' => ['clock_in' => '09:00:00', 'clock_out' => '16:00:00'],
            'normal' => ['clock_in' => '08:00:00', 'clock_out' => '16:00:00'],
            'undertime' => ['clock_in' => '08:00:00', 'clock_out' => '15:00:00'],
            'overtime' => ['clock_in' => '08:00:00', 'clock_out' => '17:00:00'],
            'absent' => ['clock_in' => null, 'clock_out' => null],
        ];

        foreach ($employeeIds as $employeeId) {
            $date = $startDate->copy();
            $classificationKeys = array_keys($classifications);
            $classCount = count($classificationKeys);
            while ($date->lte($endDate)) {
                // Randomize classification for each day
                $randomIndex = rand(0, $classCount - 1);
                $classification = $classifications[$classificationKeys[$randomIndex]];
                \App\Models\TimeKeeping::create([
                    'employee_id' => $employeeId,
                    'date' => $date->format('Y-m-d'),
                    'clock_in' => $classification['clock_in'],
                    'clock_out' => $classification['clock_out'],
                ]);
                $date->addDay();
            }
        }
    }
}
