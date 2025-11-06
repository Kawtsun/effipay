<?php

namespace App\Support;

class SalaryFormulas
{
    /**
     * Calculate SSS contribution (employee share) based on base salary using bracket table.
     * Mirrors the frontend TypeScript calculateSSS implementation.
     */
    public static function calculateSSS(float $baseSalary): float
    {
        $brackets = [
            ['min' => 0, 'max' => 5249.99, 'value' => 250.0],
            ['min' => 5250, 'max' => 5749.99, 'value' => 275.0],
            ['min' => 5750, 'max' => 6249.99, 'value' => 300.0],
            ['min' => 6250, 'max' => 6749.99, 'value' => 325.0],
            ['min' => 6750, 'max' => 7249.99, 'value' => 350.0],
            ['min' => 7250, 'max' => 7749.99, 'value' => 375.0],
            ['min' => 7750, 'max' => 8249.99, 'value' => 400.0],
            ['min' => 8250, 'max' => 8749.99, 'value' => 425.0],
            ['min' => 8750, 'max' => 9249.99, 'value' => 450.0],
            ['min' => 9250, 'max' => 9749.99, 'value' => 475.0],
            ['min' => 9750, 'max' => 10249.99, 'value' => 500.0],
            ['min' => 10250, 'max' => 10749.99, 'value' => 525.0],
            ['min' => 10750, 'max' => 11249.99, 'value' => 550.0],
            ['min' => 11250, 'max' => 11749.99, 'value' => 575.0],
            ['min' => 11750, 'max' => 12249.99, 'value' => 600.0],
            ['min' => 12250, 'max' => 12749.99, 'value' => 625.0],
            ['min' => 12750, 'max' => 13249.99, 'value' => 650.0],
            ['min' => 13250, 'max' => 13749.99, 'value' => 675.0],
            ['min' => 13750, 'max' => 14249.99, 'value' => 700.0],
            ['min' => 14250, 'max' => 14749.99, 'value' => 725.0],
            ['min' => 14750, 'max' => 15249.99, 'value' => 750.0],
            ['min' => 15250, 'max' => 15749.99, 'value' => 775.0],
            ['min' => 15750, 'max' => 16249.99, 'value' => 800.0],
            ['min' => 16250, 'max' => 16749.99, 'value' => 825.0],
            ['min' => 16750, 'max' => 17249.99, 'value' => 850.0],
            ['min' => 17250, 'max' => 17749.99, 'value' => 875.0],
            ['min' => 17750, 'max' => 18249.99, 'value' => 900.0],
            ['min' => 18250, 'max' => 18749.99, 'value' => 925.0],
            ['min' => 18750, 'max' => 19249.99, 'value' => 950.0],
            ['min' => 19250, 'max' => 19749.99, 'value' => 975.0],
            ['min' => 19750, 'max' => 20249.99, 'value' => 1000.0],
            ['min' => 20250, 'max' => 20749.99, 'value' => 1025.0],
            ['min' => 20750, 'max' => 21249.99, 'value' => 1050.0],
            ['min' => 21250, 'max' => 21749.99, 'value' => 1075.0],
            ['min' => 21750, 'max' => 22249.99, 'value' => 1100.0],
            ['min' => 22250, 'max' => 22749.99, 'value' => 1125.0],
            ['min' => 22750, 'max' => 23249.99, 'value' => 1150.0],
            ['min' => 23250, 'max' => 23749.99, 'value' => 1175.0],
            ['min' => 23750, 'max' => 24249.99, 'value' => 1200.0],
            ['min' => 24250, 'max' => 24749.99, 'value' => 1225.0],
            ['min' => 24750, 'max' => 25249.99, 'value' => 1250.0],
            ['min' => 25250, 'max' => 25749.99, 'value' => 1275.0],
            ['min' => 25750, 'max' => 26249.99, 'value' => 1300.0],
            ['min' => 26250, 'max' => 26749.99, 'value' => 1325.0],
            ['min' => 26750, 'max' => 27249.99, 'value' => 1350.0],
            ['min' => 27250, 'max' => 27749.99, 'value' => 1375.0],
            ['min' => 27750, 'max' => 28249.99, 'value' => 1400.0],
            ['min' => 28250, 'max' => 28749.99, 'value' => 1425.0],
            ['min' => 28750, 'max' => 29249.99, 'value' => 1450.0],
            ['min' => 29250, 'max' => 29749.99, 'value' => 1475.0],
            ['min' => 29750, 'max' => 30249.99, 'value' => 1500.0],
            ['min' => 30250, 'max' => 30749.99, 'value' => 1525.0],
            ['min' => 30750, 'max' => 31249.99, 'value' => 1550.0],
            ['min' => 31250, 'max' => 31749.99, 'value' => 1575.0],
            ['min' => 31750, 'max' => 32249.99, 'value' => 1600.0],
            ['min' => 32250, 'max' => 32749.99, 'value' => 1625.0],
            ['min' => 32750, 'max' => 33249.99, 'value' => 1650.0],
            ['min' => 33250, 'max' => 33749.99, 'value' => 1675.0],
            ['min' => 33750, 'max' => 34249.99, 'value' => 1700.0],
            ['min' => 34250, 'max' => 34749.99, 'value' => 1725.0],
            ['min' => 34750, 'max' => INF, 'value' => 1750.0],
        ];

        foreach ($brackets as $b) {
            if ($baseSalary >= $b['min'] && $baseSalary <= $b['max']) {
                return round((float)$b['value'], 2);
            }
        }
        return round(1750.0, 2);
    }

    /**
     * Calculate PhilHealth contribution (employee share) based on base salary.
     * Mirrors the frontend TypeScript calculatePhilHealth implementation.
     */
    public static function calculatePhilHealth(float $baseSalary): float
    {
        $val = ($baseSalary * 0.05) / 2.0; // 5% total; employee share is half
        $val = max(250.0, min(2500.0, $val));
        return round($val, 2);
    }
}
