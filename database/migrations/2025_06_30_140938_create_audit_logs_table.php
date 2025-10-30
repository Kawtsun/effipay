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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('username'); // current login user
            $table->string('action');   // action performed (create, update, delete)
            $table->string('name');     // name of the affected entity (e.g. employee name)
            $table->string('entity_type'); // type of entity (e.g. Employee)
            $table->unsignedBigInteger('entity_id')->nullable(); // id of affected entity
            $table->text('details')->nullable(); // additional details
            $table->timestamp('date'); // date of action
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
