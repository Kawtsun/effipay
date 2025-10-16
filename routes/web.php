<?php

use App\Http\Controllers\AboutController;
use App\Http\Controllers\AuditLogsController;
use App\Http\Controllers\EmployeesController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\TimeKeepingController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\LeaveReportController;
use Inertia\Inertia;


Route::get('/', fn() => Inertia::render('welcome'))
    ->name('home');

use App\Http\Controllers\ObservanceController;

Route::middleware('auth')->group(function () {

    // API: Get payslip for an employee and month as JSON for batch printing
    Route::get('/api/payroll/payslip', function (\Illuminate\Http\Request $request) {
        $employeeId = $request->query('employee_id');
        $month = $request->query('month');
        $payslip = \App\Models\Payroll::where('employee_id', $employeeId)
            ->where('payroll_date', 'like', $month . '%')
            ->orderByDesc('payroll_date')
            ->first();
        if (!$payslip) {
            return ['success' => false];
        }
        return [
            'success' => true,
            'payslip' => $payslip,
        ];
    });

    // API: Get all employees as JSON for batch printing
    Route::get('/api/employees/all', function () {
        return [
            'success' => true,
            'employees' => \App\Models\Employees::with('workDays')->get(),
        ];
    });

    // API: Get daily biometric records for employee and month
    Route::get('/api/timekeeping/records', [TimeKeepingController::class, 'getEmployeeRecordsForMonth']);
    // API: Get monthly summary for employee and month (ADD THIS LINE)
    Route::get('/api/timekeeping/monthlySummary', [TimeKeepingController::class, 'monthlySummary']); 

    // Timekeeping-only months (distinct months from timekeeping records)
    Route::get('/timekeeping/available-months', [TimeKeepingController::class, 'getAvailableMonths'])->name('timekeeping.available-months');

    // Add merged months endpoint for selectors
    Route::get('/payroll/all-available-months', [PayrollController::class, 'getAllAvailableMonths'])->name('payroll.all-available-months');
    // Payroll-only months (processed payroll months)
    Route::get('/payroll/processed-months', [PayrollController::class, 'getProcessedPayrollMonths'])->name('payroll.processed-months');

    Route::post('/time-keeping/import', [TimeKeepingController::class, 'import'])->name('time-keeping.import');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/stats', [DashboardController::class, 'stats'])->name('dashboard.stats');

    // Leave
    Route::get('/leave-report', [LeaveReportController::class, 'index'])->name('leave.report');

    // Observances API
    Route::get('/observances', [ObservanceController::class, 'index']);
    Route::post('/observances', [ObservanceController::class, 'store']);
    Route::delete('/observances/{date}', [ObservanceController::class, 'destroy']);

    // Resourceful controllers
    Route::resources([
        'salary'      => SalaryController::class,
        'employees'   => EmployeesController::class,
        'time-keeping' => TimeKeepingController::class,
        'reports'     => ReportsController::class,
        'audit-logs'  => AuditLogsController::class,
    ]);



    Route::get('/import-users', [UserController::class, 'showImportForm']);
    Route::post('/import-users', [UserController::class, 'import'])->name('import.users');
    Route::get('/import/preview', [UserController::class, 'previewImport'])->name('import.preview');
    Route::get('/users', [UserController::class, 'index'])->name('users.index');



    // Payroll routes
    Route::post('/payroll/run', [PayrollController::class, 'runPayroll'])->name('payroll.run');
    // Update payroll adjustments (must be authenticated)
    Route::match(['get','post'], '/payrolls/adjustments', [PayrollController::class, 'updateAdjustment'])->name('payroll.adjustments');
    Route::get('/payroll/employee', [PayrollController::class, 'getEmployeePayroll'])->name('payroll.employee');
    Route::get('/payroll/employee/dates', [PayrollController::class, 'getEmployeePayrollDates'])->name('payroll.employee.dates');
    Route::get('/payroll/employee/monthly', [PayrollController::class, 'getEmployeeMonthlyPayroll'])->name('payroll.employee.monthly');
    Route::get('/payroll/employee/months', [PayrollController::class, 'getEmployeePayrollMonths'])->name('payroll.employee.months');
    Route::get('/timekeeping/employee/monthly-summary', [TimeKeepingController::class, 'monthlySummary'])->name('timekeeping.employee.monthly-summary');
    Route::post('/payroll/run-13th-month', [PayrollController::class, 'run13thMonthPay'])->name('payroll.run.13th');
    Route::get('/payroll/export', [PayrollController::class, 'export'])->name('payroll.export');

    // Trigger artisan fetch-holidays 
    Route::post('/fetch-holidays', [ObservanceController::class, 'fetchHolidays']);

    // Credits
    Route::get('/about', [AboutController::class, 'index'])->name('about');
});



require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';


Route::get('/{any}', fn() => Inertia::render('App'))
    ->where('any', '.*');