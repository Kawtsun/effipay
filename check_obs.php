<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$obs = App\Models\Observance::where('date', 'like', '2025-01%')->orderBy('date')->get();
echo "Total observances in January 2025: " . $obs->count() . "\n";
foreach ($obs as $o) {
    echo $o->date . ' | Type: ' . ($o->type ?: 'NULL') . ' | Label: ' . ($o->label ?: 'NULL') . "\n";
}

// Check Ludwig Beethoven's overtime calculation
echo "\n--- Checking Ludwig Beethoven ---\n";
$emp = App\Models\Employees::where('last_name', 'Beethoven')->first();
if ($emp) {
    echo "Employee ID: " . $emp->id . "\n";
    $payroll = App\Models\Payroll::where('employee_id', $emp->id)
        ->whereYear('payroll_date', 2025)
        ->whereMonth('payroll_date', 1)
        ->first();
    if ($payroll) {
        echo "Overtime Hours: " . $payroll->overtime_count_weekdays . " weekdays\n";
        echo "Overtime Hours (weekends): " . $payroll->overtime_count_weekends . " weekends\n";
        echo "Overtime Hours (observances): " . $payroll->overtime_count_observances . " observances\n";
        echo "Total Overtime: " . $payroll->overtime . " hours\n";
        echo "Absences: " . $payroll->absences . " hours\n";
    }
}
