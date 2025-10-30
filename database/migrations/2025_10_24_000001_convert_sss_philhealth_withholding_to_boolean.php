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
        // NOTE: Changing column types may require the doctrine/dbal package.
        // If you see an error running this migration, install it with:
        // composer require doctrine/dbal
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'sss')) {
                $table->boolean('sss')->default(false)->change();
            }
            if (Schema::hasColumn('employees', 'philhealth')) {
                $table->boolean('philhealth')->default(false)->change();
            }
            if (Schema::hasColumn('employees', 'withholding_tax')) {
                $table->boolean('withholding_tax')->default(false)->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'sss')) {
                $table->decimal('sss', 10, 2)->nullable()->change();
            }
            if (Schema::hasColumn('employees', 'philhealth')) {
                $table->decimal('philhealth', 10, 2)->nullable()->change();
            }
            if (Schema::hasColumn('employees', 'withholding_tax')) {
                $table->decimal('withholding_tax', 10, 2)->nullable()->change();
            }
        });
    }
};
