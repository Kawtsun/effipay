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
            $table->decimal('base_salary', 12, 2)->change();
            $table->decimal('overtime_pay', 12, 2)->change();
            $table->decimal('sss', 12, 2)->change();
            $table->decimal('philhealth', 12, 2)->change();
            $table->decimal('pag_ibig', 12, 2)->change();
            $table->decimal('withholding_tax', 12, 2)->change();
        });
        Schema::table('salaries', function (Blueprint $table) {
            $table->decimal('base_salary', 12, 2)->change();
            $table->decimal('overtime_pay', 12, 2)->change();
            $table->decimal('sss', 12, 2)->change();
            $table->decimal('philhealth', 12, 2)->change();
            $table->decimal('pag_ibig', 12, 2)->change();
            $table->decimal('withholding_tax', 12, 2)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->integer('base_salary')->change();
            $table->integer('overtime_pay')->change();
            $table->integer('sss')->change();
            $table->integer('philhealth')->change();
            $table->integer('pag_ibig')->change();
            $table->integer('withholding_tax')->change();
        });
        Schema::table('salaries', function (Blueprint $table) {
            $table->integer('base_salary')->change();
            $table->integer('overtime_pay')->change();
            $table->integer('sss')->change();
            $table->integer('philhealth')->change();
            $table->integer('pag_ibig')->change();
            $table->integer('withholding_tax')->change();
        });
    }
};
