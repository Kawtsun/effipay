<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Employees;
use App\Models\Payroll;
use App\Models\EmployeeType; // ADDED: Import the new model

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // MODIFIED: Get employee classification counts from the new 'employee_types' table
        $employeeClassifications = EmployeeType::select('type')
            ->get()
            ->groupBy('type')
            ->map(function($group, $type) {
                return [
                    'classification' => $type,
                    'count' => $group->count(),
                ];
            })->values();

        $totalEmployees = Employees::count();

        // Distinct months available from payrolls only (Y-m)
        $months = Payroll::orderBy('month', 'desc')
            ->pluck('month')
            ->unique()
            ->values();

        $selectedMonth = $request->input('month', $months->first());

        $processedPayroll = 0;
        $totalNetPay = 0;
        if ($selectedMonth) {
            $processedPayroll = Payroll::where('month', $selectedMonth)->count();
            $totalNetPay = (int) Payroll::where('month', $selectedMonth)->sum('net_pay');
        }

        // Build per-employee net pay for selected month (for chart)
        $perEmployee = [];
        if ($selectedMonth) {
            $perEmployee = Payroll::where('month', $selectedMonth)
                ->join('employees', 'payrolls.employee_id', '=', 'employees.id')
                ->selectRaw("CONCAT(employees.last_name, ', ', employees.first_name) as name, payrolls.net_pay")
                ->orderBy('net_pay', 'desc')
                ->get();
        }

        // Build last 12 months overview totals for bar chart
        $monthly = [];
        $now = now();
        for ($i = 11; $i >= 0; $i--) {
            $d = $now->copy()->subMonths($i);
            $key = $d->format('Y-m');
            $label = $d->format('M');
            $sum = (int) Payroll::where('month', $key)->sum('net_pay');
            $monthly[] = [ 'key' => $key, 'label' => $label, 'total' => $sum ];
        }

        return Inertia::render('dashboard', [
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'processedPayroll' => $processedPayroll,
                'totalNetPay' => $totalNetPay,
            ],
            'months' => $months,
            'selectedMonth' => $selectedMonth,
            'chart' => [
                'perEmployee' => $perEmployee,
                'monthly' => $monthly,
            ],
            'employeeClassifications' => $employeeClassifications,
        ]);
    }

    public function stats(Request $request)
    {
        $request->validate([
            'month' => 'nullable|date_format:Y-m',
        ]);
        
        // MODIFIED: Get employee classification counts from the new 'employee_types' table
        $employeeClassifications = EmployeeType::select('type')
            ->get()
            ->groupBy('type')
            ->map(function($group, $type) {
                return [
                    'classification' => $type,
                    'count' => $group->count(),
                ];
            })->values();

        $selectedMonth = $request->input('month');
        if (!$selectedMonth) {
            $selectedMonth = Payroll::orderBy('month', 'desc')->value('month');
        }

        $totalEmployees = Employees::count();
        $processedPayroll = 0;
        $totalNetPay = 0;
        if ($selectedMonth) {
            $processedPayroll = Payroll::where('month', $selectedMonth)->count();
            $totalNetPay = (int) Payroll::where('month', $selectedMonth)->sum('net_pay');
        }

        // Chart data
        $perEmployee = [];
        if ($selectedMonth) {
            $perEmployee = Payroll::where('month', 'selectedMonth')
                ->join('employees', 'payrolls.employee_id', '=', 'employees.id')
                ->selectRaw("CONCAT(employees.last_name, ', ', employees.first_name) as name, payrolls.net_pay")
                ->orderBy('net_pay', 'desc')
                ->get();
        }

        $monthly = [];
        $now = now();
        for ($i = 11; $i >= 0; $i--) {
            $d = $now->copy()->subMonths($i);
            $key = $d->format('Y-m');
            $label = $d->format('M');
            $sum = (int) Payroll::where('month', $key)->sum('net_pay');
            $monthly[] = [ 'key' => $key, 'label' => $label, 'total' => $sum ];
        }

        return response()->json([
            'success' => true,
            'stats' => [
                'totalEmployees' => $totalEmployees,
                'processedPayroll' => $processedPayroll,
                'totalNetPay' => $totalNetPay,
            ],
            'selectedMonth' => $selectedMonth,
            'chart' => [
                'perEmployee' => $perEmployee,
                'monthly' => $monthly,
            ],
            'employeeClassifications' => $employeeClassifications,
        ]);
    }
}
