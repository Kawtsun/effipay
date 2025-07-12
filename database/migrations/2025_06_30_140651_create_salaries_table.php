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
        Schema::create('salaries', function (Blueprint $table) {
            $table->id();
            $table->string('employee_type')->unique();
            $table->integer('base_salary')->default(0);
            $table->integer('overtime_pay')->default(0);
            $table->integer('sss')->default(0);
            $table->integer('philhealth')->default(0);
            $table->integer('pag_ibig')->default(0);
            $table->integer('withholding_tax')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salaries');
    }
};
