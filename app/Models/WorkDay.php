<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkDay extends Model
{
    use HasFactory;

    protected $table = 'work_days';

    protected $fillable = [
        'employee_id',
        'role',
        'day',
        'work_start_time',
        'work_end_time',
        'work_hours',
    ];

    public function employee()
    {
        return $this->belongsTo(Employees::class, 'employee_id');
    }
}
