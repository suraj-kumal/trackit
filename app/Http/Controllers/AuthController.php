<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use App\Http\Requests\RegisterRequest;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(RegisterRequest $request)
    {
        try {
            $user = User::create([
                "name" => $request->name,
                "email" => $request->email,
                // "password" => Hash::make($request->password),
                // do not need hash since its already casted in models
                "password" => $request->password,
            ]);

            try {
                $user->sendEmailVerificationNotification();
            } catch (\Exception $mailException) {
                Log::error(
                    "Email verification failed: "
                        . $mailException->getMessage(),
                );
            }

            $token = $user->createToken("api-token")->plainTextToken;

            return response()->json(
                [
                    "success" => true,
                    "user" => $user,
                    "token" => $token,
                ],
                201,
            );
        } catch (\Exception $e) {
            Log::error("Register error: " . $e->getMessage());

            return response()->json(
                [
                    "success" => false,
                    "message" => "Registration failed",
                ],
                500,
            );
        }
    }

    /**
     * Login user
     */
    public function login(LoginRequest $request)
    {
        try {
            $user = User::where("email", $request->email)->first();

            if (!$user) {
                throw ValidationException::withMessages([
                    "message" => ["User not found"],
                ]);
            }

            if (!Hash::check($request->password, $user->password)) {
                throw ValidationException::withMessages([
                    "message" => ["Incorrect credentials"],
                ]);
            }

            $token = $user->createToken("api-token")->plainTextToken;

            return response()->json([
                "success" => true,
                "user" => $user,
                "token" => $token,
            ]);
        } catch (ValidationException $ve) {
            return response()->json(
                ["success" => false, "errors" => $ve->errors()],
                422,
            );
        } catch (\Exception $e) {
            Log::error("Login error: " . $e->getMessage());
            return response()->json(
                ["success" => false, "error" => "Login failed"],
                500,
            );
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->tokens()->delete();

            return response()->json(["message" => "Logged out successfully"]);
        } catch (\Exception $e) {
            Log::error("Logout error: " . $e->getMessage());
            return response()->json(["error" => "Logout failed"], 500);
        }
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}
