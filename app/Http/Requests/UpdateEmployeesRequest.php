<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
        return [
            'employee_name' => 'required|string|max:255',
            'employee_type' => 'required|string|max:255',
            'employee_status' => 'required|string|max:255',
            'base_salary' => 'required|integer|min:0',
            'overtime_pay' => 'required|integer|min:0',
            'sss' => 'required|integer|min:0',
            'philhealth' => 'required|integer|min:0',
            'pag_ibig' => 'required|integer|min:0',
            'withholding_tax' => 'required|integer|min:0',
            'employee_category' => 'required|string|in:Teaching,Non-Teaching',
            'roles' => 'nullable|string',
        ];
    }
}
