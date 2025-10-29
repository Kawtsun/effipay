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

        // Seed admin users securely using environment variables.
        // Configure these in your .env file (never commit them):
        // ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN2_USERNAME, ADMIN2_PASSWORD
        $this->seedAdmin('ADMIN_USERNAME', 'ADMIN_PASSWORD');
        $this->seedAdmin('ADMIN2_USERNAME', 'ADMIN2_PASSWORD');

        $this->call([
            EmployeesSeeder::class,
            // SalarySeeder::class,
            // TimeKeepingsSeeder::class,
            // PayrollSeeder::class,
        ]);
    }

    /**
     * Create or update an admin user from environment variables.
     * If password is missing in non-production, a strong random password is generated and printed once.
     * In production, seeding will fail if the password is missing to avoid insecure defaults.
     */
    protected function seedAdmin(string $usernameEnv, string $passwordEnv): void
    {
        $username = env($usernameEnv);
        $password = env($passwordEnv);

        // If neither username nor password is provided, skip silently.
        if (empty($username) && empty($password)) {
            return;
        }

        // Default to "admin" if only password provided.
        if (empty($username)) {
            $username = 'admin';
        }

        if (empty($password)) {
            if (app()->environment('production')) {
                throw new \RuntimeException("Missing environment variable {$passwordEnv} for admin user '{$username}' in production.");
            }

            // Generate a strong random password for local/dev and print it once to the console.
            $password = Str::random(32);
            if (isset($this->command)) {
                $this->command->warn("[seeder] Generated random password for '{$username}': {$password}");
            }
        }

        User::updateOrCreate(
            ['username' => $username],
            ['password' => Hash::make($password)]
        );
    }
}
