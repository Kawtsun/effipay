<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Employees>
 */
class EmployeesFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'employee_name' => fake()->name(),
            'employee_type' => fake()->randomElement(['Full Time', 'Part Time', 'Provisionary']),
            'employee_status' => fake()->randomElement(['Active', 'Paid Leave','Maternity Leave']),

            'base_salary' => fake()->numberBetween(10000, 999999),
            'overtime_pay' => fake()->numberBetween(2000, 5000),
            'sss' => fake()->numberBetween(1000, 5000),
            'philhealth' => fake()->numberBetween(250, 2500),
            'pag_ibig' => fake()->numberBetween(1000, 5000),
            'withholding_tax' => fake()->numberBetween(5000, 10000)
        ];
    }
}
                