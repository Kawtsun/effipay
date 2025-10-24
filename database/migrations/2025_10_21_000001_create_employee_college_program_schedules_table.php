<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_college_program_schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->string('program_code', 64);
            $table->string('day', 16); // e.g., Monday, Tue, mon
            $table->decimal('hours_per_day', 5, 2)->default(0);
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            // Use a short index name to avoid MySQL's 64-char identifier limit
            $table->index(['employee_id', 'program_code'], 'ecps_emp_prog_idx');
            $table->unique(['employee_id', 'program_code', 'day'], 'uniq_emp_prog_day');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_college_program_schedules');
    }
};
