<?php

namespace Database\Seeders;

use App\Models\Employees;
use Illuminate\Support\Facades\DB;
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
            'Dizon Isaac Rossdale Manzano',
            'Vilaga Arwin Paul Bausista',
            'Tañega Nicolle Daban',
            'Francisco Morpheus Joshua Sumiquiab',
        ];

        // Create a matching ID for each name in $employeeNames
        $employeeIds = [];
        foreach ($employeeNames2 as $index => $name) {
            $employeeIds[] = $index + 1; // IDs start from 1
        }

        // $shuffled = collect($employeeNames2)->shuffle();
        $employeeTypesTeaching = ['Full Time', 'Part Time', 'Provisionary'];
        $employeeTypesAdmin = ['Regular', 'Provisionary'];
        $collegePrograms = [
            'BSBA', 'BSA', 'COELA', 'BSCRIM', 'BSCS', 'JD', 'BSN', 'RLE', 'CG', 'BSPT', 'GSP', 'MBA'
        ];

        //foreach ($shuffled as $name)
        foreach ($employeeNames2 as $name) {
            // Assign exactly one role: either 'college instructor' or 'administrator' (never both)
            $isCollegeInstructor = fake()->boolean(50); // 50% chance for each
            if ($isCollegeInstructor) {
                $roles = 'college instructor';
                $collegeProgram = fake()->randomElement($collegePrograms);
                $type = fake()->randomElement($employeeTypesTeaching);
                $baseSalary = null;
                // College rate per hour stored in column `college_rate`
                $collegeRate = round(fake()->randomFloat(2, 250, 500), 2);
                // Contribution flags are optional for non-admins
                $sss = fake()->boolean();
                $philhealth = fake()->boolean();
                $pag_ibig = null; // optional for non-admins
                // withholding_tax is now a boolean column; allow model default (true)
                $withholding_tax = null;
            } else {
                $roles = 'administrator';
                $collegeProgram = null;
                $type = fake()->randomElement($employeeTypesAdmin);
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
                $collegeRate = null;
                // Contribution flags for admins are required booleans; set to true by default
                $sss = true;
                $philhealth = true;
                // Pag-IBIG is a numeric amount
                $pag_ibig = fake()->numberBetween(200, 2500);
                // withholding_tax is a boolean now; let default apply (true)
                $withholding_tax = null;
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
            $data = [
                'last_name' => $last_name,
                'first_name' => $first_name,
                'middle_name' => $middle_name,
                'employee_status' => fake()->randomElement(['Active', 'Paid Leave', 'Maternity Leave', 'Sick Leave', 'Study Leave']),
                'roles' => $roles,
                'college_program' => $collegeProgram,
                'base_salary' => $baseSalary,
                // Keep both fields in sync to support old/new code paths
                'college_rate' => $collegeRate,
                'sss' => $sss,
                'philhealth' => $philhealth,
                'pag_ibig' => $pag_ibig,
                // withholding_tax is boolean; omit to use model default
                'work_hours_per_day' => $workHoursPerDay,
                'work_start_time' => $workStartTime,
                'work_end_time' => $workEndTime,
            ];

            $employee = Employees::create($data);

            // Create corresponding employee_types record to support multiple employee types
            // Each record maps a role to a specific type (e.g., 'college instructor' => 'Part Time')
            $employee->employeeTypes()->create([
                'role' => $roles,
                'type' => $type,
            ]);

            // Randomize work days for each employee
            $workDayOptions = [
                // Mon-Wed-Fri
                [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                ],
                // Tue-Thu-Sat
                [
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'sat', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                ],
                // Mon-Sat (full week except Sun)
                [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'sat', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                ],
                // Mon-Tue-Wed-Thu-Fri (no Sat)
                [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                ],
                // Sat only
                [
                    ['day' => 'sat', 'work_start_time' => '08:00:00', 'work_end_time' => '16:00:00'],
                ],
            ];
            $selectedWorkDays = $workDayOptions[array_rand($workDayOptions)];
            foreach ($selectedWorkDays as $workDay) {
                DB::table('work_days')->insert([
                    'employee_id' => $employee->id,
                    'day' => $workDay['day'],
                    'work_start_time' => $workDay['work_start_time'],
                    'work_end_time' => $workDay['work_end_time'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
