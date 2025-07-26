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
        $baseSalary = fake()->numberBetween(10000, 999999);
        $calculatedPhilHealth = ($baseSalary * 0.05) / 4;
        $philhealth = max(250, min(2500, $calculatedPhilHealth));
        
        return [
            'employee_name' => fake()->name(),
            'employee_type' => fake()->randomElement(['Full Time', 'Part Time', 'Provisionary']),
            'employee_status' => fake()->randomElement(['Active', 'Paid Leave','Maternity Leave']),

            'base_salary' => $baseSalary,
            'overtime_pay' => fake()->numberBetween(2000, 5000),
            'sss' => fake()->numberBetween(1000, 5000),
            'philhealth' => $philhealth,
            'pag_ibig' => fake()->numberBetween(200, 5000),
            'withholding_tax' => fake()->numberBetween(5000, 10000)
        ];
    }
}
                