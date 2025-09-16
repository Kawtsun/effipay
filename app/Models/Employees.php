<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employees extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeesFactory> */
    use HasFactory;

    protected $fillable = [
        'last_name',
        'first_name',
        'middle_name',
        'employee_type',
        'employee_status',
        'roles',
        'college_program',
        'base_salary',
        'sss',
        'philhealth',
        'pag_ibig',
        'withholding_tax',
        'work_hours_per_day',
        'work_start_time',
        'work_end_time',
        'salary_loan',
        'peraa_con',
        'china_bank',
        'tea',
        'calamity_loan',
        'multipurpose_loan',
    ];

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }
}
