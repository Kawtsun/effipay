<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        try {
            Schema::table('work_days', function (Blueprint $table) {
                $table->time('work_start_time')->nullable()->change();
                $table->time('work_end_time')->nullable()->change();
            });
        } catch (\Throwable $e) {
            // Fallback when doctrine/dbal isn't installed
            DB::statement('ALTER TABLE work_days MODIFY work_start_time TIME NULL');
            DB::statement('ALTER TABLE work_days MODIFY work_end_time TIME NULL');
        }
    }

    public function down(): void
    {
        try {
            Schema::table('work_days', function (Blueprint $table) {
                $table->time('work_start_time')->nullable(false)->change();
                $table->time('work_end_time')->nullable(false)->change();
            });
        } catch (\Throwable $e) {
            DB::statement('ALTER TABLE work_days MODIFY work_start_time TIME NOT NULL');
            DB::statement('ALTER TABLE work_days MODIFY work_end_time TIME NOT NULL');
        }
    }
};
