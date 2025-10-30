<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection; // Don't forget this import

class Leave extends Model
{
    // ... other model code ...

    /**
     * Calculates the number of scheduled work days for each leave entry.
     * @return Collection
     */
    public static function countWorkdayLeaves(): Collection
    {
        // app/Models/Leave.php

        // ... inside the countWorkdayLeaves() method

        // 1. Initialize the session variable for the Tally Table.
        DB::statement('SET @rn := -1');

        $results = DB::table('leaves as l')
            ->select('l.employee_id', DB::raw('COUNT(wd.day) AS counted_leave_work_days'))

            // Tally Table/Sequence Generation (unchanged - generates the dates)
            ->join(DB::raw(
                '(SELECT @rn := @rn + 1 AS days_offset 
          FROM information_schema.columns c, (SELECT @rn) AS t
          LIMIT 366
        ) AS seq'
            ), function ($join) {
                $join->on(DB::raw('DATE_ADD(l.leave_start_day, INTERVAL seq.days_offset DAY)'), '<=', DB::raw('l.leave_end_day'));
            })

            // Key Change: Join with the work_days table using DAY NAME
            ->join('work_days as wd', function ($join) {
                $join->on('l.employee_id', '=', 'wd.employee_id')

                    // *** THIS IS THE NEW LOGIC ***
                    // 1. Calculate the actual date of the leave day: DATE_ADD(...)
                    // 2. Extract the abbreviated day name from that date: DATE_FORMAT(..., '%a')
                    // 3. Compare it to the abbreviated day name in the work_days table: wd.day
                    // Note: We use LOWER() to handle potential case inconsistencies ('Mon' vs 'mon').
                    ->on(
                        DB::raw('LOWER(DATE_FORMAT(DATE_ADD(l.leave_start_day, INTERVAL seq.days_offset DAY), \'%a\'))'),
                        '=',
                        DB::raw('wd.day')
                    );
            })

            ->groupBy('l.employee_id')
            ->get();

        return $results;
    }
}
