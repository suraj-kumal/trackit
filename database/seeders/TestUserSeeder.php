<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'user@wherestock.com'],
            [
                'name' => 'User',
                'password' => 'Password123',
                'email_verified_at' => now(),
            ]
        );
    }
}
