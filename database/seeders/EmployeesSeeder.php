<?php

namespace Database\Seeders;

use App\Models\Employees;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmployeesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employeeNames = [
            'Rice Shower',
            'Tokai Teoi',
            'Gold Ship',
            'Oguri Cap',
            'Agnes Tachyon',
            'Nice Nature',
            'Matikanetannhauser',
            'Special Week',
            'Mejiro McQueen',
            'Kitasan Black',
            'Satano Diamond',
            'Tamamo Cross',
            'Silent Suzuka',
            'El Condor Pasa',
            'Manhattan Cafe',
            'Mihono Bourbon',
            'TM Opera O',
            'Maruzensky',
            'Symboli Rudolf',
            'Grass Wonder',
            'Haru Urara',
            'Air Groove',
            'Sakura Bakushin O',
            'Narita Top Road',
            'Jungle Pocket',
            'Satono Crown',
            'Sakura Chiyono O',
            'Narita Taishin',
            'Seiun Sky',
            'Eishin Flash',
            'Fine Motion',
            'Gold City',
            'Hitori Gotou',
            'Nijika Ijichi',
            'Ryou Yamada',
            'Ikuyo Kita',
            'Seika Ijichi',
            'Kikuri Hiroi',
            'Rin Hoshizora',
            'Kotori Minami',
            'Hanayo Koizumi',
            'Nico Yazawa',
            'Maki Nishikino',
            'Umi Sonoda',
            'Nozomi Toujou',
            'Honoka Kousaka',
            'Eli Ayase',
            'Chika Takami',
            'Riko Sakurauchi',
            'Kanan Matsuura',
            'Dia Kurosawa',
            'You Watanabe',
            'Yoshiko Tsushima',
            'Hanamaru Kunikida',
            'Mari Ohara',
            'Ruby Kurosawa',
            'Karin Asaka',
            'Setsuna Yuki',
            'Kasumi Nakasu',
            'Shizuku Ousaka',
            'Ai Miyashita',
            'Rina Tennouji',
            'Kanata Konoe',
            'Emma Verde',
            'Ayumu Uehara',
            'Yuu Takasaki',
            'Kanon Shibuya',
            'Keke Tang',
            'Chisato Arashi',
            'Sumire Heanna',
            'Ren Hazuki',
            'Natsumi Onitsuka',
            'Kinako Sakurakouji',
            'Mei Yoneme',
            'Shiki Wakana',
            'Aoba Suzukaze',
            'Kou Yagami',
            'Rin Toyama',
            'Hifumi Takimoto',
            'Hajime Shinoda',
            'Yun Iijima',
            'Nene Sakura',
            'Umiko Ahagon',
            'Shizuku Hazuki',
            'Madoka Kaname',
            'Homura Akemi',
            'Mami Tomoe',
            'Sayaka Miki',
            'Kyouko Sakura',
            'Yui Hirasawa',
            'Mio Akiyama',
            'Ritsu Tainaka',
            'Tsumugi Kotobuki',
            'Azusa Nakano',
            'Nadeshiko Kagamihara',
            'Aoi Inuyama',
            'Chiaki Oogaki',
            'Ena Saitou',
            'Rin Shima'
        ];

        $employeeNames2 = [
            'Francisco Morpheus Joshua Sumiquiab',
            'Dizon Isaac Rossdale Manzano',
            'Tañega Nicolle Daban',
            'Vilaga Arwin Paul Bausista'
        ];

        // Create a matching ID for each name in $employeeNames
        $employeeIds = [];
        foreach ($employeeNames2 as $index => $name) {
            $employeeIds[] = $index + 1; // IDs start from 1
        }

        $shuffled = collect($employeeNames2)->shuffle();
        $employeeTypesTeaching = ['Full Time', 'Part Time', 'Provisionary'];
        $employeeTypesAdmin = ['Regular', 'Provisionary'];
        $collegePrograms = [
            'BSBA', 'BSA', 'COELA', 'BSCRIM', 'BSCS', 'JD', 'BSN', 'RLE', 'CG', 'BSPT', 'GSP', 'MBA'
        ];

        //foreach ($shuffled as $name)
        foreach ($employeeNames2 as $name) {
            // Assign at most one instructor type, and optionally administrator
            $instructor = fake()->randomElement(['college instructor', 'basic education instructor', null]);
            $rolesArr = [];
            if ($instructor) {
                $rolesArr[] = $instructor;
            }
            if (!$instructor || fake()->boolean(40)) { // If no instructor, must be admin; else 40% chance to add admin
                $rolesArr[] = 'administrator';
            }
            $rolesArr = array_unique($rolesArr);
            $roles = implode(',', $rolesArr);
            if ($instructor === 'college instructor') {
                $collegeProgram = fake()->randomElement($collegePrograms);
            } else {
                $collegeProgram = null;
            }
            $type = (in_array('administrator', $rolesArr) && !$instructor)
                ? fake()->randomElement($employeeTypesAdmin)
                : fake()->randomElement($employeeTypesTeaching);

            // Generate base salary and deductions to avoid negative net pay
            $salaryRand = fake()->numberBetween(1, 100);
            if ($salaryRand <= 20) { // 20%: low
                $baseSalary = fake()->numberBetween(18000, 22000);
            } elseif ($salaryRand <= 40) { // 20%: lower-mid
                $baseSalary = fake()->numberBetween(23000, 28000);
            } elseif ($salaryRand <= 60) { // 20%: upper-mid
                $baseSalary = fake()->numberBetween(29000, 35000);
            } elseif ($salaryRand <= 80) { // 20%: high
                $baseSalary = fake()->numberBetween(36000, 45000);
            } else { // 20%: very high
                $baseSalary = fake()->numberBetween(50000, 70000);
            }

            // Deductions
            // SSS formula (match salaryFormulas.ts)
            $sss = 0;
            if ($baseSalary < 5250) {
                $sss = 250.00;
            } elseif ($baseSalary <= 5749.99) {
                $sss = 275.00;
            } elseif ($baseSalary <= 6249.99) {
                $sss = 300.00;
            } elseif ($baseSalary <= 6749.99) {
                $sss = 325.00;
            } elseif ($baseSalary <= 7249.99) {
                $sss = 350.00;
            } elseif ($baseSalary <= 7749.99) {
                $sss = 375.00;
            } elseif ($baseSalary <= 8249.99) {
                $sss = 400.00;
            } elseif ($baseSalary <= 8749.99) {
                $sss = 425.00;
            } elseif ($baseSalary <= 9249.99) {
                $sss = 450.00;
            } elseif ($baseSalary <= 9749.99) {
                $sss = 475.00;
            } elseif ($baseSalary <= 10249.99) {
                $sss = 500.00;
            } elseif ($baseSalary <= 10749.99) {
                $sss = 525.00;
            } elseif ($baseSalary <= 11249.99) {
                $sss = 550.00;
            } elseif ($baseSalary <= 11749.99) {
                $sss = 575.00;
            } elseif ($baseSalary <= 12249.99) {
                $sss = 600.00;
            } elseif ($baseSalary <= 12749.99) {
                $sss = 625.00;
            } elseif ($baseSalary <= 13249.99) {
                $sss = 650.00;
            } elseif ($baseSalary <= 13749.99) {
                $sss = 675.00;
            } elseif ($baseSalary <= 14249.99) {
                $sss = 700.00;
            } elseif ($baseSalary <= 14749.99) {
                $sss = 725.00;
            } elseif ($baseSalary <= 15249.99) {
                $sss = 750.00;
            } elseif ($baseSalary <= 15749.99) {
                $sss = 775.00;
            } elseif ($baseSalary <= 16249.99) {
                $sss = 800.00;
            } elseif ($baseSalary <= 16749.99) {
                $sss = 825.00;
            } elseif ($baseSalary <= 17249.99) {
                $sss = 850.00;
            } elseif ($baseSalary <= 17749.99) {
                $sss = 875.00;
            } elseif ($baseSalary <= 18249.99) {
                $sss = 900.00;
            } elseif ($baseSalary <= 18749.99) {
                $sss = 925.00;
            } elseif ($baseSalary <= 19249.99) {
                $sss = 950.00;
            } elseif ($baseSalary <= 19749.99) {
                $sss = 975.00;
            } elseif ($baseSalary <= 20249.99) {
                $sss = 1025.00;
            } elseif ($baseSalary <= 20749.99) {
                $sss = 1050.00;
            } elseif ($baseSalary <= 21249.99) {
                $sss = 1075.00;
            } elseif ($baseSalary <= 21749.99) {
                $sss = 1100.00;
            } elseif ($baseSalary <= 22249.99) {
                $sss = 1125.00;
            } elseif ($baseSalary <= 22749.99) {
                $sss = 1150.00;
            } elseif ($baseSalary <= 23249.99) {
                $sss = 1175.00;
            } elseif ($baseSalary <= 23749.99) {
                $sss = 1200.00;
            } elseif ($baseSalary <= 24249.99) {
                $sss = 1225.00;
            } elseif ($baseSalary <= 24749.99) {
                $sss = 1250.00;
            } elseif ($baseSalary <= 25249.99) {
                $sss = 1275.00;
            } elseif ($baseSalary <= 25749.99) {
                $sss = 1300.00;
            } elseif ($baseSalary <= 26249.99) {
                $sss = 1325.00;
            } elseif ($baseSalary <= 26749.99) {
                $sss = 1350.00;
            } elseif ($baseSalary <= 27249.99) {
                $sss = 1375.00;
            } elseif ($baseSalary <= 27749.99) {
                $sss = 1400.00;
            } elseif ($baseSalary <= 28249.99) {
                $sss = 1425.00;
            } elseif ($baseSalary <= 28749.99) {
                $sss = 1450.00;
            } elseif ($baseSalary <= 29249.99) {
                $sss = 1475.00;
            } elseif ($baseSalary <= 29749.99) {
                $sss = 1500.00;
            } elseif ($baseSalary <= 30249.99) {
                $sss = 1525.00;
            } elseif ($baseSalary <= 30749.99) {
                $sss = 1550.00;
            } elseif ($baseSalary <= 31249.99) {
                $sss = 1575.00;
            } elseif ($baseSalary <= 31749.99) {
                $sss = 1600.00;
            } elseif ($baseSalary <= 32249.99) {
                $sss = 1625.00;
            } elseif ($baseSalary <= 32749.99) {
                $sss = 1650.00;
            } elseif ($baseSalary <= 33249.99) {
                $sss = 1675.00;
            } elseif ($baseSalary <= 33749.99) {
                $sss = 1700.00;
            } elseif ($baseSalary <= 34249.99) {
                $sss = 1725.00;
            } else {
                $sss = 1750.00;
            }
            $sss = number_format($sss, 2, '.', '');
            $pag_ibig = number_format(fake()->numberBetween(1000, (int)($baseSalary * 0.08)), 2, '.', '');

            // PhilHealth calculation (match SalaryController: ($base_salary * 0.05) / 2, min 250, max 2500)
            $calculatedPhilHealth = ($baseSalary * 0.05) / 2;
            $philhealth = number_format(max(250, min(2500, $calculatedPhilHealth)), 2, '.', '');

            // Withholding tax calculation (match SalaryController)
            $total_compensation = $baseSalary - ($sss + $pag_ibig + $philhealth);
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

            // Generate work schedule based on employee type
            $workHoursPerDay = $type === 'Part Time' ? fake()->randomElement([4, 6]) : 8;
            $workStartTime = $type === 'Part Time' 
                ? fake()->randomElement(['08:00:00', '09:00:00', '10:00:00', '13:00:00', '14:00:00'])
                : '08:00:00';

            // Calculate end time based on start time and work hours
            $startDateTime = \DateTime::createFromFormat('H:i:s', $workStartTime);
            $endDateTime = clone $startDateTime;
            $endDateTime->add(new \DateInterval("PT{$workHoursPerDay}H"));
            $workEndTime = $endDateTime->format('H:i:s');

            // Split name into last_name, first_name, middle_name (assume format: LastName FirstName MiddleName, where first name can be two words)
            $parts = preg_split('/\s+/', $name);
            $last_name = $parts[0] ?? '';
            $middle_name = count($parts) > 2 ? $parts[count($parts) - 1] : '';
            $first_name = count($parts) > 2 ? implode(' ', array_slice($parts, 1, -1)) : ($parts[1] ?? '');
            // ...existing code...

            Employees::create([
                'last_name' => $last_name,
                'first_name' => $first_name,
                'middle_name' => $middle_name,
                'employee_type' => $type,
                'employee_status' => fake()->randomElement(['Active', 'Paid Leave', 'Maternity Leave', 'Sick Leave', 'Study Leave']),
                'roles' => $roles,
                'college_program' => $collegeProgram,
                'base_salary' => $baseSalary,
                'sss' => $sss,
                'philhealth' => $philhealth,
                'pag_ibig' => $pag_ibig,
                'withholding_tax' => $withholding_tax,
                'work_hours_per_day' => $workHoursPerDay,
                'work_start_time' => $workStartTime,
                'work_end_time' => $workEndTime,
            ]);
        }
    }
}
