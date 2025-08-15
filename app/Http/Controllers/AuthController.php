<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        try {
            $request->validate([
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'string', 'email', 'max:255', 'unique:' . User::class],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ], [
                'name.required' => 'The name field is required.',
                'name.string' => 'The name must be a valid string.',
                'name.max' => 'The name may not be greater than 255 characters.',

                'email.required' => 'The email address is required.',
                'email.string' => 'The email must be a valid string.',
                'email.email' => 'Please enter a valid email address.',
                'email.max' => 'The email may not be greater than 255 characters.',
                'email.unique' => 'This email address is already in use.',

                'password.required' => 'Please enter a password.',
                'password.confirmed' => 'The password confirmation does not match.',
            ]);

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
            ]);

            $user->sendEmailVerificationNotification();

            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'success'=>true,
                'user' => $user,
                'token' => $token,
            ], 201);

        } catch (ValidationException $ve) {
            return response()->json([
                "success"=>false,
                'errors' => $ve->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Register error: ' . $e->getMessage());
            return response()->json(["success"=>false,
            'error' => 'Registration failed'], 500);
        }
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            $user = User::where('email', $request->email)->first();

            if(!$user){
                throw ValidationException::withMessages([
                    'message' => ['User not found'],
                ]);
            }

            if (!Hash::check($request->password, $user->password)) {
                throw ValidationException::withMessages([
                    'message' => ['Incorrect credentials'],
                ]);
            }

            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'success'=>true,
                'user' => $user,
                'token' => $token,
            ]);

        } catch (ValidationException $ve) {
            return response()->json(['success'=>false,'errors' => $ve->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
            return response()->json(['success'=>false,'error' => 'Login failed'], 500);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->tokens()->delete();

            return response()->json(['message' => 'Logged out successfully']);
        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return response()->json(['error' => 'Logout failed'], 500);
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