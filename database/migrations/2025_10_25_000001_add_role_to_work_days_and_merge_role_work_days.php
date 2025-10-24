<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Add 'role' column to work_days if not exists
        Schema::table('work_days', function (Blueprint $table) {
            if (!Schema::hasColumn('work_days', 'role')) {
                $table->string('role')->nullable()->after('employee_id');
            }
        });

        // 2) Adjust unique constraints: drop (employee_id, day), add (employee_id, role, day)
        try {
            Schema::table('work_days', function (Blueprint $table) {
                // Drop old unique if it exists
                try { $table->dropUnique(['employee_id', 'day']); } catch (\Throwable $e) {
                    try { $table->dropUnique('work_days_employee_id_day_unique'); } catch (\Throwable $e2) {}
                }

                // Add new unique if not exists
                try { $table->unique(['employee_id', 'role', 'day'], 'work_days_emp_role_day_unique'); } catch (\Throwable $e) {}
            });
        } catch (\Throwable $e) {
            // noop: best effort on databases without doctrine/dbal
        }

        // 3) Merge data from role_work_days into work_days (if the source table exists)
        if (Schema::hasTable('role_work_days')) {
            // Insert rows not already present (based on new unique key)
            $rows = DB::table('role_work_days')->select('employee_id', 'role', 'day', 'work_start_time', 'work_end_time', 'work_hours')->orderBy('id')->get();
            foreach ($rows as $r) {
                // Try insert; on duplicate, skip
                try {
                    DB::table('work_days')->insert([
                        'employee_id' => $r->employee_id,
                        'role' => $r->role,
                        'day' => $r->day,
                        'work_start_time' => $r->work_start_time,
                        'work_end_time' => $r->work_end_time,
                        'work_hours' => $r->work_hours,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } catch (\Throwable $e) {
                    // Ignore duplicates due to unique constraint
                }
            }

            // Drop the role_work_days table after merging
            Schema::dropIfExists('role_work_days');
        }
    }

    public function down(): void
    {
        // 1) Recreate role_work_days table to restore previous state
        if (!Schema::hasTable('role_work_days')) {
            Schema::create('role_work_days', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->string('role');
                $table->string('day');
                $table->time('work_start_time')->nullable();
                $table->time('work_end_time')->nullable();
                $table->decimal('work_hours', 8, 2)->nullable();
                $table->timestamps();

                $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
                $table->unique(['employee_id', 'role', 'day'], 'role_work_days_unique');
            });
        }

        // 2) Move back any role-tagged rows from work_days into role_work_days
        if (Schema::hasTable('work_days')) {
            $rows = DB::table('work_days')->whereNotNull('role')->select('employee_id', 'role', 'day', 'work_start_time', 'work_end_time', 'work_hours')->get();
            foreach ($rows as $r) {
                try {
                    DB::table('role_work_days')->insert([
                        'employee_id' => $r->employee_id,
                        'role' => $r->role,
                        'day' => $r->day,
                        'work_start_time' => $r->work_start_time,
                        'work_end_time' => $r->work_end_time,
                        'work_hours' => $r->work_hours,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } catch (\Throwable $e) {
                    // ignore duplicates
                }
            }
        }

        // 3) Drop unique (employee_id, role, day) and restore (employee_id, day)
        try {
            Schema::table('work_days', function (Blueprint $table) {
                try { $table->dropUnique('work_days_emp_role_day_unique'); } catch (\Throwable $e) {}
                try { $table->unique(['employee_id', 'day']); } catch (\Throwable $e) {}
            });
        } catch (\Throwable $e) {}

        // 4) Drop 'role' column from work_days
        if (Schema::hasColumn('work_days', 'role')) {
            Schema::table('work_days', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }
    }
};
