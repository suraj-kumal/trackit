<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;
use App\Models\User;
use App\Notifications\QueuedVerifyEmail;

class RegisterApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();
    }

    /*
    |--------------------------------------------------------------------------
    | Successful Registration
    |--------------------------------------------------------------------------
    */

    public function test_user_can_register()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@test.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated()
            ->assertJson([
                'success' => true,
                'user' => [
                    'name' => 'John Doe',
                    'email' => 'john@test.com',
                ],
            ])
            ->assertJsonStructure([
                'success',
                'user',
                'token',
            ]);

        $this->assertDatabaseHas('users', [
            'name' => 'John Doe',
            'email' => 'john@test.com',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Required Field Validation
    |--------------------------------------------------------------------------
    */

    public function test_required_fields()
    {
        $response = $this->postJson('/api/register', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'email',
                'password',
            ]);

        $this->assertDatabaseCount('users', 0);
    }

    /*
    |--------------------------------------------------------------------------
    | Name Validation
    |--------------------------------------------------------------------------
    */

    public function test_name_must_be_string()
    {
        $response = $this->postJson('/api/register', [
            'name' => ['John', 'Doe'],
            'email' => 'john@test.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_name_maximum_length()
    {
        $response = $this->postJson('/api/register', [
            'name' => str_repeat('A', 256),
            'email' => 'john@test.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    /*
    |--------------------------------------------------------------------------
    | Email Validation
    |--------------------------------------------------------------------------
    */

    public function test_email_must_be_valid()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'invalid-email',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_email_must_be_unique()
    {
        User::factory()->create([
            'email' => 'john@test.com',
        ]);

        $response = $this->postJson('/api/register', [
            'name' => 'Another John',
            'email' => 'john@test.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseCount('users', 1);
    }

    public function test_email_maximum_length()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => str_repeat('a', 250) . '@test.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    /*
    |--------------------------------------------------------------------------
    | Password Validation
    |--------------------------------------------------------------------------
    */

    public function test_password_confirmation_should_match()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@test.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Different123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_password_must_follow_default_policy()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@test.com',
            'password' => '123',
            'password_confirmation' => '123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    /*
    |--------------------------------------------------------------------------
    | Password Security
    |--------------------------------------------------------------------------
    */

    public function test_password_is_hashed()
    {
        $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@test.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $user = User::where('email', 'john@test.com')->firstOrFail();

        $this->assertNotEquals(
            'Password123!',
            $user->password
        );

        $this->assertTrue(
            password_verify('Password123!', $user->password)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | API Token
    |--------------------------------------------------------------------------
    */

    public function test_registration_returns_api_token()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@test.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'token',
            ]);

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    /*
    |--------------------------------------------------------------------------
    | Email Verification Notification
    |--------------------------------------------------------------------------
    */

    public function test_email_notification()
    {
        $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@test.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $user = User::where('email', 'john@test.com')->firstOrFail();

        Notification::assertSentTo(
            $user,
            QueuedVerifyEmail::class
        );
    }
}
