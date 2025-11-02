<?php

return [
    // Only expose these named routes to the frontend via @routes / Ziggy.
    'only' => [
        // Core navigation
        'home', 'dashboard', 'about',

        // Auth
        'login', 'logout', 'verification.notice', 'verification.verify', 'verification.send', 'password.confirm',

        // Settings
        'profile.edit', 'profile.update', 'profile.destroy', 'password.edit', 'password.update', 'appearance',

        // Employees
        'employees.index', 'employees.create', 'employees.store', 'employees.show', 'employees.edit', 'employees.update', 'employees.destroy',

        // Salary/Payroll
        'salary.index', 'salary.create', 'salary.store', 'salary.show', 'salary.edit', 'salary.update', 'salary.destroy',
        'payroll.index', 'payroll.run', 'payroll.run.13th', 'payroll.export', 'payroll.adjustments',
        'payroll.employee', 'payroll.employee.dates', 'payroll.employee.monthly', 'payroll.employee.months',
        'payroll.all-available-months', 'payroll.processed-months',

        // Timekeeping
        'time-keeping.index', 'time-keeping.create', 'time-keeping.store', 'time-keeping.show', 'time-keeping.edit', 'time-keeping.update', 'time-keeping.destroy',
        'time-keeping.import', 'timekeeping.available-months', 'timekeeping.employee.monthly-summary',

        // Reports & Audit logs
        'reports.index', 'reports.create', 'reports.store', 'reports.show', 'reports.edit', 'reports.update', 'reports.destroy',
        'audit-logs.index', 'audit-logs.create', 'audit-logs.store', 'audit-logs.show', 'audit-logs.edit', 'audit-logs.update', 'audit-logs.destroy', 'audit.print-log',

        // Import & Users
        'import.users', 'import.preview', 'users.index',
    ],

    // You can also define groups and reference them via @routes('group-name') if you prefer grouping.
    'groups' => [
        // 'app' => ['dashboard', 'about', 'employees.*', 'reports.*']
    ],

    // If you prefer an exclude list instead of include list, move the above into 'groups' and use 'except' here.
    // 'except' => ['debugbar.*'],

    // Optional: restrict which middleware names are exposed with routes (or set to [] to hide all middleware info)
    // 'middleware' => ['web', 'auth'],

    // Optional: Skip injecting the global route() function source if you already bundle it.
    // 'skip-route-function' => false,
];
