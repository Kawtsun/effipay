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
        Schema::dropIfExists('payrolls');
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->string('month'); // Format: YYYY-MM
            $table->date('payroll_date'); // Specific payroll date (15th or 30th)
            $table->decimal('base_salary', 12, 2)->nullable();
            $table->decimal('honorarium', 12, 2)->nullable();
            $table->decimal('overtime_pay', 12, 2)->nullable();
            $table->decimal('sss', 12, 2)->nullable();
            $table->decimal('philhealth', 12, 2)->nullable();
            $table->decimal('pag_ibig', 12, 2)->nullable();
            $table->decimal('withholding_tax', 12, 2)->nullable();
            $table->decimal('tardiness', 12, 2)->nullable();
            $table->decimal('undertime', 12, 2)->nullable();
            $table->decimal('absences', 12, 2)->nullable();
            $table->decimal('gross_pay', 12, 2)->nullable();
            $table->decimal('sss_salary_loan', 12, 2)->nullable();
            $table->decimal('sss_calamity_loan', 12, 2)->nullable();
            $table->decimal('pagibig_multi_loan', 12, 2)->nullable();
            $table->decimal('pagibig_calamity_loan', 12, 2)->nullable();
            $table->decimal('peraa_con', 12, 2)->nullable();
            $table->decimal('tuition', 12, 2)->nullable();
            $table->decimal('china_bank', 12, 2)->nullable();
            $table->decimal('tea', 12, 2)->nullable();
            $table->decimal('salary_loan', 12, 2)->nullable();
            $table->decimal('calamity_loan', 12, 2)->nullable();
            $table->decimal('multipurpose_loan', 12, 2)->nullable();
            $table->decimal('total_deductions', 12, 2)->nullable();
            $table->decimal('net_pay', 12, 2)->nullable();
            $table->timestamps();
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
