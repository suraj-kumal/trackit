<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            "item_id" => ["required", "integer"],
            "total_buy" => ["required", "integer"],
            "total_sell" => ["required", "integer"],
            "cost_price" => ["required", "numeric"],
            "selling_price" => ["required", "numeric"],
            "transaction_date" => ["required", "date"],
        ];
    }
    public function messages(): array
    {
        return [
            "item_id.required" => "Please select an item.",
            "item_id.integer" => "The item ID must be a valid integer.",

            "total_buy.required" => "Please enter the total buy quantity.",
            "total_buy.integer" => "The total buy quantity must be an integer.",

            "total_sell.required" => "Please enter the total sell quantity.",
            "total_sell.integer" => "The total sell quantity must be an integer.",

            "cost_price.required" => "Please enter the cost price.",
            "cost_price.numeric" => "The cost price must be a valid number.",

            "selling_price.required" => "Please enter the selling price.",
            "selling_price.numeric" => "The selling price must be a valid number.",

            "transaction_date.required" => "Please select a transaction date.",
            "transaction_date.date" => "Please enter a valid transaction date.",
        ];
    }
}
