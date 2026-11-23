<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Alive;

class AliveController extends Controller
{
    public function store()
    {
        Alive::create([
            'timestamp' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alive timestamp recorded',
        ], 201);
    }
}
