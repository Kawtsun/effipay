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
            $table->decimal('base_salary', 12, 2)->nullable()->change();
            $table->decimal('sss', 12, 2)->nullable()->change();
            $table->decimal('pag_ibig', 12, 2)->nullable()->change();
            $table->decimal('philhealth', 12, 2)->nullable()->change();
            $table->decimal('withholding_tax', 12, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->decimal('base_salary', 12, 2)->nullable(false)->change();
            $table->decimal('sss', 12, 2)->nullable(false)->change();
            $table->decimal('pag_ibig', 12, 2)->nullable(false)->change();
            $table->decimal('philhealth', 12, 2)->nullable(false)->change();
            $table->decimal('withholding_tax', 12, 2)->nullable(false)->change();
        });
    }
};
