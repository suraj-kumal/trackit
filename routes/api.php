<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmailVerificationController;

use App\Http\Controllers\ItemController;

use App\Http\Controllers\Transactioncontroller;
use Illuminate\Support\Facades\Password;
use App\Models\User;

// Authentication Routes
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('user', [AuthController::class, 'user']);
    Route::post('logout', [AuthController::class, 'logout']);
});

// Email Verification Routes
Route::middleware('auth:sanctum')->post('email/verification-notification', [EmailVerificationController::class, 'resend']);
Route::get('email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->name('verification.verify');

Route::post('/forgot-password', function(Request $request) {
    $request->validate(['email' => 'required|email']);

    $userExists = User::where('email', $request->email)->exists();

    if (! $userExists) {
        return response()->json(['message' => 'Account does not exist'], 404);
    }

    $status = Password::sendResetLink(
        $request->only('email')
    );

    return $status === Password::RESET_LINK_SENT
        ? response()->json(['message' => 'Reset link sent to your email'])
        : response()->json(['message' => 'Unable to send reset link'], 500);
});

Route::post('/reset-password', function(Request $request) {
    $request->validate([
        'token' => 'required',
        'email' => 'required|email',
        'password' => 'required|confirmed|min:8',
    ]);

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function ($user, $password) {
            $user->forceFill([
                'password' => Hash::make($password)
            ])->save();
        }
    );

    if ($status == Password::PASSWORD_RESET) {
        return response()->make(json_encode([
            "message"=>"password reset successful"
        ]));
    } else {
        return response()->make(json_encode([
            "message"=>"invalid or expired token"
        ]));
    }
})->name("password.reset");



Route::middleware('auth:sanctum')->group(function () {
    Route::get("/item", [ItemController::class, 'getAllItems']);
    Route::get("/item/{id}",[ItemController::class, 'get']);
    Route::post("/item", [ItemController::class, 'add']);
    Route::put("/item/{id}", [ItemController::class, "update"]);
    Route::delete("/item/{id}",[ItemController::class, "del"]);
});


Route::middleware("auth:sanctum")->group(function(){
    Route::get("/transaction",[Transactioncontroller::class, "getAllTransaction"]);
    Route::get("/transaction/{id}",[Transactioncontroller::class,"get"]);
    Route::post("/transaction",[Transactioncontroller::class,"add"]);
    Route::put("/transaction/{id}",[Transactioncontroller::class,"update"]);
});


