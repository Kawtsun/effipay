<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Imports\UsersImport;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;
use App\Models\User;

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
        if ($file) {
            $extension = $file->getClientOriginalExtension();
            if (in_array($extension, ['csv', 'txt'])) {
                $path = $file->getRealPath();
                $csv = array_map('str_getcsv', file($path));
                $headers = array_map('trim', $csv[0]);
                foreach (array_slice($csv, 1) as $row) {
                    $data[] = array_combine($headers, $row);
                }
            } elseif (in_array($extension, ['xlsx', 'xls'])) {
                $imported = \Maatwebsite\Excel\Facades\Excel::toArray([], $file);
                if (!empty($imported) && count($imported[0]) > 1) {
                    $headers = array_map('trim', $imported[0][0]);
                    foreach (array_slice($imported[0], 1) as $row) {
                        $data[] = array_combine($headers, $row);
                    }
                }
            }
            session(['imported_data' => $data]);
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
