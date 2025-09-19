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
            $table->decimal('sss_salary_loan', 12, 2)->nullable()->after('withholding_tax');
            $table->decimal('sss_calamity_loan', 12, 2)->nullable()->after('sss_salary_loan');
            $table->decimal('pagibig_multi_loan', 12, 2)->nullable()->after('sss_calamity_loan');
            $table->decimal('pagibig_calamity_loan', 12, 2)->nullable()->after('pagibig_multi_loan');
            $table->decimal('peraa_con', 12, 2)->nullable()->after('pagibig_calamity_loan');
            $table->decimal('tuition', 12, 2)->nullable()->after('peraa_con');
            $table->decimal('china_bank', 12, 2)->nullable()->after('tuition');
            $table->decimal('tea', 12, 2)->nullable()->after('china_bank');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('sss_salary_loan');
            $table->dropColumn('sss_calamity_loan');
            $table->dropColumn('pagibig_multi_loan');
            $table->dropColumn('pagibig_calamity_loan');
            $table->dropColumn('peraa_con');
            $table->dropColumn('tuition');
            $table->dropColumn('china_bank');
            $table->dropColumn('tea');
        });
    }
};
