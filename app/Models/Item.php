<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    //

    protected $fillable = [
        "name",
        "user_id"
    ];

    public function user(){
      return $this->belongsTo(User::class);
    }   

    public function transaction(){
        return $this->hasMany(Transaction::class);
    }
}
