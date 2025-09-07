<?php

namespace Database\Seeders;

use App\Models\Salary;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SalarySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //////// All Types
        // $types = ['Full Time', 'Part Time', 'Provisionary'];
        // foreach ($types as $type) {
        //     Salary::firstOrCreate(
        //         ['employee_type' => $type],
        //         ['base_salary' => 0, 'overtime_pay' => 0, 'sss' => 0, 'philhealth' => 0, 'pag_ibig' => 0, 'withholding_tax' => 0]
        //     );
        // }

        /// Each Types
        // --- Payroll formulas: see resources/js/utils/salaryFormulas.ts ---
        $defaults = [];
        $types = [
            'Full Time' => [50000, 200, 800, 200],
            'Part Time' => [20000, 150, 400, 200],
            'Provisionary' => [30000, 175, 600, 200],
            'Regular' => [40000, 180, 700, 200],
        ];
        foreach ($types as $type => [$base_salary, $overtime_pay, $sss, $pag_ibig]) {
            // PhilHealth formula
            $calculatedPhilHealth = ($base_salary * 0.05) / 2;
            $philhealth = number_format(max(250, min(2500, $calculatedPhilHealth)), 2, '.', '');

            // Withholding tax formula
            $total_compensation = $base_salary - ($sss + $pag_ibig + $philhealth);
            if ($total_compensation <= 20832) {
                $withholding_tax = number_format(0, 2, '.', '');
            } elseif ($total_compensation >= 20833 && $total_compensation <= 33332) {
                $withholding_tax = number_format(($total_compensation - 20833) * 0.15, 2, '.', '');
            } elseif ($total_compensation >= 33333 && $total_compensation <= 66666) {
                $withholding_tax = number_format(($total_compensation - 33333) * 0.20 + 1875, 2, '.', '');
            } elseif ($total_compensation >= 66667 && $total_compensation <= 166666) {
                $withholding_tax = number_format(($total_compensation - 66667) * 0.25 + 8541.80, 2, '.', '');
            } elseif ($total_compensation >= 166667 && $total_compensation <= 666666) {
                $withholding_tax = number_format(($total_compensation - 166667) * 0.30 + 33541.80, 2, '.', '');
            } elseif ($total_compensation >= 666667) {
                $withholding_tax = number_format(($total_compensation - 666667) * 0.35 + 183541.80, 2, '.', '');
            } else {
                $withholding_tax = number_format(0, 2, '.', '');
            }

            $defaults[$type] = [
                'base_salary'     => number_format($base_salary, 2, '.', ''),
                'overtime_pay'    => number_format($overtime_pay, 2, '.', ''),
                'sss'             => number_format($sss, 2, '.', ''),
                'philhealth'      => $philhealth,
                'pag_ibig'        => number_format($pag_ibig, 2, '.', ''),
                'withholding_tax' => $withholding_tax,
            ];
        }

        // 2) Loop and upsert each type
        foreach ($defaults as $type => $values) {
            Salary::updateOrCreate(
                ['employee_type' => $type],
                $values
            );
        }
    }
}
