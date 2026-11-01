<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginApiTest extends TestCase
{
    use RefreshDatabase;

    /*
    |--------------------------------------------------------------------------
    | Successful Login
    |--------------------------------------------------------------------------
    */

    public function test_user_can_login()
    {
        $user = User::factory()->create([
            'email' => 'john@test.com',
            'password' => Hash::make('Password123!'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@test.com',
            'password' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'user' => [
                    'email' => 'john@test.com',
                ],
            ])
            ->assertJsonStructure([
                'success',
                'user',
                'token',
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Required Field Validation
    |--------------------------------------------------------------------------
    */

    public function test_email_is_required()
    {
        $response = $this->postJson('/api/login', [
            'password' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_password_is_required()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'john@test.com',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_required_fields()
    {
        $response = $this->postJson('/api/login', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
                'password',
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Email Validation
    |--------------------------------------------------------------------------
    */

    public function test_email_must_be_valid()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'invalid-email',
            'password' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_email_maximum_length()
    {
        $response = $this->postJson('/api/login', [
            'email' => str_repeat('a', 250) . '@test.com',
            'password' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    /*
    |--------------------------------------------------------------------------
    | Authentication Failure
    |--------------------------------------------------------------------------
    */

    public function test_user_cannot_login_with_unregistered_email()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'unknown@test.com',
            'password' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJson([
                'success' => false,
                'errors' => [
                    'message' => ['User not found'],
                ],
            ]);
    }

    public function test_user_cannot_login_with_incorrect_password()
    {
        User::factory()->create([
            'email' => 'john@test.com',
            'password' => Hash::make('Password123!'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@test.com',
            'password' => 'WrongPassword123!',
        ]);

        $response->assertUnprocessable()
            ->assertJson([
                'success' => false,
                'errors' => [
                    'message' => ['Incorrect credentials'],
                ],
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | API Token
    |--------------------------------------------------------------------------
    */

    public function test_login_returns_api_token()
    {
        User::factory()->create([
            'email' => 'john@test.com',
            'password' => Hash::make('Password123!'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@test.com',
            'password' => 'Password123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'token',
            ]);

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

}
