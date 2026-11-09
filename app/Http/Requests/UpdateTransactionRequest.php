<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTransactionRequest extends FormRequest
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
            "total_buy" => "integer",
            "total_sell" => "integer",
            "cost_price" => "numeric",
            "selling_price" => "numeric",
            "transaction_date" => "date",
        ];
    }
    public function messages(): array
    {
        return [
            'total_buy.integer' => 'Total buy must be a valid integer.',
            'total_sell.integer' => 'Total sell must be a valid integer.',
            'cost_price.numeric' => 'Cost price must be a valid number.',
            'selling_price.numeric' => 'Selling price must be a valid number.',
            'transaction_date.date' => 'Transaction date must be a valid date.',
        ];
    }
}
