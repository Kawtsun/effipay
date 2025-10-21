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

        $without_college = $isAdmin || $isBasicEdu || $isOthers;
        
        $rules = [
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'employee_status' => 'required|string|max:255',
            'roles' => 'required|string',
            'employee_types' => 'required|array',
            'employee_types.*' => ['required', Rule::in(['Regular', 'Provisionary', 'Retired', 'Full Time', 'Part Time'])],
            'college_program' => [Rule::requiredIf($isCollege), 'nullable', 'string', 'max:255'],
            
            // Support both flat array and role-based object structure for work_days
            'work_days' => 'required|array|min:1',
            
            // Flat array validation (backward compatibility)
            'work_days.*.day' => 'sometimes|required|string',
            'work_days.*.work_start_time' => ['sometimes', 'required', 'string', 'regex:/^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$/'],
            'work_days.*.work_end_time' => ['sometimes', 'required', 'string', 'regex:/^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$/'],
            
            // Role-based object validation (new structure)
            'work_days.*' => 'sometimes|array',
            'work_days.*.*.day' => 'sometimes|required|string',
            'work_days.*.*.work_start_time' => ['sometimes', 'required', 'string', 'regex:/^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$/'],
            'work_days.*.*.work_end_time' => ['sometimes', 'required', 'string', 'regex:/^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$/'],
            
            // College-specific fields
            'college_work_hours_by_program' => 'sometimes|nullable|array',
            'college_work_hours_by_program.*' => 'sometimes|nullable|string',
            'college_work_days_by_program' => 'sometimes|nullable|array',
            
            // Your original optional fields (unchanged)
            'sss_salary_loan' => 'nullable|numeric',
            'sss_calamity_loan' => 'nullable|numeric',
            'pagibig_multi_loan' => 'nullable|numeric',
            'pagibig_calamity_loan' => 'nullable|numeric',
            'peraa_con' => 'nullable|numeric',
            'tuition' => 'nullable|numeric|min:0',
            'china_bank' => 'nullable|numeric|min:0',
            'tea' => 'nullable|numeric|min:0',
        ];

        // Your original salary/honorarium logic (unchanged)
        $requiresBaseSalary = $isAdmin || $isBasicEdu;
        if ($isOthers) {
            $rules['honorarium'] = 'required|numeric|min:0';
            $rules['base_salary'] = 'nullable|numeric|min:0';
        } else {
            $rules['honorarium'] = 'nullable|numeric|min:0';
            if ($requiresBaseSalary) {
                $rules['base_salary'] = 'required|numeric|min:0';
            } else {
                $rules['base_salary'] = 'nullable|numeric|min:0';
            }
        }
        
        // --- THE FIX IS HERE ---
        // This rule now correctly validates 'rate_per_hour' only when the college instructor role is selected.
        $rules['rate_per_hour'] = [
            Rule::excludeIf($without_college),
            Rule::requiredIf($isCollege),
            'nullable',
            'numeric',
            'min:0',
        ];
        
        // Your original contribution logic (unchanged)
        if ($isAdmin) {
            $rules['sss'] = 'required|numeric|min:0';
            $rules['philhealth'] = 'required|numeric|min:0';
            $rules['pag_ibig'] = 'required|numeric|min:200|max:2500';
        } else {
            $rules['sss'] = 'sometimes|nullable|numeric|min:0';
            $rules['philhealth'] = 'sometimes|nullable|numeric|min:0';
            $rules['pag_ibig'] = 'sometimes|nullable|numeric|min:200|max:2500';
        }

        return $rules;
    }
}