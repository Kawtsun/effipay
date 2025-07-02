<?php

namespace Database\Seeders;

use App\Models\Employees;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmployeesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employeeNames = [
            'Rice Shower',
            'Tokai Teoi',
            'Gold Ship',
            'Oguri Cap',
            'Agnes Tachyon',
            'Nice Nature',
            'Matikanetannhauser',
            'Special Week',
            'Mejiro McQueen',
            'Kitasan Black',
            'Satano Diamond',
            'Tamamo Cross',
            'Silent Suzuka',
            'El Condor Pasa',
            'Manhattan Cafe'
        ];

        foreach ($employeeNames as $name) {
            Employees::create([
                'employee_name' => $name,
                'employee_type' => fake()->randomElement(['Full Time', 'Part Time', 'Provisionary']),
                'employee_status' => fake()->randomElement(['Active', 'Paid Leave','Maternity Leave']),
                'base_salary' => fake()->numberBetween(10000, 999999),
                'overtime_pay' => fake()->numberBetween(2000, 5000),
                'sss' => fake()->numberBetween(1000, 5000),
                'philhealth' => fake()->numberBetween(1000, 5000),
                'pag_ibig' => fake()->numberBetween(1000, 5000),
                'withholding_tax' => fake()->numberBetween(5000, 10000)
            ]);
        }
    }
}
