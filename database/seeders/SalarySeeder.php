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
            'Full Time' => [50000, 200, 800, 200, 350], // last value is college_rate
            'Part Time' => [20000, 150, 400, 200, 250],
            'Provisionary' => [30000, 175, 600, 200, 275],
            'Regular' => [40000, 180, 700, 200, 300],
        ];
        foreach ($types as $type => [$base_salary, $overtime_pay, $sss, $pag_ibig, $college_rate]) {
            // PhilHealth formula
            $calculatedPhilHealth = ($base_salary * 0.05) / 2;
            $philhealth = number_format(max(250, min(2500, $calculatedPhilHealth)), 2, '.', '');

            // SSS formula (match salaryFormulas.ts)
            if ($base_salary < 5250) {
                $sss = 250.00;
            } elseif ($base_salary <= 5749.99) {
                $sss = 275.00;
            } elseif ($base_salary <= 6249.99) {
                $sss = 300.00;
            } elseif ($base_salary <= 6749.99) {
                $sss = 325.00;
            } elseif ($base_salary <= 7249.99) {
                $sss = 350.00;
            } elseif ($base_salary <= 7749.99) {
                $sss = 375.00;
            } elseif ($base_salary <= 8249.99) {
                $sss = 400.00;
            } elseif ($base_salary <= 8749.99) {
                $sss = 425.00;
            } elseif ($base_salary <= 9249.99) {
                $sss = 450.00;
            } elseif ($base_salary <= 9749.99) {
                $sss = 475.00;
            } elseif ($base_salary <= 10249.99) {
                $sss = 500.00;
            } elseif ($base_salary <= 10749.99) {
                $sss = 525.00;
            } elseif ($base_salary <= 11249.99) {
                $sss = 550.00;
            } elseif ($base_salary <= 11749.99) {
                $sss = 575.00;
            } elseif ($base_salary <= 12249.99) {
                $sss = 600.00;
            } elseif ($base_salary <= 12749.99) {
                $sss = 625.00;
            } elseif ($base_salary <= 13249.99) {
                $sss = 650.00;
            } elseif ($base_salary <= 13749.99) {
                $sss = 675.00;
            } elseif ($base_salary <= 14249.99) {
                $sss = 700.00;
            } elseif ($base_salary <= 14749.99) {
                $sss = 725.00;
            } elseif ($base_salary <= 15249.99) {
                $sss = 750.00;
            } elseif ($base_salary <= 15749.99) {
                $sss = 775.00;
            } elseif ($base_salary <= 16249.99) {
                $sss = 800.00;
            } elseif ($base_salary <= 16749.99) {
                $sss = 825.00;
            } elseif ($base_salary <= 17249.99) {
                $sss = 850.00;
            } elseif ($base_salary <= 17749.99) {
                $sss = 875.00;
            } elseif ($base_salary <= 18249.99) {
                $sss = 900.00;
            } elseif ($base_salary <= 18749.99) {
                $sss = 925.00;
            } elseif ($base_salary <= 19249.99) {
                $sss = 950.00;
            } elseif ($base_salary <= 19749.99) {
                $sss = 975.00;
            } elseif ($base_salary <= 20249.99) {
                $sss = 1025.00;
            } elseif ($base_salary <= 20749.99) {
                $sss = 1050.00;
            } elseif ($base_salary <= 21249.99) {
                $sss = 1075.00;
            } elseif ($base_salary <= 21749.99) {
                $sss = 1100.00;
            } elseif ($base_salary <= 22249.99) {
                $sss = 1125.00;
            } elseif ($base_salary <= 22749.99) {
                $sss = 1150.00;
            } elseif ($base_salary <= 23249.99) {
                $sss = 1175.00;
            } elseif ($base_salary <= 23749.99) {
                $sss = 1200.00;
            } elseif ($base_salary <= 24249.99) {
                $sss = 1225.00;
            } elseif ($base_salary <= 24749.99) {
                $sss = 1250.00;
            } elseif ($base_salary <= 25249.99) {
                $sss = 1275.00;
            } elseif ($base_salary <= 25749.99) {
                $sss = 1300.00;
            } elseif ($base_salary <= 26249.99) {
                $sss = 1325.00;
            } elseif ($base_salary <= 26749.99) {
                $sss = 1350.00;
            } elseif ($base_salary <= 27249.99) {
                $sss = 1375.00;
            } elseif ($base_salary <= 27749.99) {
                $sss = 1400.00;
            } elseif ($base_salary <= 28249.99) {
                $sss = 1425.00;
            } elseif ($base_salary <= 28749.99) {
                $sss = 1450.00;
            } elseif ($base_salary <= 29249.99) {
                $sss = 1475.00;
            } elseif ($base_salary <= 29749.99) {
                $sss = 1500.00;
            } elseif ($base_salary <= 30249.99) {
                $sss = 1525.00;
            } elseif ($base_salary <= 30749.99) {
                $sss = 1550.00;
            } elseif ($base_salary <= 31249.99) {
                $sss = 1575.00;
            } elseif ($base_salary <= 31749.99) {
                $sss = 1600.00;
            } elseif ($base_salary <= 32249.99) {
                $sss = 1625.00;
            } elseif ($base_salary <= 32749.99) {
                $sss = 1650.00;
            } elseif ($base_salary <= 33249.99) {
                $sss = 1675.00;
            } elseif ($base_salary <= 33749.99) {
                $sss = 1700.00;
            } elseif ($base_salary <= 34249.99) {
                $sss = 1725.00;
            } else {
                $sss = 1750.00;
            }
            $sss = number_format($sss, 2, '.', '');

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
                'sss'             => $sss,
                'philhealth'      => $philhealth,
                'pag_ibig'        => number_format($pag_ibig, 2, '.', ''),
                'withholding_tax' => $withholding_tax,
                'college_rate'    => number_format($college_rate, 2, '.', ''),
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
