<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeCollegeProgramSchedule extends Model
{
    use HasFactory;

    protected $table = 'employee_college_program_schedules';

    protected $fillable = [
        'employee_id',
        'program_code',
        'day',
        'hours_per_day',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employees::class, 'employee_id');
    }
}
