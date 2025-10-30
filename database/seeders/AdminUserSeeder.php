<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed admin users securely using environment variables.
     * Only runs in production by default.
     *
     * Required env vars per admin:
     *  - ADMIN_USERNAME, ADMIN_PASSWORD
     *  - ADMIN2_USERNAME, ADMIN2_PASSWORD (optional second admin)
     */
    public function run(): void
    {
        // Only allow on production by default; you can override by removing this guard if desired.
        if (!app()->environment('production')) {
            $this->command?->warn('[AdminUserSeeder] Skipped: not in production environment.');
            return;
        }

        $this->seedAdmin('ADMIN_USERNAME', 'ADMIN_PASSWORD');
        $this->seedAdmin('ADMIN2_USERNAME', 'ADMIN2_PASSWORD');
    }

    /**
     * Create or update an admin user from environment variables.
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
            // In production, require password to be set explicitly.
            throw new \RuntimeException("Missing environment variable {$passwordEnv} for admin user '{$username}' in production.");
        }

        User::updateOrCreate(
            ['username' => $username],
            ['password' => Hash::make($password)]
        );

        $this->command?->info("[AdminUserSeeder] Ensured admin user '{$username}' exists.");
    }
}
