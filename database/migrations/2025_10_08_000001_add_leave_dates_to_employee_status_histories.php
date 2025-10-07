<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::table('employee_status_histories', function (Blueprint $table) {
            $table->date('leave_start_date')->nullable()->after('effective_date');
            $table->date('leave_end_date')->nullable()->after('leave_start_date');
        });
    }
    public function down() {
        Schema::table('employee_status_histories', function (Blueprint $table) {
            $table->dropColumn(['leave_start_date', 'leave_end_date']);
        });
    }
};
