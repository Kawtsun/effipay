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
        return [
            'employee_name' => 'required|string|max:255',
            'employee_type' => 'required|string|max:255',
            'employee_status' => 'required|string|max:255',
            'base_salary' => 'required|integer|min:0',
            'overtime_pay' => 'required|integer|min:0',
            'sss' => 'required|integer|min:0',
            'philhealth' => 'required|integer|min:250|max:2500',
            'pag_ibig' => 'required|integer|min:200',
            'withholding_tax' => 'required|integer|min:0',
            'roles' => [
                'required',
                'string',
                function($attribute, $value, $fail) {
                    $rolesArr = array_filter(array_map('trim', explode(',', $value)));
                    $instructors = array_intersect($rolesArr, ['college instructor', 'basic education instructor']);
                    if (count($instructors) > 1) {
                        $fail('Only one instructor type can be selected.');
                    }
                    if (count($instructors) === 0 && !in_array('administrator', $rolesArr)) {
                        $fail('At least one role must be selected.');
                    }
                    $allowed = ['college instructor', 'basic education instructor', 'administrator'];
                    foreach ($rolesArr as $role) {
                        if (!in_array($role, $allowed)) {
                            $fail('Invalid role: ' . $role);
                        }
                    }
                }
            ],
            'college_program' => [
                Rule::requiredIf(function() {
                    $roles = $this->get('roles', '');
                    return strpos($roles, 'college instructor') !== false;
                }),
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }
}
