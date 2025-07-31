<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Salary extends Model
{
    /** @use HasFactory<\Database\Factories\SalaryFactory> */
    use HasFactory;

    protected $fillable = [
        'employee_type',
        'base_salary',
        'overtime_pay',
        'sss',
        'philhealth',
        'pag_ibig',
        'withholding_tax',
        'work_hours_per_day',
    ];

    public function getRouteKeyName(): string
    {
        return 'employee_type';
    }
}
