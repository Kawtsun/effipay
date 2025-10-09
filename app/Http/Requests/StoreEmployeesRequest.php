<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmployeesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $roles = request('roles', '');
        $rolesArr = is_array($roles)
            ? array_filter(array_map('trim', $roles))
            : array_filter(array_map('trim', explode(',', $roles)));

        $isAdmin = in_array('administrator', $rolesArr);
        $isCollege = in_array('college instructor', $rolesArr);
        $isBasicEdu = in_array('basic education instructor', $rolesArr);
        
        // Detect any custom role (others) by checking if any role is not admin, college, or basic edu
        $isOthers = false;
        foreach ($rolesArr as $role) {
            if ($role !== '' && $role !== 'administrator' && $role !== 'college instructor' && $role !== 'basic education instructor') {
                $isOthers = true;
                break;
            }
        }
        
        $employeeType = request('employee_type', '');
        // Contributions are optional if ANY of these roles are present OR employee_type is Retired
        $contribOptional = ($isCollege || $isBasicEdu || $isOthers || strtolower($employeeType) === 'retired');

        // Logic for Base Salary requirement: Required if Admin or Basic Edu is present, 
        // AND not if Others is the SOLE COMPENSATION method.
        $requiresBaseSalary = $isAdmin || $isBasicEdu;

        // Logic for Rate Per Hour requirement: Required only if College Instructor is present.
        $requiresRatePerHour = $isCollege;

        // Base Salary Rule: Required for salaried roles, but must be nullable for the 'Others' scenario.
        $baseSalaryRule = [
            'nullable',
            'numeric',
            'min:0',
        ];
        if ($requiresBaseSalary && !$isOthers) {
            $baseSalaryRule[] = 'required';
        }

        return [
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'employee_type' => 'required|string|max:255',
            'employee_status' => 'required|string|max:255',
            
            'base_salary' => $baseSalaryRule, 
            
            // FIXED: Rate Per Hour is required if College Instructor, otherwise nullable (for optional Basic Edu rate).
            'rate_per_hour' => $requiresRatePerHour ? 'required|numeric|min:0' : 'nullable|numeric|min:0', 

            'sss' => $contribOptional ? 'nullable|numeric' : 'required|numeric|min:0',
            'philhealth' => $contribOptional ? 'nullable' : 'required|numeric|min:250|max:2500',
            'pag_ibig' => $contribOptional ? 'nullable|numeric' : 'required|numeric|min:200',
            'withholding_tax' => $contribOptional ? 'nullable|numeric' : 'required|numeric|min:0',
            'work_hours_per_day' => 'required|integer|min:1|max:24',
            'work_start_time' => 'required|date_format:H:i',
            'work_end_time' => 'required|date_format:H:i|after:work_start_time',
            'roles' => [
                'required',
                'string',
                function($attribute, $value, $fail) use ($rolesArr) {
                    if (count($rolesArr) === 0 || ($rolesArr[0] === '')) {
                        $fail('At least one role must be selected.');
                    }
                    foreach ($rolesArr as $role) {
                        if ($role === '') {
                            $fail('Role cannot be empty.');
                        }
                    }
                }
            ],
            'college_program' => [
                Rule::requiredIf(function() use ($rolesArr) {
                    return in_array('college instructor', $rolesArr);
                }),
                'nullable',
                'string',
                'max:255',
            ],
            'sss_salary_loan' => 'nullable|numeric|min:0',
            'sss_calamity_loan' => 'nullable|numeric|min:0',
            'pagibig_multi_loan' => 'nullable|numeric|min:0',
            'pagibig_calamity_loan' => 'nullable|numeric|min:0',
            'peraa_con' => 'nullable|numeric|min:0',
            'tuition' => 'nullable|numeric|min:0',
            'china_bank' => 'nullable|numeric|min:0',
            'tea' => 'nullable|numeric|min:0',
            'honorarium' => 'nullable|numeric|min:0',
        ];
    }
}