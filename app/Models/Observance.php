<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Observance extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'label',
        'is_automated',
    ];

    protected $casts = [
        'date' => 'date',
        'is_automated' => 'boolean',
    ];
}
