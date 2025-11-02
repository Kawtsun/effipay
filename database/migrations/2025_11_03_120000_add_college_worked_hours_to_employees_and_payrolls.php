<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add to employees
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'college_worked_hours')) {
                $table->decimal('college_worked_hours', 8, 2)->nullable()->after('college_rate');
            }
        });

        // Add to payrolls
        Schema::table('payrolls', function (Blueprint $table) {
            if (!Schema::hasColumn('payrolls', 'college_worked_hours')) {
                $table->decimal('college_worked_hours', 8, 2)->nullable()->after('college_rate');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'college_worked_hours')) {
                $table->dropColumn('college_worked_hours');
            }
        });

        Schema::table('payrolls', function (Blueprint $table) {
            if (Schema::hasColumn('payrolls', 'college_worked_hours')) {
                $table->dropColumn('college_worked_hours');
            }
        });
    }
};
