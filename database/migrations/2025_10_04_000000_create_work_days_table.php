<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('work_days', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->string('day', 10); // e.g. 'mon', 'tue', etc.
            $table->time('work_start_time');
            $table->time('work_end_time');
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->unique(['employee_id', 'day']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_days');
    }
};
