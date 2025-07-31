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
        Schema::table('employees', function (Blueprint $table) {
            $table->integer('work_hours_per_day')->default(8)->after('withholding_tax');
            $table->time('work_start_time')->default('08:00:00')->after('work_hours_per_day');
            $table->time('work_end_time')->default('17:00:00')->after('work_start_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['work_hours_per_day', 'work_start_time', 'work_end_time']);
        });
    }
};
