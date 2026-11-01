<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
            "email" => [
                "required",
                "string",
                "email",
                "max:255",
            ],
            "password" => ["required"],
        ];
    }

    public function messages()
    {
        return [
            "email.required" => "The email address is required.",
            "email.string" => "The email must be a valid string.",
            "email.email" => "Please enter a valid email address.",
            "email.max" => "The email may not be greater than 255 characters.",

            "password.required" => "password is required",

        ];
    }
}
