<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('observances', function (Blueprint $table) {
            // type: e.g. 'whole-day', 'half-day', 'rainy-day', 'other'
            $table->string('type')->nullable()->after('label');
            // start_time stored as TIME (nullable) for half-day events
            $table->time('start_time')->nullable()->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('observances', function (Blueprint $table) {
            $table->dropColumn(['type', 'start_time']);
        });
    }
};
