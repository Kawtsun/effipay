<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employees extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeesFactory> */
    use HasFactory;

    protected $fillable = [
        'employee_name',
        'surname',
        'first_name',
        'middle_name',
        'employee_type',
        'employee_status',
        'roles',
        'college_program',
        'base_salary',
        'overtime_pay',
        'sss',
        'philhealth',
        'pag_ibig',
        'withholding_tax',
        'work_hours_per_day',
        'work_start_time',
        'work_end_time',
    ];

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }
}
