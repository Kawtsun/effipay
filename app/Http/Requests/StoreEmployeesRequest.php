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
        
        $isRetired = in_array('Retired', $employeeTypes, true);
        $contribOptional = $isCollege || $isBasicEdu || $isOthers || $isRetired;
        $requiresRatePerHour = $isCollege;
        
        $rules = [
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'employee_status' => 'required|string|max:255',
            'roles' => 'required|string',
            'employee_types' => 'required|array',
            'employee_types.*' => ['required', Rule::in(['Regular', 'Provisionary', 'Retired', 'Full Time', 'Part Time'])],
            'college_program' => [Rule::requiredIf($isCollege), 'nullable', 'string', 'max:255'],
            'work_days' => 'required|array|min:1',
            'work_days.*.day' => 'required|string',
            'work_days.*.work_start_time' => 'required|date_format:H:i',
            'work_days.*.work_end_time' => 'required|date_format:H:i',
            
            // Optional fields that don't depend on roles
            'sss_salary_loan' => 'nullable|numeric|min:0',
            'sss_calamity_loan' => 'nullable|numeric|min:0',
            'pagibig_multi_loan' => 'nullable|numeric|min:0',
            'pagibig_calamity_loan' => 'nullable|numeric|min:0',
            'peraa_con' => 'nullable|numeric|min:0',
            'tuition' => 'nullable|numeric|min:0',
            'china_bank' => 'nullable|numeric|min:0',
            'tea' => 'nullable|numeric|min:0',
        ];

        // --- FINAL CORRECTED VALIDATION LOGIC ---
        $requiresBaseSalary = $isAdmin || $isBasicEdu;
        
        if ($isOthers) {
            // If 'Others' role is present, Honorarium is required. Base Salary is optional.
            $rules['honorarium'] = 'required|numeric|min:0';
            $rules['base_salary'] = 'nullable|numeric|min:0';
        } else {
            // Otherwise, honorarium is optional.
            $rules['honorarium'] = 'nullable|numeric|min:0';

            // And base_salary is strictly required for Admin or Basic Edu roles.
            if ($requiresBaseSalary) {
                $rules['base_salary'] = 'required|numeric|min:0';
            } else {
                $rules['base_salary'] = 'nullable|numeric|min:0';
            }
        }
        
        // Conditionally add rules for rate per hour
        $rules['college_rate'] = $requiresRatePerHour ? 'required|numeric|min:0' : 'nullable|numeric|min:0';
        
        // Conditionally add rules for contributions
        $rules['sss'] = $contribOptional ? 'nullable|numeric|min:0' : 'required|numeric|min:0';
        $rules['philhealth'] = $contribOptional ? 'nullable|numeric|min:0' : 'required|numeric|min:0';
        $rules['pag_ibig'] = $contribOptional ? 'nullable|numeric|min:0' : 'required|numeric|min:0';
        $rules['withholding_tax'] = $contribOptional ? 'nullable|numeric|min:0' : 'required|numeric|min:0';

        return $rules;
    }
}