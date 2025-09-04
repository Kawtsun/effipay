<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSalaryRequest extends FormRequest
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
            'base_salary'     => 'sometimes|required|numeric|min:0',
            'overtime_pay'    => 'sometimes|required|numeric|min:0',
            'sss'             => 'sometimes|required|numeric|min:0',
            'philhealth'      => 'sometimes|required|numeric|min:250|max:2500',
            'pag_ibig'        => 'sometimes|required|numeric|min:200',
            'withholding_tax' => 'sometimes|required|numeric|min:0',
            'work_hours_per_day' => 'sometimes|required|integer|min:1|max:24',
        ];
    }
}
