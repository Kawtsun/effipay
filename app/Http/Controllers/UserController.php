<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Imports\UsersImport;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;
use App\Models\User;
use App\Models\AuditLogs;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    // Show the upload form
    

public function showImportForm()
{
    return Inertia::render('ImportUsers');
}

public function index()
{
    $users = User::all();
    return Inertia::render('UsersList', ['users' => $users]);
}

    // Handle the file import
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
        ]);

        $file = $request->file('file');
        $data = [];
        $importedCount = 0;
        $errorCount = 0;
        if ($file) {
            $extension = $file->getClientOriginalExtension();
            if (in_array($extension, ['csv', 'txt'])) {
                $path = $file->getRealPath();
                $csv = array_map('str_getcsv', file($path));
                $headers = array_map('trim', $csv[0]);
                foreach (array_slice($csv, 1) as $row) {
                    try {
                        $data[] = array_combine($headers, $row);
                        $importedCount++;
                    } catch (\Throwable $e) {
                        $errorCount++;
                    }
                }
            } elseif (in_array($extension, ['xlsx', 'xls'])) {
                $imported = \Maatwebsite\Excel\Facades\Excel::toArray([], $file);
                if (!empty($imported) && count($imported[0]) > 1) {
                    $headers = array_map('trim', $imported[0][0]);
                    foreach (array_slice($imported[0], 1) as $row) {
                        try {
                            $data[] = array_combine($headers, $row);
                            $importedCount++;
                        } catch (\Throwable $e) {
                            $errorCount++;
                        }
                    }
                }
            }
            session(['imported_data' => $data]);
        }
        // Audit log for user import
        try {
            $username = Auth::user()->username ?? 'system';
            AuditLogs::create([
                'username'    => $username,
                'action'      => 'import users',
                'name'        => $file ? ($file->getClientOriginalName() ?? 'file import') : 'file import',
                'entity_type' => 'users',
                'entity_id'   => null,
                'details'     => json_encode([
                    'parsed_rows' => $importedCount,
                    'parse_errors' => $errorCount,
                    'ext' => $file ? $file->getClientOriginalExtension() : null,
                    'size' => $file ? $file->getSize() : null,
                ]),
                'date'        => now('Asia/Manila'),
            ]);
        } catch (\Throwable $e) {
            // ignore logging errors
        }
        return redirect()->route('import.preview');
    }

    /**
     * Show preview of imported data.
     */
    public function previewImport()
    {
        $importedData = session('imported_data', []);
        return \Inertia\Inertia::render('ImportPreview', [
            'importedData' => $importedData,
        ]);
    }

}
