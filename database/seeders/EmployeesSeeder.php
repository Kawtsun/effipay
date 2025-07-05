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

        $shuffled = collect($employeeNames)->shuffle();

        foreach ($shuffled as $name) {
            Employees::create([
                'employee_name' => $name,
                'employee_type' => fake()->randomElement(['Full Time', 'Part Time', 'Provisionary']),
                'employee_status' => fake()->randomElement(['Active', 'Paid Leave','Maternity Leave']),
                'base_salary' => fake()->numberBetween(10000, 999999),
                'overtime_pay' => fake()->numberBetween(2000, 5000),
                'sss' => fake()->numberBetween(1000, 5000),
                'philhealth' => fake()->numberBetween(1000, 5000),
                'pag_ibig' => fake()->numberBetween(1000, 5000),
                'withholding_tax' => fake()->numberBetween(5000, 10000)
            ]);
        }
    }
}
