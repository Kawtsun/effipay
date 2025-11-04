<?php

namespace Tests\Feature;

use App\Models\Employees;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeKeepingImportNoIdTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_imports_timekeeping_by_name_without_employee_id()
    {
        // Auth user
        $user = User::create(['username' => 'tester', 'password' => bcrypt('password')]);
        $this->actingAs($user);

        // Employee with names
        $emp = Employees::create([
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'employee_status' => 'Active',
            'roles' => 'administrator',
            'base_salary' => 10000,
        ]);

        // Prepare import payload WITHOUT personid
        $payload = [
            'records' => [
                [
                    'First Name' => 'Jane',
                    'Last Name' => 'Doe',
                    'Date' => '2025-10-05',
                    'Clock In' => '08:00 AM',
                    'Clock Out' => '05:00 PM',
                ],
            ],
            'file_name' => 'sample.csv',
        ];

        $res = $this->postJson(route('time-keeping.import'), $payload);
        $res->assertStatus(200);
        $res->assertJson(['success' => true,'imported' => 1]);

        $this->assertDatabaseHas('time_keepings', [
            'employee_id' => $emp->id,
            'date' => '2025-10-05',
        ]);
    }
}
