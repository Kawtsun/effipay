<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeesRequest extends FormRequest
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
        $rolesArrRaw = array_filter(array_map('trim', explode(',', request('roles', ''))));
        $rolesArr = array_map('strtolower', $rolesArrRaw);
        $employeeTypes = request('employee_types', []);

        // Case-insensitive, substring-based detection
        $isAdmin = !empty(array_filter($rolesArr, fn ($r) => str_contains($r, 'admin')));
        $isCollege = !empty(array_filter($rolesArr, fn ($r) => str_contains($r, 'college')));
        $isBasicEdu = !empty(array_filter($rolesArr, fn ($r) => str_contains($r, 'basic education')));

        $isOthers = !empty(array_filter($rolesArr, fn ($r) => !str_contains($r, 'admin') && !str_contains($r, 'basic education') && !str_contains($r, 'college')));

        $isRetired = in_array('Retired', $employeeTypes, true);
        $contribOptional = $isCollege || $isBasicEdu || $isOthers || $isRetired;

    $without_college = $isAdmin || $isBasicEdu || $isOthers;
    $hasNonCollegeRole = $without_college;

        $rules = [
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'employee_status' => 'required|string|max:255',
            'roles' => 'required|string',
            'employee_types' => 'required|array',
            'employee_types.*' => ['required', Rule::in(['Regular', 'Provisionary', 'Retired', 'Full Time', 'Part Time'])],
            'college_program' => [Rule::requiredIf($isCollege), 'nullable', 'string', 'max:255'],
            'basic_education_level' => ['sometimes', 'nullable', 'string', 'max:255'],
            
            // Support both flat array and role-based object structure for work_days
            // Required only when there are non-college roles (admin/basic/others)
            'work_days' => [\Illuminate\Validation\Rule::requiredIf($hasNonCollegeRole), 'array'],
            
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

            // Optional fields
            'sss_salary_loan' => 'nullable|numeric',
            'sss_calamity_loan' => 'nullable|numeric',
            'pagibig_multi_loan' => 'nullable|numeric',
            'pagibig_calamity_loan' => 'nullable|numeric',
            'peraa_con' => 'nullable|numeric',
            'tuition' => 'nullable|numeric|min:0',
            'china_bank' => 'nullable|numeric|min:0',
            'tea' => 'nullable|numeric|min:0',
        ];

        // Salary/honorarium logic matching StoreEmployeesRequest
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

        // Rate per hour rule matching StoreEmployeesRequest
        // Include when College or Basic Education roles are present; required only for College
        $rules['rate_per_hour'] = [
            Rule::excludeIf(!$isCollege && !$isBasicEdu),
            Rule::requiredIf($isCollege),
            'nullable',
            'numeric',
            'min:0',
        ];

        // Contribution logic matching StoreEmployeesRequest
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