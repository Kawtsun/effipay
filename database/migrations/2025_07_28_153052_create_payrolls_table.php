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
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->string('month'); // Format: YYYY-MM
            $table->date('payroll_date'); // Specific payroll date (15th or 30th)
            $table->integer('base_salary');
            $table->integer('overtime_pay');
            $table->integer('sss');
            $table->integer('philhealth');
            $table->integer('pag_ibig');
            $table->integer('withholding_tax');
            $table->integer('tardiness');
            $table->integer('undertime');
            $table->integer('absences',);
            $table->integer('gross_pay');
            $table->integer('total_deductions');
            $table->integer('net_pay');
            $table->timestamps();
            
            // Ensure unique payroll per employee per date
            $table->unique(['employee_id', 'payroll_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
