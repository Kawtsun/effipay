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
        Schema::create('leaves', function (Blueprint $table) {
            $table->id(); // Primary key for the leave record
            
            // Columns needed for the query:
            $table->unsignedBigInteger('employee_id')->index(); // Employee who took the leave
            $table->string('status'); // Employee Leave status or tpye
            $table->date('leave_start_day'); // The first day of the leave
            $table->date('leave_end_day')->nullable();   // The last day of the leave

            // Optional: Foreign key constraint (highly recommended)
            // Assuming you have an 'employees' table
            // $table->foreign('employee_id')->references('id')->on('employees'); 

            $table->timestamps(); // Created at, updated at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaves');
    }
};
