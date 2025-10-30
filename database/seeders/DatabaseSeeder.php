<?php

namespace Database\Seeders;

use App\Models\Employees;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Note: Admin user seeding has been moved to a dedicated seeder
        // (AdminUserSeeder) so it can be invoked explicitly in production.
        // To seed admin users, run:
        //   php artisan db:seed --class=Database\\Seeders\\AdminUserSeeder

        $this->call([
            AdminUserSeeder::class,
            EmployeesSeeder::class,
            // SalarySeeder::class,
            // TimeKeepingsSeeder::class,
            // PayrollSeeder::class,
        ]);
    }
}
