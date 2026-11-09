<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class ResetPasswordTest extends TestCase
{
    use RefreshDatabase;

    // ==========================================
    // FORGOT PASSWORD TESTS
    // ==========================================

    public function test_user_can_request_password_reset_link(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $response = $this->postJson('/api/forgot-password', [
            'email' => $user->email,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Reset link sent to your email',
            ]);

        Notification::assertSentTo(
            $user,
            ResetPasswordNotification::class
        );
    }

    public function test_forgot_password_fails_when_account_does_not_exist(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'unknown@example.com',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Account does not exist',
            ]);

        Notification::assertNothingSent();
    }

    public function test_forgot_password_requires_email(): void
    {
        $response = $this->postJson('/api/forgot-password', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_forgot_password_requires_valid_email(): void
    {
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'invalid-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    // ==========================================
    // RESET PASSWORD TESTS
    // ==========================================

    public function test_user_can_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'OldPassword123',
        ]);

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'password reset successful',
            ]);

        $this->assertTrue(
            Hash::check('NewPassword123', $user->fresh()->password)
        );

        $this->assertFalse(
            Hash::check('OldPassword123', $user->fresh()->password)
        );
    }

    public function test_password_reset_fails_with_invalid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'OldPassword123',
        ]);

        $response = $this->postJson('/api/reset-password', [
            'token' => 'invalid-token',
            'email' => $user->email,
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'invalid or expired token',
            ]);

        $this->assertTrue(
            Hash::check('OldPassword123', $user->fresh()->password)
        );
    }

    public function test_password_reset_fails_for_nonexistent_user(): void
    {
        $response = $this->postJson('/api/reset-password', [
            'token' => 'some-token',
            'email' => 'unknown@example.com',
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'invalid or expired token',
            ]);
    }

    public function test_reset_password_requires_token(): void
    {
        $response = $this->postJson('/api/reset-password', [
            'email' => 'test@example.com',
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['token']);
    }

    public function test_reset_password_requires_email(): void
    {
        $response = $this->postJson('/api/reset-password', [
            'token' => 'some-token',
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_reset_password_requires_valid_email(): void
    {
        $response = $this->postJson('/api/reset-password', [
            'token' => 'some-token',
            'email' => 'invalid-email',
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_reset_password_requires_password_confirmation(): void
    {
        $response = $this->postJson('/api/reset-password', [
            'token' => 'some-token',
            'email' => 'test@example.com',
            'password' => 'NewPassword123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_reset_password_requires_matching_password_confirmation(): void
    {
        $response = $this->postJson('/api/reset-password', [
            'token' => 'some-token',
            'email' => 'test@example.com',
            'password' => 'NewPassword123',
            'password_confirmation' => 'DifferentPassword123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_reset_password_requires_minimum_eight_characters(): void
    {
        $response = $this->postJson('/api/reset-password', [
            'token' => 'some-token',
            'email' => 'test@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
