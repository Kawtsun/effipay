<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ObservanceController;

Route::post('/fetch-holidays', [ObservanceController::class, 'fetchHolidays']);