<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employees extends Model
{
    /** @use HasFactory<\Database\Factories\EmployeesFactory> */
    use HasFactory;

    protected $fillable = [
        'last_name',
        'first_name',
        'middle_name',
        // 'employee_type', // REMOVED - This is now handled by the employeeTypes relationship
        'employee_status',
        'roles',
        'college_program',
    'basic_edu_level',
        'base_salary',
        'college_rate',
    'salary_rate',
        'rate_per_hour',
        'sss',
        'philhealth',
        'pag_ibig',
        'withholding_tax',
        'work_hours_per_day',
        'work_start_time',
        'work_end_time',
        'sss_salary_loan',
        'sss_calamity_loan',
        'pagibig_multi_loan',
        'pagibig_calamity_loan',
        'peraa_con',
        'tuition',
        'china_bank',
        'tea',
        'honorarium',
    ];

    protected $casts = [
        'sss' => 'boolean',
        'philhealth' => 'boolean',
        'withholding_tax' => 'boolean',
        'salary_rate' => 'float',
    ];

    /**
     * Default attribute values for new models.
     */
    protected $attributes = [
        'withholding_tax' => true,
    ];

    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class);
    }

    public function workDays(): HasMany
    {
        return $this->hasMany(WorkDay::class, 'employee_id');
    }

    // Note: role-based schedules are stored in work_days with a 'role' column.
    // The previous roleWorkDays() relation has been removed.

    /**
     * Get the employee types for the employee.
     */
    public function employeeTypes(): HasMany
    {
        return $this->hasMany(EmployeeType::class, 'employee_id');
    }

    public function collegeProgramSchedules(): HasMany
    {
        return $this->hasMany(EmployeeCollegeProgramSchedule::class, 'employee_id');
    }

    protected static function booted(): void
    {
        static::saving(function (Employees $employee) {
            // Auto-compute salary_rate (base hourly rate) using formula: base_salary * 12 / 288 / 8
            // Only when base_salary is present; otherwise leave null
            $base = is_numeric($employee->base_salary) ? (float) $employee->base_salary : null;
            if ($base !== null) {
                $rate = ($base * 12) / 288 / 8;
                // Round to 2 decimals to match schema
                $employee->salary_rate = round($rate, 2);
            }
        });
    }
}

