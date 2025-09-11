<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TimeKeepingsSeeder extends Seeder
{
    public function run()
    {
        // Generate employee IDs based on the number of employee names
        $employeeNames = [
            'Rice Shower', 'Tokai Teoi', 'Gold Ship', 'Oguri Cap', 'Agnes Tachyon', 'Nice Nature', 'Matikanetannhauser',
            'Special Week', 'Mejiro McQueen', 'Kitasan Black', 'Satano Diamond', 'Tamamo Cross', 'Silent Suzuka',
            'El Condor Pasa', 'Manhattan Cafe', 'Mihono Bourbon', 'TM Opera O', 'Maruzensky', 'Symboli Rudolf',
            'Grass Wonder', 'Haru Urara', 'Air Groove', 'Sakura Bakushin O', 'Narita Top Road', 'Jungle Pocket',
            'Satono Crown', 'Sakura Chiyono O', 'Narita Taishin', 'Seiun Sky', 'Eishin Flash', 'Fine Motion',
            'Gold City', 'Hitori Gotou', 'Nijika Ijichi', 'Ryou Yamada', 'Ikuyo Kita', 'Seika Ijichi', 'Kikuri Hiroi',
            'Rin Hoshizora', 'Kotori Minami', 'Hanayo Koizumi', 'Nico Yazawa', 'Maki Nishikino', 'Umi Sonoda',
            'Nozomi Toujou', 'Honoka Kousaka', 'Eli Ayase', 'Chika Takami', 'Riko Sakurauchi', 'Kanan Matsuura',
            'Dia Kurosawa', 'You Watanabe', 'Yoshiko Tsushima', 'Hanamaru Kunikida', 'Mari Ohara', 'Ruby Kurosawa',
            'Karin Asaka', 'Setsuna Yuki', 'Kasumi Nakasu', 'Shizuku Ousaka', 'Ai Miyashita', 'Rina Tennouji',
            'Kanata Konoe', 'Emma Verde', 'Ayumu Uehara', 'Yuu Takasaki', 'Kanon Shibuya', 'Keke Tang', 'Chisato Arashi',
            'Sumire Heanna', 'Ren Hazuki', 'Natsumi Onitsuka', 'Kinako Sakurakouji', 'Mei Yoneme', 'Shiki Wakana',
            'Aoba Suzukaze', 'Kou Yagami', 'Rin Toyama', 'Hifumi Takimoto', 'Hajime Shinoda', 'Yun Iijima',
            'Nene Sakura', 'Umiko Ahagon', 'Shizuku Hazuki', 'Madoka Kaname', 'Homura Akemi', 'Mami Tomoe',
            'Sayaka Miki', 'Kyouko Sakura', 'Yui Hirasawa', 'Mio Akiyama', 'Ritsu Tainaka', 'Tsumugi Kotobuki',
            'Azusa Nakano', 'Nadeshiko Kagamihara', 'Aoi Inuyama', 'Chiaki Oogaki', 'Ena Saitou', 'Rin Shima'
        ];
        $employeeIds = [];
        foreach ($employeeNames as $index => $name) {
            $employeeIds[] = $index + 1; // IDs start from 1
        }
        $startDate = Carbon::create(2025, 8, 1);
        $endDate = Carbon::create(2025, 8, 31);
        $classifications = [
            'late' => ['clock_in' => '09:00:00', 'clock_out' => '16:00:00'],
            'normal' => ['clock_in' => '08:00:00', 'clock_out' => '16:00:00'],
            'undertime' => ['clock_in' => '08:00:00', 'clock_out' => '15:00:00'],
            'overtime' => ['clock_in' => '08:00:00', 'clock_out' => '17:00:00'],
            'absent' => ['clock_in' => null, 'clock_out' => null],
        ];

        foreach ($employeeIds as $employeeId) {
            $date = $startDate->copy();
            $classificationKeys = array_keys($classifications);
            $classCount = count($classificationKeys);
            while ($date->lte($endDate)) {
                // Randomize classification for each day
                $randomIndex = rand(0, $classCount - 1);
                $classification = $classifications[$classificationKeys[$randomIndex]];
                \App\Models\TimeKeeping::create([
                    'employee_id' => $employeeId,
                    'date' => $date->format('Y-m-d'),
                    'clock_in' => $classification['clock_in'],
                    'clock_out' => $classification['clock_out'],
                ]);
                $date->addDay();
            }
        }
    }
}
