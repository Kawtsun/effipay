<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        \App\Console\Commands\AddEmployeeStatusHistory::class,
    ];
{
    protected function schedule(Schedule $schedule): void
    {
        // Run at 1am on January 1st every year
        $schedule->command('observances:fetch-holidays')->yearlyOn(1, 1, '1:00');
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
    }
}
