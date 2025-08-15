<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    //

    protected $fillable = [
        "item_id",
        "total_buy",
        "total_sell",
        "cost_price",
        "selling_price",
        "transaction_date"
    ];
    public function item(){
        return $this->belongsTo(Item::class);
    }
}
