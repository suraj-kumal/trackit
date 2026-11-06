<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function getAllItems(Request $request)
    {
        $items = $request->user()->items()->get();
        return response()->json([
            "success" => true,
            "items" => $items,
        ], 200);
    }


    public function get(Request $request, int $id)
    {
        $item = $request->user()->items()->findOrFail($id);
        return response()->json([
            "success" => true,
            "item" => $item,
        ], 200);
    }

    public function add(Request $request)
    {
        $validated = $request->validate([
            "name" => "required|string|min:3|max:255",
        ]);
        $item = $request->user()->items()->create([
            "name" => $validated["name"],
        ]);

        return response()->json([
            "success" => true,
            "message" => "item added successfully",
            "item" => $item,
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            "name" => "required|string|min:3|max:255",
        ]);
        $item = $request->user()->items()->findOrFail($id);

        $item->update($validated);

        return response()->json([
            "success" => true,
            "message" => "updated successfully",
        ], 200);
    }

    public function del(Request $request, int $id)
    {
        $deleted = $request->user()->items()->where("id", $id)->delete();
        abort_if(!$deleted, 404, "items not found");
        return response()->json([
            "success" => true,
            "message" => "delete successfully",
        ], 200);
    }
}
