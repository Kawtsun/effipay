<?php

namespace Database\Seeders;

use App\Models\Salary;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SalarySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = ['Full Time', 'Part Time', 'Provisionary'];
        foreach ($types as $type) {
            Salary::firstOrCreate(
                ['employee_type' => $type],
                ['base_salary' => 0, 'overtime_pay' => 0, 'sss' => 0, 'philhealth' => 0, 'pag_ibig' => 0, 'withholding_tax' => 0]
            );
        }
    }
}
