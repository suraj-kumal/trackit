<?php

use Illuminate\Support\Facades\Route;
use function GuzzleHttp\json_encode;

// In routes/web.php
Route::any('/login', function () {
    return response()->json(['message' => 'unauthenticated'], 401);
})->name('login');

