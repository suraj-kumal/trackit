<?php

use Illuminate\Support\Facades\Route;

// In routes/web.php
Route::any("/login", function () {
    return response()->json(["message" => "unauthenticated"], 401);
})->name("login");
