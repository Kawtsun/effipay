<?php

use App\Http\Controllers\AuditLogsController;
use App\Http\Controllers\EmployeesController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\TimeKeepingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', fn() => Inertia::render('welcome'))
     ->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/stats', [DashboardController::class, 'stats'])->name('dashboard.stats');

    // Resourceful controllers
    Route::resources([
        'salary'      => SalaryController::class,
        'employees'   => EmployeesController::class,
        'time-keeping'=> TimeKeepingController::class,
        'reports'     => ReportsController::class,
        'audit-logs'  => AuditLogsController::class,
    ]);

    // Payroll routes
    Route::post('/payroll/run', [PayrollController::class, 'runPayroll'])->name('payroll.run');
    Route::get('/payroll/employee', [PayrollController::class, 'getEmployeePayroll'])->name('payroll.employee');
    Route::get('/payroll/employee/dates', [PayrollController::class, 'getEmployeePayrollDates'])->name('payroll.employee.dates');
    Route::get('/payroll/employee/monthly', [PayrollController::class, 'getEmployeeMonthlyPayroll'])->name('payroll.employee.monthly');
    Route::get('/payroll/employee/months', [PayrollController::class, 'getEmployeePayrollMonths'])->name('payroll.employee.months');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';


Route::get('/{any}', fn() => Inertia::render('App'))
     ->where('any', '.*');
