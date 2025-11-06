<?php

namespace Tests\Feature;

use App\Models\Employees;
use App\Models\Payroll;
use App\Models\TimeKeeping;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PayrollRerunTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_creates_then_updates_payroll_when_rerun_in_same_month()
    {
        // Create an authenticated user
        $user = User::create([
            'username' => 'tester',
            'password' => bcrypt('password'),
        ]);
        $this->actingAs($user);

        // Create an employee and a minimal timekeeping record for the month
        $employee = Employees::create([
            'employee_type' => 'Full Time',
            'employee_status' => 'Active',
            'roles' => 'administrator',
            'college_program' => null,
            'base_salary' => 20000,
            // Ensure contributions flags are truthy so values compute but we won't assert exact amounts
            'sss' => 1,
            'philhealth' => 1,
            'pag_ibig' => 100,
            'withholding_tax' => 0,
        ]);

        $month = Carbon::now()->startOfMonth()->format('Y-m');
        TimeKeeping::create([
            'employee_id' => $employee->id,
            'date' => $month . '-05',
            'clock_in' => '08:00 AM',
            'clock_out' => '05:00 PM',
        ]);

        // First run should create a payroll record
        $resp1 = $this->post(route('payroll.run'), [
            'payroll_date' => $month,
        ]);
        $resp1->assertStatus(302); // redirect back with flash

        $this->assertDatabaseHas('payrolls', [
            'employee_id' => $employee->id,
            'month' => $month,
        ]);

        $payroll1 = Payroll::where('employee_id', $employee->id)
            ->where('month', $month)
            ->orderByDesc('payroll_date')
            ->first();
        $this->assertNotNull($payroll1);
    $this->assertEquals(100.0, (float) $payroll1->pag_ibig);

    // Change an input used directly in payroll (pag_ibig) to force an update
    $employee->update(['pag_ibig' => 200]);

        // Second run on the same month should update the existing record, not create another
        $resp2 = $this->post(route('payroll.run'), [
            'payroll_date' => $month,
        ]);
        $resp2->assertStatus(302);

        // Still exactly one payroll record for this employee in the month
        $this->assertEquals(1, Payroll::where('employee_id', $employee->id)->where('month', $month)->count());

        $payroll2 = Payroll::where('employee_id', $employee->id)
            ->where('month', $month)
            ->orderByDesc('payroll_date')
            ->first();
    $this->assertNotNull($payroll2);
    $this->assertEquals(200.0, (float) $payroll2->pag_ibig);
    }
}
