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
        $rolesArr = array_filter(array_map('trim', explode(',', request('roles', ''))));
        $employeeTypes = request('employee_types', []);

        $isAdmin = in_array('administrator', $rolesArr);
        $isCollege = in_array('college instructor', $rolesArr);
        $isBasicEdu = in_array('basic education instructor', $rolesArr);
        
        $isOthers = false;
        foreach ($rolesArr as $role) {
            if (!in_array($role, ['administrator', 'college instructor', 'basic education instructor'])) {
                $isOthers = true;
                break;
            }
        }
        
        // --- RE-ENABLING STRICT VALIDATION ---
        $isRetired = in_array('Retired', $employeeTypes, true);
        $contribOptional = $isCollege || $isBasicEdu || $isOthers || $isRetired;
        $requiresBaseSalary = $isAdmin || $isBasicEdu;
        $requiresRatePerHour = $isCollege;

        return [
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            
            'employee_status' => 'required|string|max:255',
            'roles' => 'required|string',
            
            'employee_types' => 'required|array',
            'employee_types.*' => ['required', Rule::in(['Regular', 'Provisionary', 'Retired', 'Full Time', 'Part Time'])],

            // --- RESTORED STRICT RULES ---
            'base_salary' => $requiresBaseSalary ? 'required_without:honorarium|nullable|numeric|min:0' : 'nullable|numeric|min:0',
            'rate_per_hour' => $requiresRatePerHour ? 'required|numeric|min:0' : 'nullable|numeric|min:0', 

            'sss' => $contribOptional ? 'nullable|numeric' : 'required|numeric|min:0',
            'philhealth' => $contribOptional ? 'nullable|numeric' : 'required|numeric|min:0',
            'pag_ibig' => $contribOptional ? 'nullable|numeric' : 'required|numeric|min:0',
            'withholding_tax' => $contribOptional ? 'nullable|numeric' : 'required|numeric|min:0',

            'college_program' => [
                Rule::requiredIf($isCollege),
                'nullable',
                'string',
                'max:255',
            ],
            
            'work_hours_per_day' => 'nullable|integer|min:1|max:24',
            'work_start_time' => 'nullable|date_format:H:i',
            'work_end_time' => 'nullable|date_format:H:i',
            'work_days' => 'nullable|array',
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