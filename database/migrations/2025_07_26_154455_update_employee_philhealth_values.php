<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Employees;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update all existing employee PhilHealth values based on base salary
        $employees = Employees::all();
        
        foreach ($employees as $employee) {
            $calculatedPhilHealth = ($employee->base_salary * 0.05) / 4;
            $philhealth = max(250, min(2500, $calculatedPhilHealth));
            
            $employee->update(['philhealth' => $philhealth]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration updates data, so we can't easily reverse it
        // The down method is intentionally left empty
    }
};
