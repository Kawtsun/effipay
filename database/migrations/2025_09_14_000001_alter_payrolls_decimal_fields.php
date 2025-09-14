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
        Schema::table('payrolls', function (Blueprint $table) {
            $table->decimal('tardiness', 12, 2)->default(0)->change();
            $table->decimal('undertime', 12, 2)->default(0)->change();
            $table->decimal('absences', 12, 2)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->integer('tardiness')->default(0)->change();
            $table->integer('undertime')->default(0)->change();
            $table->integer('absences')->default(0)->change();
        });
    }
};
