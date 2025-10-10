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
        $isCollege = in_array('college instructor', $rolesArr);

        return [
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            
            'employee_status' => 'required|string|max:255',
            'roles' => 'required|string',
            
            'employee_types' => 'required|array',
            'employee_types.*' => ['required', Rule::in(['Regular', 'Provisionary', 'Retired', 'Full Time', 'Part Time'])],

            // --- TEMPORARILY RELAXED RULES ---
            // These fields will be made required again once the Earnings form section is built.
            'base_salary' => 'nullable|numeric|min:0',
            'rate_per_hour' => 'nullable|numeric|min:0', 

            'sss' => 'nullable|numeric',
            'philhealth' => 'nullable|numeric',
            'pag_ibig' => 'nullable|numeric',
            'withholding_tax' => 'nullable|numeric',

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