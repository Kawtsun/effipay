<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeType extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'employee_types';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'employee_id',
        'role',
        'type',
    ];

    /**
     * Get the employee that this type belongs to.
     */
    public function employee(): BelongsTo
    {
        // Assumes your main employee model is named 'Employee'
        return $this->belongsTo(Employees::class, 'employee_id');
    }
}
