<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ensure all existing employees have withholding_tax = 1
        DB::table('employees')->update(['withholding_tax' => 1]);

        // Change the column default to true (tinyint(1) with default 1 on MySQL)
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'withholding_tax')) {
                $table->boolean('withholding_tax')->default(true)->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'withholding_tax')) {
                // Revert default to false to match previous migration
                $table->boolean('withholding_tax')->default(false)->change();
            }
        });
    }
};
