<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'month',
        'payroll_date',
        'base_salary',
        'overtime_pay',
        'sss',
        'philhealth',
        'pag_ibig',
        'withholding_tax',
        'tardiness',
        'undertime',
        'absences',
        'gross_pay',
        'total_deductions',
        'net_pay',
    ];

    public function employee()
    {
        return $this->belongsTo(Employees::class);
    }
}
