<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Employees;

class AddEmployeeStatusHistory extends Command
{
    protected $signature = 'employee:add-status-history {employee_id} {status} {date}';
    protected $description = 'Add a status history record for an employee (for testing)';

    public function handle()
    {
        $employeeId = $this->argument('employee_id');
        $status = $this->argument('status');
        $date = $this->argument('date');

        $employee = Employees::find($employeeId);
        if (!$employee) {
            $this->error('Employee not found.');
            return 1;
        }

        DB::table('employee_status_histories')->insert([
            'employee_id' => $employeeId,
            'status' => $status,
            'effective_date' => $date,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->info("Status history added for employee #$employeeId: $status on $date");
        return 0;
    }
}
