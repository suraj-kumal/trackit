<?php

namespace Database\Factories;

use App\Models\Item;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Transaction>
 */
class TransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'item_id'          => Item::factory(),
            'total_buy'        => fake()->numberBetween(10, 100),
            'total_sell'       => fake()->numberBetween(0, 10),
            'cost_price'       => fake()->randomFloat(2, 1, 100),
            'selling_price'    => fake()->randomFloat(2, 1, 150),
            'transaction_date' => fake()->date(),
        ];
    }
}
