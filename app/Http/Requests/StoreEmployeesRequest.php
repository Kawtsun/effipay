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
        $rolesArrRaw = array_filter(array_map('trim', explode(',', request('roles', ''))));
        $rolesArr = array_map('strtolower', $rolesArrRaw);
        $employeeTypes = request('employee_types', []);

        // Case-insensitive, substring-based detection for robustness
        $isAdmin = !empty(array_filter($rolesArr, fn ($r) => str_contains($r, 'admin')));
        $isCollege = !empty(array_filter($rolesArr, fn ($r) => str_contains($r, 'college')));
        $isBasicEdu = !empty(array_filter($rolesArr, fn ($r) => str_contains($r, 'basic education')));

        // Any role that isn't admin/basic/college falls under "others"
        $isOthers = !empty(array_filter($rolesArr, fn ($r) => !str_contains($r, 'admin') && !str_contains($r, 'basic education') && !str_contains($r, 'college')));
        
        $isRetired = in_array('Retired', $employeeTypes, true);
        $contribOptional = $isCollege || $isBasicEdu || $isOthers || $isRetired;

    $without_college = $isAdmin || $isBasicEdu || $isOthers;
    $hasNonCollegeRole = $without_college; // alias for clarity
        
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
            'work_days.*.work_start_time' => ['sometimes', 'nullable', 'string', 'regex:/^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$/'],
            'work_days.*.work_end_time' => ['sometimes', 'nullable', 'string', 'regex:/^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$/'],
            
            // Role-based object validation (new structure)
            'work_days.*' => 'sometimes|array',
            'work_days.*.*.day' => 'sometimes|required|string',
            'work_days.*.*.work_start_time' => ['sometimes', 'nullable', 'string', 'regex:/^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$/'],
            'work_days.*.*.work_end_time' => ['sometimes', 'nullable', 'string', 'regex:/^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$/'],
            
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
        // Make base_salary optional only when the selected roles are "others" exclusively.
        $isOnlyOthers = $isOthers && !$isAdmin && !$isBasicEdu && !$isCollege;
        if ($isOnlyOthers) {
            $rules['honorarium'] = 'required|numeric|min:0';
            $rules['base_salary'] = 'nullable|numeric|min:0';
        } else {
            $rules['honorarium'] = $isOthers ? 'nullable|numeric|min:0' : 'nullable|numeric|min:0';
            if ($requiresBaseSalary) {
                $rules['base_salary'] = 'required|numeric|min:0';
            } else {
                $rules['base_salary'] = 'nullable|numeric|min:0';
            }
        }
        
        // --- THE FIX IS HERE ---
        // This rule now correctly validates 'rate_per_hour' only when the college instructor role is selected.
        // Include when College or Basic Education roles are present; required only for College
        $rules['rate_per_hour'] = [
            Rule::excludeIf(!$isCollege),
            Rule::requiredIf($isCollege),
            'nullable',
            'numeric',
            'min:0',
        ];

        // Accept college_rate directly so null clears can pass through when roles change.
        // Not excluded when not college: we want to allow explicit clearing on create as well.
        $rules['college_rate'] = ['nullable', 'numeric', 'min:0'];
        
        // Your original contribution logic (unchanged)
        if ($isAdmin) {
            // Admins must have SSS and PhilHealth checkboxes set (boolean true/false)
            $rules['sss'] = 'required|boolean';
            $rules['philhealth'] = 'required|boolean';
            $rules['pag_ibig'] = 'required|numeric|min:200|max:2500';
        } else {
            // For non-admins these are optional flags
            $rules['sss'] = 'sometimes|nullable|boolean';
            $rules['philhealth'] = 'sometimes|nullable|boolean';
            $rules['pag_ibig'] = 'sometimes|nullable|numeric|min:200|max:2500';
        }

        // If the employee is a college instructor, ensure any program that has
        // assigned days also has a corresponding hours value of at least 1.
        $programDays = request('college_work_days_by_program', []);
        if (is_array($programDays)) {
            foreach ($programDays as $code => $days) {
                if (is_array($days) && count($days) > 0) {
                    // Require at least 1 hour for this program when days exist
                    $rules['college_work_hours_by_program.' . $code] = ['required', 'numeric', 'min:1'];
                }
            }
        }

        return $rules;
    }
}