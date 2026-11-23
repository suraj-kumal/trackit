<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alive extends Model
{
    protected $table = 'alive';

    public $timestamps = false;

    protected $fillable = ['timestamp'];

    protected $primaryKey = 'timestamp';

    public $incrementing = false;

    protected $keyType = 'string';
}
