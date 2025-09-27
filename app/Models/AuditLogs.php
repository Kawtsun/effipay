<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLogs extends Model
{
    /** @use HasFactory<\Database\Factories\AuditLogsFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'username',
        'action',
        'name',
        'entity_type',
        'entity_id',
        'details',
        'date',
    ];
}
