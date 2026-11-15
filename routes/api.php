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


Route::get('/diag', function () {
    return response()->json([
        'debug'        => config('app.debug'),
        'env'          => app()->environment(),
        'config_cached'=> app()->configurationIsCached(),
        'routes_cached'=> app()->routesAreCached(),
        'log_channel'  => config('logging.default'),
        'log_level'    => config('logging.channels.'.config('logging.default').'.level'),
        'cache_store'  => config('cache.default'),
        'session'      => config('session.driver'),
        'octane'       => app()->bound(\Laravel\Octane\Contracts\Client::class) ? 'yes' : 'no',
        'workers'      => env('OCTANE_WORKERS', 'not-set'),
    ]);
});
