<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\QueuedVerifyEmail;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    // ==========================================
    // RESEND EMAIL VERIFICATION TESTS
    // ==========================================

    public function test_unverified_user_can_resend_verification_email(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/email/verification-notification');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Email verification link has been sent to your inbox!',
            ]);

        Notification::assertSentTo(
            $user,
            QueuedVerifyEmail::class
        );
    }

    public function test_verified_user_cannot_resend_verification_email(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/email/verification-notification');

        $response->assertStatus(200)
            ->assertJson([
                'success' => false,
                'message' => 'Email already verified',
            ]);

        Notification::assertNothingSent();
    }

    public function test_guest_cannot_resend_verification_email(): void
    {
        Notification::fake();

        $response = $this->postJson(
            '/api/email/verification-notification'
        );

        $response->assertUnauthorized();

        Notification::assertNothingSent();
    }

    // ==========================================
    // VERIFY EMAIL TESTS
    // ==========================================

    public function test_user_can_verify_email_with_valid_hash(): void
    {
        Event::fake();

        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $hash = sha1($user->getEmailForVerification());

        $response = $this->get(
            "/api/email/verify/{$user->id}/{$hash}"
        );

        $response->assertStatus(200)
            ->assertSee('Email Verified');

        $this->assertNotNull(
            $user->fresh()->email_verified_at
        );

        Event::assertDispatched(
            Verified::class,
            function ($event) use ($user) {
                return $event->user->id === $user->id;
            }
        );
    }

    public function test_verification_fails_when_user_does_not_exist(): void
    {
        $response = $this->get(
            '/api/email/verify/999999/invalidhash'
        );

        $response->assertStatus(404)
            ->assertSee('User Not Found');
    }

    public function test_verification_fails_with_invalid_hash(): void
    {
        Event::fake();

        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $response = $this->get(
            "/api/email/verify/{$user->id}/wronghash"
        );

        $response->assertStatus(403)
            ->assertSee('Invalid Verification Link');

        $this->assertNull(
            $user->fresh()->email_verified_at
        );

        Event::assertNotDispatched(Verified::class);
    }

    public function test_already_verified_user_receives_already_verified_message(): void
    {
        Event::fake();

        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $hash = sha1($user->getEmailForVerification());

        $response = $this->get(
            "/api/email/verify/{$user->id}/{$hash}"
        );

        $response->assertStatus(200)
            ->assertSee('Email Already Verified');

        Event::assertNotDispatched(Verified::class);
    }

    public function test_invalid_hash_does_not_update_email_verified_at(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $hash = sha1('another@example.com');

        $this->get(
            "/api/email/verify/{$user->id}/{$hash}"
        )->assertStatus(403);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email_verified_at' => null,
        ]);
    }

    // ==========================================
    // HTML RESPONSE TESTS
    // ==========================================

    public function test_successful_verification_returns_html_response(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $hash = sha1($user->getEmailForVerification());

        $response = $this->get(
            "/api/email/verify/{$user->id}/{$hash}"
        );

        $response->assertStatus(200);

        $response->assertSee('<!DOCTYPE html>', false)
            ->assertSee('<title>Email Verified</title>', false)
            ->assertSee('Thank you!');
    }

    public function test_verification_response_contains_countdown_script(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => null,
        ]);

        $hash = sha1($user->getEmailForVerification());

        $response = $this->get(
            "/api/email/verify/{$user->id}/{$hash}"
        );

        $response->assertStatus(200)
            ->assertSee('let seconds = 10;', false)
            ->assertSee('function updateCountdown()', false)
            ->assertSee('window.close()', false);
    }
}
