<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure role column exists
        Schema::table('work_days', function (Blueprint $table) {
            if (!Schema::hasColumn('work_days', 'role')) {
                $table->string('role')->nullable()->after('employee_id');
            }
        });

        // Drop legacy unique (employee_id, day) if it still exists
        try {
            // Named index used by earlier migration
            DB::statement('ALTER TABLE `work_days` DROP INDEX `work_days_employee_id_day_unique`');
        } catch (\Throwable $e) {
            // ignore if not present
        }
        try {
            // Fallback unnamed/auto name (some installs)
            DB::statement('ALTER TABLE `work_days` DROP INDEX `work_days_employee_id_day_index`');
        } catch (\Throwable $e) {
            // ignore
        }
        try {
            // As a last resort, attempt schema API drop by columns (requires dbal; safe to ignore failure)
            Schema::table('work_days', function (Blueprint $table) {
                try { $table->dropUnique(['employee_id', 'day']); } catch (\Throwable $e) {}
            });
        } catch (\Throwable $e) {
            // ignore
        }

        // Create the correct unique key (employee_id, role, day)
        try {
            DB::statement('CREATE UNIQUE INDEX `work_days_emp_role_day_unique` ON `work_days` (`employee_id`, `role`, `day`)');
        } catch (\Throwable $e) {
            // If it already exists, ignore
        }
    }

    public function down(): void
    {
        // Drop role-aware unique
        try {
            DB::statement('ALTER TABLE `work_days` DROP INDEX `work_days_emp_role_day_unique`');
        } catch (\Throwable $e) {
            // ignore
        }

        // Restore legacy unique (employee_id, day)
        try {
            DB::statement('CREATE UNIQUE INDEX `work_days_employee_id_day_unique` ON `work_days` (`employee_id`, `day`)');
        } catch (\Throwable $e) {
            // ignore
        }

        // Optionally drop role column (not necessary to rollback app logic)
        // Keeping it avoids data loss; remove next block if you prefer dropping
        // the column when rolling back.
    }
};
