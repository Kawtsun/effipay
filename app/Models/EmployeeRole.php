<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeRole extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'last_name',
        'first_name',
        'role',
        'start_work',
        'end_work',
    ];

    public function employee()
    {
        return $this->belongsTo(Employees::class, 'employee_id');
    }
}
