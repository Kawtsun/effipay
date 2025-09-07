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

        $shuffled = collect($employeeNames)->shuffle();
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
            $overtimePay = fake()->numberBetween(2000, 5000);
            $sss = fake()->numberBetween(1000, (int)($baseSalary * 0.10));
            $pag_ibig = fake()->numberBetween(1000, (int)($baseSalary * 0.08));

            // PhilHealth calculation (match SalaryController: ($base_salary * 0.05) / 2, min 250, max 2500)
            $calculatedPhilHealth = ($baseSalary * 0.05) / 2;
            $philhealth = max(250, min(2500, $calculatedPhilHealth));

            // Withholding tax calculation (match SalaryController)
            $total_compensation = $baseSalary - ($sss + $pag_ibig + $philhealth);
            if ($total_compensation <= 20832) {
                $withholding_tax = 0;
            } elseif ($total_compensation >= 20833 && $total_compensation <= 33332) {
                $withholding_tax = ($total_compensation - 20833) * 0.15;
            } elseif ($total_compensation >= 33333 && $total_compensation <= 66666) {
                $withholding_tax = ($total_compensation - 33333) * 0.20 + 1875;
            } elseif ($total_compensation >= 66667 && $total_compensation <= 166666) {
                $withholding_tax = ($total_compensation - 66667) * 0.25 + 8541.80;
            } elseif ($total_compensation >= 166667 && $total_compensation <= 666666) {
                $withholding_tax = ($total_compensation - 166667) * 0.30 + 33541.80;
            } elseif ($total_compensation >= 666667) {
                $withholding_tax = ($total_compensation - 666667) * 0.35 + 183541.80;
            } else {
                $withholding_tax = 0;
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
                'overtime_pay' => $overtimePay,
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
