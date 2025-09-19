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
        'honorarium',
        'overtime_pay',
        'sss',
        'philhealth',
        'pag_ibig',
        'withholding_tax',
        'tardiness',
        'undertime',
        'absences',
        'gross_pay',
        'sss_salary_loan',
        'sss_calamity_loan',
        'pagibig_multi_loan',
        'pagibig_calamity_loan',
        'peraa_con',
        'tuition',
        'china_bank',
        'tea',
        'salary_loan',
        'calamity_loan',
        'multipurpose_loan',
        'total_deductions',
        'net_pay',
    ];

    public function employee()
    {
        return $this->belongsTo(Employees::class);
    }
}
