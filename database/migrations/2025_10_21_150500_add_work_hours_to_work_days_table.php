<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('work_days', function (Blueprint $table) {
            if (!Schema::hasColumn('work_days', 'work_hours')) {
                $table->decimal('work_hours', 5, 2)->nullable()->after('work_end_time');
            }
        });
    }

    public function down(): void
    {
        Schema::table('work_days', function (Blueprint $table) {
            if (Schema::hasColumn('work_days', 'work_hours')) {
                $table->dropColumn('work_hours');
            }
        });
    }
};
