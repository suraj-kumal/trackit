<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;
use App\Models\Item;
use App\Models\User;
class ItemController extends Controller
{
    public function getAllItems(Request $request){
        $userId = $request->user()->id;

        $items = Item::where('user_id', $userId)->get();

        return response()->json([
            "items" => $items
        ], 200);
    }


    public function get(Request $request, $id){
            $userId = $request->user()->id;
            
            try {
                $item = Item::where('id', $id)
                            ->where('user_id', $userId)
                            ->firstOrFail();

                return response()->json([
                    "success" => true,
                    "item" => $item
                ], 200);
        }catch (Exception $e) {
            return response()->json([
                "success" => false,
                "message" => "Item not found",
                "error" => $e->getMessage()
            ], 404);
        }
    }

    public function add(Request $request){
        $userId = $request->user()->id;

        try{
            $validated = $request->validate([
                "name" => "required|string|min:3|max:255"
            ]);

            $item = Item::create([
                "name"=>$validated["name"],
                "user_id"=>$userId
            ]);

            return response()->make(json_encode([
                "success"=>true,
                "message"=>"item added successfully",
                "item"=>$item
            ]),201);
        }
        catch(Exception $e){
            return response()->make(json_encode([
                "success"=>false,
                "error"=>$e->getMessage(),
            ]),403);
        }
        
    }
    public function update(Request $request, $id){
        $userId = $request->user()->id;

        try{
            $validated = $request->validate([
                "name"=>"required|string|min:3|max:255"
            ]);

             $item = Item::where('id', $id)
                    ->where('user_id', $userId)
                    ->firstOrFail();

            $item->update($validated);

            return response()->make(json_encode([
                "success"=>true,
                "message"=>"updated successfully"
            ]));
        }
        catch(Exception $e){
            return response()->make(json_encode([
                "success"=>false,
                "message"=>"update failed",
                "error"=>$e->getMessage()
            ]));
        }
    }
    public function del(Request $request, $id){
        $userId = $request->user()->id;
        try{
            $item = Item::where('id', $id)
                    ->where('user_id', $userId)
                    ->firstOrFail();

            $item->delete();
            return response()->make(json_encode([
                "success"=>true,
                "message"=>"delete successfully"
            ]),200);
        }
        catch(Exception $e){
            return response()->make(json_encode([
                "success"=>false,
                "message"=>"delete failed",
                "error"=>$e->getMessage()
            ]),403);
        }
    }
}


