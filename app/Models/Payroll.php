<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * For College Instructor payrolls:
     * - 'base_salary' is ignored in calculations (but still stored for record-keeping)
     * - 'gross_pay' is based on (college_rate * total_hours_worked)
     * - Statutory fields (sss, philhealth, pag_ibig, withholding_tax) are pulled directly from employee record
     *
     * If you add new fields for college instructors (e.g., college_rate, total_hours_worked),
     * add them here and in the migration.
     */
    /**
     * The attributes that are mass assignable.
     *
     * 'college_rate' is used for College Instructor payrolls to store the hourly rate used in calculations.
     */
    protected $fillable = [
        'employee_id',
        'month',
        'payroll_date',
        'base_salary', // For non-instructors, used in calculations; for instructors, for record only
        'college_rate', // For college instructors, the hourly rate used
        'salary_rate', // Base hourly rate snapshot used for this payroll (non-college)
        'honorarium',
            'overtime',
        'sss',
        'philhealth',
        'pag_ibig',
        'withholding_tax',
        'tardiness',
        'undertime',
        'absences',
        'gross_pay',
        // College Instructor-specific (if needed in future):
        // 'total_hours_worked',
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
    
        protected $casts = [
            'overtime' => 'float',
            'tardiness' => 'float',
            'undertime' => 'float',
            'absences' => 'float',
            'salary_rate' => 'float',
        ];

    public function employee()
    {
        return $this->belongsTo(Employees::class);
    }

    protected static function booted(): void
    {
        static::saving(function (Payroll $payroll) {
            // Auto-compute salary_rate if not explicitly set
            if ($payroll->salary_rate === null) {
                $base = is_numeric($payroll->base_salary) ? (float) $payroll->base_salary : null;
                if ($base === null && $payroll->relationLoaded('employee')) {
                    $emp = $payroll->employee;
                    $base = $emp && is_numeric($emp->base_salary) ? (float) $emp->base_salary : null;
                }
                if ($base !== null) {
                    $rate = ($base * 12) / 288 / 8;
                    $payroll->salary_rate = round($rate, 2);
                }
            }
        });
    }
}
