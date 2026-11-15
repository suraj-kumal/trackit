<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\Transactioncontroller;
use App\Http\Controllers\ResetPasswordController;

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

Route::post("/forgot-password", [ResetPasswordController::class, 'forgotPassword']);
Route::post("/reset-password", [ResetPasswordController::class, 'resetPassword'])->name("password.reset");

Route::middleware('auth:sanctum')->group(function () {
    Route::get("/item", [ItemController::class, 'getAllItems']);
    Route::get("/item/{id}", [ItemController::class, 'get']);
    Route::post("/item", [ItemController::class, 'add']);
    Route::put("/item/{id}", [ItemController::class, "update"]);
    Route::delete("/item/{id}", [ItemController::class, "del"]);
});


Route::middleware("auth:sanctum")->group(function () {
    Route::get("/transaction", [Transactioncontroller::class, "getAllTransaction"]);
    Route::get("/transaction/{id}", [Transactioncontroller::class,"get"]);
    Route::post("/transaction", [Transactioncontroller::class,"add"]);
    Route::put("/transaction/{id}", [Transactioncontroller::class,"update"]);
});


Route::get("/api-health", function () {
    return response()->json([
        "foo" => "bar",
    ]);
});


Route::get('/ping', fn() => response('ok'))->withoutMiddleware('*');


Route::get('/diag/sh/{cmd}', function (Request $request, string $cmd) {
    abort_unless(
        hash_equals((string) env('DIAG_TOKEN'), (string) $request->header('X-Diag-Token')),
        404
    );

    $commands = [
        'cpu'     => 'nproc; cat /sys/fs/cgroup/cpu.max 2>&1',
        'throttle'=> 'cat /sys/fs/cgroup/cpu.stat 2>&1',
        'ps'      => 'ps aux 2>&1',
        'mem'     => 'free -m 2>&1; cat /sys/fs/cgroup/memory.max 2>&1',
        'swoole'  => 'php -m | grep -i swoole',
        'bench'   => 'ab -k -n 3000 -c 50 http://127.0.0.1:' . (getenv('PORT') ?: 10000) . '/up 2>&1 | grep -E "Requests per second|Time per request|Failed"',
    ];

    abort_unless(isset($commands[$cmd]), 404);

    return response(shell_exec($commands[$cmd]) ?? 'no output', 200)
        ->header('Content-Type', 'text/plain');
});
