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
        //////// All Types
        // $types = ['Full Time', 'Part Time', 'Provisionary'];
        // foreach ($types as $type) {
        //     Salary::firstOrCreate(
        //         ['employee_type' => $type],
        //         ['base_salary' => 0, 'overtime_pay' => 0, 'sss' => 0, 'philhealth' => 0, 'pag_ibig' => 0, 'withholding_tax' => 0]
        //     );
        // }

        /// Each Types
        $defaults = [
            'Full Time' => [
                'base_salary'     => 50000,
                'overtime_pay'    => 200,    // per hour
                'sss'             => 800,
                'philhealth'      => max(250, min(2500, (50000 * 0.05) / 4)), // 625
                'pag_ibig'        => 200,
                'withholding_tax' => 5000,
                'work_hours_per_day' => 8,
            ],
            'Part Time' => [
                'base_salary'     => 20000,
                'overtime_pay'    => 150,
                'sss'             => 400,
                'philhealth'      => max(250, min(2500, (20000 * 0.05) / 4)), // 250
                'pag_ibig'        => 200,
                'withholding_tax' => 1500,
                'work_hours_per_day' => 6,
            ],
            'Provisionary' => [
                'base_salary'     => 30000,
                'overtime_pay'    => 175,
                'sss'             => 600,
                'philhealth'      => max(250, min(2500, (30000 * 0.05) / 4)), // 375
                'pag_ibig'        => 200,
                'withholding_tax' => 3000,
                'work_hours_per_day' => 8,
            ],
            'Regular' => [
                'base_salary'     => 40000,
                'overtime_pay'    => 180,
                'sss'             => 700,
                'philhealth'      => max(250, min(2500, (40000 * 0.05) / 4)), // 500
                'pag_ibig'        => 200,
                'withholding_tax' => 4000,
                'work_hours_per_day' => 8,
            ],
        ];

        // 2) Loop and upsert each type
        foreach ($defaults as $type => $values) {
            Salary::updateOrCreate(
                ['employee_type' => $type],
                $values
            );
        }
    }
}
