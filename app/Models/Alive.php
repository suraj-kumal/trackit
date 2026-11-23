<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alive extends Model
{
    public $timestamps = false;

    protected $fillable = ['timestamp'];

    protected $primaryKey = 'timestamp';

    public $incrementing = false;
}
