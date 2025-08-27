<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Employees;
use App\Models\Payroll;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $totalEmployees = Employees::count();

        // Distinct months available from payrolls (Y-m)
        $months = Payroll::orderBy('month', 'desc')
            ->pluck('month')
            ->unique()
            ->values();

        $selectedMonth = $request->input('month');
        if (!$selectedMonth) {
            $selectedMonth = $months->first(); // may be null if no payrolls
        }

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
                ->select('employees.employee_name as name', 'payrolls.net_pay as net_pay', 'payrolls.payroll_date')
                ->orderBy('net_pay', 'desc')
                ->get();
        }

        // Build last 12 months overview totals for bar chart (YYYY-mm for x, sum of net pay)
        $monthly = [];
        $now = \Carbon\Carbon::now();
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
        ]);
    }

    public function stats(Request $request)
    {
        $request->validate([
            'month' => 'nullable|date_format:Y-m',
        ]);

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
            $perEmployee = Payroll::where('month', $selectedMonth)
                ->join('employees', 'payrolls.employee_id', '=', 'employees.id')
                ->select('employees.employee_name as name', 'payrolls.net_pay as net_pay', 'payrolls.payroll_date')
                ->orderBy('net_pay', 'desc')
                ->get();
        }

        $monthly = [];
        $now = \Carbon\Carbon::now();
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
        ]);
    }
}


