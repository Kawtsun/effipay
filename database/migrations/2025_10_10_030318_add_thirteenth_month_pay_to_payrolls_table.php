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
        Schema::table('payrolls', function (Blueprint $table) {
            // Add this line
            $table->decimal('thirteenth_month_pay', 8, 2)->nullable()->default(0.00)->after('honorarium');
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            // This lets you undo the change if needed
            $table->dropColumn('thirteenth_month_pay');
        });
    }
};
