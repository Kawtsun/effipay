<?php

use App\Http\Controllers\AuditLogsController;
use App\Http\Controllers\EmployeesController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\TimeKeepingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/employees/hints', [EmployeesController::class, 'hints'])
     ->name('employees.hints');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resources([
        'salary' => SalaryController::class,
        'employees' => EmployeesController::class,
        'time-keeping' => TimeKeepingController::class,
        'reports' => ReportsController::class,
        'audit-logs' => AuditLogsController::class
    ]);

    Route::get('/employees/{page?}', [EmployeesController::class, 'index'])->name('employees.index');
    Route::get('/{any}', fn() => Inertia::render('App'))->where('any', '.*');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
