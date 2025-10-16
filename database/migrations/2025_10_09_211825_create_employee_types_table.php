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
        Schema::create('employee_types', function (Blueprint $table) {
            $table->id();
            
            // This creates the foreign key relationship to the employees table.
            // onDelete('cascade') means if an employee is deleted, all their associated types will also be deleted.
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            
            // The role for this specific type (e.g., 'administrator', 'college instructor')
            $table->string('role');

            // The employment type for that specific role (e.g., 'Regular', 'Full Time')
            $table->string('type');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_types');
    }
};
