<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\User;
use Illuminate\Validation\Rules;

class RegisterRequest extends FormRequest
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
            "name" => ["required", "string", "max:255"],
            "email" => [
                "required",
                "string",
                "email",
                "max:255",
                "unique:" . User::class,
            ],
            "password" => ["required", "confirmed", Rules\Password::defaults()],
        ];
    }

    public function messages(): array
    {
        return [
            "name.required" => "The name field is required.",
            "name.string" => "The name must be a valid string.",
            "name.max" => "The name may not be greater than 255 characters.",

            "email.required" => "The email address is required.",
            "email.string" => "The email must be a valid string.",
            "email.email" => "Please enter a valid email address.",
            "email.max" => "The email may not be greater than 255 characters.",
            "email.unique" => "This email address is already in use.",

            "password.required" => "Please enter a password.",
            "password.confirmed" => "The password confirmation does not match.",
        ];
    }
}
