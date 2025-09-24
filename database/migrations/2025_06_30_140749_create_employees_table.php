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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_type');
            $table->string('employee_status');
            $table->string('roles')->nullable();
            $table->string('college_program')->nullable();
            $table->integer('base_salary')->nullable();
            $table->integer('sss')->nullable();
            $table->integer('philhealth')->nullable();
            $table->integer('pag_ibig')->nullable();
            $table->integer('withholding_tax')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    Schema::dropIfExists('employees');
    }
};
