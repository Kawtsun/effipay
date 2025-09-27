<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::table('employees', function (Blueprint $table) {
            $table->string('work_start_time_2', 8)->nullable()->after('work_end_time');
            $table->string('work_end_time_2', 8)->nullable()->after('work_start_time_2');
        });
    }
    public function down() {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['work_start_time_2', 'work_end_time_2']);
        });
    }
};
