<?php

use App\Http\Controllers\AuditLogsController;
use App\Http\Controllers\EmployeesController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\TimeKeepingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public / Guest Routes
|--------------------------------------------------------------------------
|
| Load your auth.php here so /login, /register, /password/* exist
| before the SPA catch-all below.
|
*/
Route::middleware('guest')->group(function () {
    require __DIR__.'/auth.php';
});

/*
|--------------------------------------------------------------------------
| Home & Any Other Public Pages
|--------------------------------------------------------------------------
*/
Route::get('/', fn() => Inertia::render('welcome'))
     ->name('home');

/*
|--------------------------------------------------------------------------
| JSON Hints Route
|--------------------------------------------------------------------------
|
| If you want hinting even before login, keep this outside auth middleware.
| If hints should only load when authenticated, move this inside the auth group.
|
*/
// Route::get('/employees/hints', [EmployeesController::class, 'hints'])
//      ->name('employees.hints');

/*
|--------------------------------------------------------------------------
| Protected Routes (requires authentication)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    //Employees JSON Hints Route
//     Route::get('/employees/hints', [EmployeesController::class, 'hints'])
//      ->name('employees.hints');

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

    // Explicit employees index with optional page
    Route::get('/employees/{page?}', [EmployeesController::class, 'index'])
         ->name('employees.index');

    
});

require __DIR__.'/settings.php';

/*
|--------------------------------------------------------------------------
| SPA Catch-All
|--------------------------------------------------------------------------
|
| This MUST come last, after auth.php and your other routes.
| It captures any URL not matched above and renders your Inertia shell.
|
*/


Route::get('/{any}', fn() => Inertia::render('App'))
     ->where('any', '.*');
