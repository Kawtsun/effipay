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
            'base_salary'     => 'sometimes|required|integer|min:0',
            'overtime_pay'    => 'sometimes|required|integer|min:0',
            'sss'             => 'sometimes|required|integer|min:0',
            'philhealth'      => 'sometimes|required|integer|min:0',
            'pag_ibig'        => 'sometimes|required|integer|min:0',
            'withholding_tax' => 'sometimes|required|integer|min:0',
        ];
    }
}
