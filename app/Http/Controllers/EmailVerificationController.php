<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EmailVerificationController extends Controller
{
    /**
     * Resend email verification notification
     */
    public function resend(Request $request)
    {
        try {
            if ($request->user()->hasVerifiedEmail()) {

                return response()->json(['success'=>false,'message' => 'Email already verified']);
            }

            $request->user()->sendEmailVerificationNotification();

            return response()->json(['success'=>true,'message' => 'Email verification link has been sent to your inbox!']);
        } catch (\Exception $e) {
            Log::error('Verification email resend error: ' . $e->getMessage());
            return response()->json(['error' => 'Could not send verification email'], 500);
        }
    }

    /**
     * Verify email address
     */
    // public function verify(Request $request, $id, $hash)
    // {
    //     try {
    //         $user = User::find($id);

    //         if (!$user) {
    //             return response()->json(['message' => 'User not found'], 404);
    //         }

    //         if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
    //             return response()->json(['message' => 'Invalid verification hash'], 403);
    //         }

    //         if ($user->hasVerifiedEmail()) {
    //             return response()->json(['message' => 'Email already verified']);
    //         }

    //         $user->markEmailAsVerified();

    //         event(new Verified($user));

    //         return response()->json(['message' => 'Email verified successfully']);
    //     } catch (\Exception $e) {
    //         Log::error('Email verification error: ' . $e->getMessage());
    //         return response()->json(['error' => 'Email verification failed'], 500);
    //     }
    // }
    public function verify(Request $request, $id, $hash){
            try {
                $user = User::find($id);

                if (!$user) {
                    return response(
                        $this->htmlResponse("User Not Found", "This tab will close in <span id='countdown'>10</span> seconds."),
                        404
                    );
                }

                if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
                    return response(
                        $this->htmlResponse("Invalid Verification Link", "This tab will close in <span id='countdown'>10</span> seconds."),
                        403
                    );
                }

                if ($user->hasVerifiedEmail()) {
                    return response(
                        $this->htmlResponse("Email Already Verified", "This tab will close in <span id='countdown'>10</span> seconds."),
                        200
                    );
                }

                $user->markEmailAsVerified();

                event(new Verified($user));

                return response(
                    $this->htmlResponse("Email Verified", "Thank you! Your email has been verified. This tab will close in <span id='countdown'>10</span> seconds."),
                    200
                );

            } catch (\Exception $e) {
                Log::error('Email verification error: ' . $e->getMessage());
                return response(
                    $this->htmlResponse("Verification Failed", "An error occurred. This tab will close in <span id='countdown'>10</span> seconds."),
                    500
                );
            }
        }

        private function htmlResponse($title, $message)
        {
            return <<<HTML
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>{$title}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                    text-align: center;
                    padding: 100px;
                }
                h1 {
                    color: #2c3e50;
                }
                p {
                    font-size: 18px;
                    color: #555;
                }
            </style>
            <script>
                let seconds = 10;
                function updateCountdown() {
                    const countdownEl = document.getElementById('countdown');
                    if (seconds <= 0) {
                        window.close();
                    } else {
                        countdownEl.textContent = seconds;
                        seconds--;
                        setTimeout(updateCountdown, 1000);
                    }
                }
                window.onload = updateCountdown;
            </script>
        </head>
        <body>
            <h1>{$title}</h1>
            <p>{$message}</p>
        </body>
        </html>
        HTML;
        }

}