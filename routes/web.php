<?php

use App\Http\Controllers\AuditLogsController;
use App\Http\Controllers\EmployeesController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\TimeKeepingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', fn() => Inertia::render('welcome'))
     ->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn() => Inertia::render('dashboard'))
         ->name('dashboard');

    // Resourceful controllers
    Route::resources([
        'salary'      => SalaryController::class,
        'employees'   => EmployeesController::class,
        'time-keeping'=> TimeKeepingController::class,
        'reports'     => ReportsController::class,
        'audit-logs'  => AuditLogsController::class,
    ]);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';


Route::get('/{any}', fn() => Inertia::render('App'))
     ->where('any', '.*');
