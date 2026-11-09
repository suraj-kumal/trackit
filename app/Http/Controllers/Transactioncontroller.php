<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use Illuminate\Http\Request;
use App\Models\Item;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use App\Services\TransactionAnalyticsService;

class Transactioncontroller extends Controller
{
    public function getAllTransaction(
        Request $request,
        TransactionAnalyticsService $analytics
    ): JsonResponse {
        $userId = $request->user()->id;
        $transaction = Transaction::whereIn(
            'item_id',
            Item::where('user_id', $userId)->select('id')
        )->get();

        return response()->json(
            array_merge(
                ['success' => true, 'transaction' => $transaction],
                $analytics->analyze($transaction)
            ),
            200
        );
    }

    public function add(CreateTransactionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $item = Item::where('user_id', $request->user()->id)
        ->findOrFail($data['item_id']);
        $transaction = $item->transactions()->create($data);
        return response()->json([
            "success" => true,
            "message" => "added successfully",
            "transaction" => $transaction,
        ], 201);
    }


    public function get(Request $request, int $id): JsonResponse
    {
        $transaction = Transaction::whereHas(
            'item',
            fn($query) => $query->where('user_id', $request->user()->id)
        )->findOrFail($id);
        return response()->json([
            "success" => true,
            "transaction" => $transaction,
        ], 201);
    }


    public function update(UpdateTransactionRequest $request, int $id): JsonResponse
    {
        $transaction = Transaction::whereHas(
            'item',
            fn($query) => $query->where('user_id', $request->user()->id)
        )->findOrFail($id);
        $transaction->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Transaction updated successfully',
            'transaction' => $transaction->fresh(),
        ]);
    }
}
