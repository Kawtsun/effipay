<?php

namespace Database\Seeders;

use App\Models\Employees;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Employees::factory(10)->create();

        User::create([
            'username' => 'admin',
            'password' => Hash::make('admin123')
        ]);

        User::create([
            'username' => 'admin2',
            'password' => Hash::make('admin000')
        ]);
    }
}
