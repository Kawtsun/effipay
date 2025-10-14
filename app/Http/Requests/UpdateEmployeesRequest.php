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
            // Accept both HH:MM and HH:MM:SS to handle edit forms seeded from DB
            'work_days.*.work_start_time' => ['required', 'string', 'regex:/^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$/'],
            'work_days.*.work_end_time' => ['required', 'string', 'regex:/^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$/'],

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
        $rules['rate_per_hour'] = [
            Rule::excludeIf($isAdmin),
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