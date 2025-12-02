<?php

namespace Database\Seeders;

use App\Models\Employees;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TesterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employees = [
            // ### 1
            [
                'first_name' => 'Ludwig',
                'last_name' => 'Beethoven',
                'middle_name' => '',
                'role' => 'administrator',
                'type' => 'Regular',
                'base_salary' => 38800.04,
                'college_rate' => null,
                'honorarium' => null,
                
                // Contributions (Boolean)
                'sss' => true, 
                'philhealth' => true, 
                'withholding_tax' => true,
                
                // Contributions (Amount)
                'pag_ibig' => 500.00,

                // Loans & Deductions
                'sss_salary_loan' => null,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => 3559.50,
                'pagibig_calamity_loan' => null,
                'tuition' => null,
                'china_bank' => null,
                'tea' => 1500.00,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 2
            [
                'first_name' => 'Johann',
                'last_name' => 'Bach',
                'middle_name' => '',
                'role' => 'administrator',
                'type' => 'Regular',
                'base_salary' => 13219.25,
                'college_rate' => null,
                'honorarium' => null,

                // Contributions (Boolean)
                'sss' => true, 
                'philhealth' => true, 
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 200.00,

                // Loans & Deductions
                'sss_salary_loan' => null,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => null,
                'pagibig_calamity_loan' => null,
                'tuition' => 3000.00,
                'china_bank' => null,
                'tea' => null,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 3
            [
                'first_name' => 'Charles',
                'last_name' => 'Babage',
                'middle_name' => '',
                'role' => 'administrator',
                'type' => 'Regular',
                'base_salary' => 60120.50,
                'college_rate' => null,
                'honorarium' => null,

                // Contributions (Boolean)
                'sss' => false,
                'philhealth' => false,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => null,

                // Loans & Deductions
                'sss_salary_loan' => null,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => null,
                'pagibig_calamity_loan' => null,
                'tuition' => null,
                'china_bank' => null,
                'tea' => null,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 4
            [
                'first_name' => 'Thomas',
                'last_name' => 'Edison',
                'middle_name' => '',
                'role' => 'administrator',
                'type' => 'Regular',
                'base_salary' => 18073.62,
                'college_rate' => null,
                'honorarium' => null,

                // Contributions (Boolean)
                'sss' => true,
                'philhealth' => true,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 500.00,

                // Loans & Deductions
                'sss_salary_loan' => 1568.93,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => 1639.30,
                'pagibig_calamity_loan' => null,
                'tuition' => null,
                'china_bank' => 7073.22,
                'tea' => 1500.00,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 5
            [
                'first_name' => 'Benjamin',
                'last_name' => 'Franklin',
                'middle_name' => '',
                'role' => 'administrator',
                'type' => 'Regular',
                'base_salary' => 12612.60,
                'college_rate' => null,
                'honorarium' => null,

                // Contributions (Boolean)
                'sss' => true,
                'philhealth' => true,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 500.00,

                // Loans & Deductions
                'sss_salary_loan' => 1153.62,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => 997.98,
                'pagibig_calamity_loan' => 103.59,
                'tuition' => null,
                'china_bank' => null,
                'tea' => null,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 6
            [
                'first_name' => 'Thomas',
                'last_name' => 'Edison',
                'middle_name' => '',
                'role' => 'administrator',
                'type' => 'Regular',
                'base_salary' => 18073.62,
                'college_rate' => null,
                'honorarium' => null,

                // Contributions (Boolean)
                'sss' => true,
                'philhealth' => true,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 500.00,

                // Loans & Deductions
                'sss_salary_loan' => 1568.93,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => 1639.30,
                'pagibig_calamity_loan' => null,
                'tuition' => null,
                'china_bank' => 7073.22,
                'tea' => 1500.00,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 7
            [
                'first_name' => 'Albert',
                'last_name' => 'Einstein',
                'middle_name' => '',
                'role' => 'administrator',
                'type' => 'Regular',
                'base_salary' => 23481.30,
                'college_rate' => null,
                'honorarium' => null,

                // Contributions (Boolean)
                'sss' => true,
                'philhealth' => true,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 500.00,

                // Loans & Deductions
                'sss_salary_loan' => 1845.80,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => null,
                'pagibig_calamity_loan' => null,
                'tuition' => 1000.00,
                'china_bank' => null,
                'tea' => null,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 8
            [
                'first_name' => 'Galileo',
                'last_name' => 'Galilei',
                'middle_name' => '',
                'role' => 'administrator',
                'type' => 'Regular',
                'base_salary' => 68284.29,
                'college_rate' => null,
                'honorarium' => null,

                // Contributions (Boolean)
                'sss' => true,
                'philhealth' => true,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 1000.00,

                // Loans & Deductions
                'sss_salary_loan' => 1845.80,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => 4500.87,
                'pagibig_calamity_loan' => null,
                'tuition' => null,
                'china_bank' => 6891.86,
                'tea' => 3666.67,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '14:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '14:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '14:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '14:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '14:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '14:00:00',
            ],
            // ### 9
            [
                'first_name' => 'Isaac',
                'last_name' => 'Newton',
                'middle_name' => '',
                'role' => 'administrator',
                'type' => 'Regular',
                'base_salary' => 36628.00,
                'college_rate' => null,
                'honorarium' => null,

                // Contributions (Boolean)
                'sss' => true,
                'philhealth' => true,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 300.00,

                // Loans & Deductions
                'sss_salary_loan' => 1845.80,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => null,
                'pagibig_calamity_loan' => null,
                'tuition' => null,
                'china_bank' => null,
                'tea' => null,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 10
            [
                'first_name' => 'Nikolai',
                'last_name' => 'Tesla',
                'middle_name' => '',
                'role' => 'Clinic Staff',
                'type' => 'Regular',
                'base_salary' => null,
                'college_rate' => null,
                'honorarium' => 20000.00,

                // Contributions (Boolean)
                'sss' => false,
                'philhealth' => false,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => null,

                // Loans & Deductions
                'sss_salary_loan' => null,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => null,
                'pagibig_calamity_loan' => null,
                'tuition' => null,
                'china_bank' => null,
                'tea' => null,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 11
            [
                'first_name' => 'William',
                'last_name' => 'Shakespear',
                'middle_name' => '',
                'role' => 'Clinic Staff',
                'type' => 'Regular',
                'base_salary' => null,
                'college_rate' => null,
                'honorarium' => 10000.00,

                // Contributions (Boolean)
                'sss' => false,
                'philhealth' => false,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => null,

                // Loans & Deductions
                'sss_salary_loan' => null,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => null,
                'pagibig_calamity_loan' => null,
                'tuition' => null,
                'china_bank' => null,
                'tea' => null,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 12
            [
                'first_name' => 'Neil',
                'last_name' => 'Armstrong',
                'middle_name' => '',
                'role' => 'basic education instructor',
                'type' => 'Regular',
                'base_salary' => 29598.84,
                'college_rate' => null,
                'honorarium' =>  null,

                //Role Level
                'basic_edu_level' => 'Elementary',

                // Contributions (Boolean)
                'sss' => true,
                'philhealth' => true,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 200,

                // Loans & Deductions
                'sss_salary_loan' => null,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => null,
                'pagibig_calamity_loan' => null,
                'tuition' => null,
                'china_bank' => null,
                'tea' => null,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 13
            [
                'first_name' => 'Charlie',
                'last_name' => 'Chaplin',
                'middle_name' => '',
                'role' => 'basic education instructor',
                'type' => 'Regular',
                'base_salary' => 20178.14,
                'college_rate' => null,
                'honorarium' => null,

                //Role Level
                'basic_edu_level' => 'High School',

                // Contributions (Boolean)
                'sss' => true,
                'philhealth' => true,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 200,

                // Loans & Deductions
                'sss_salary_loan' => null,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => null,
                'pagibig_calamity_loan' => null,
                'tuition' => null,
                'china_bank' => 3046.93,
                'tea' => null,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 14
            [
                'first_name' => 'Frodo',
                'last_name' => 'Baggins',
                'middle_name' => '',
                'role' => 'basic education instructor',
                'type' => 'Regular',
                'base_salary' => 24758.02,
                'college_rate' => null,
                'honorarium' => null,

                //Role Level
                'basic_edu_level' => 'Senior High School',

                // Contributions (Boolean)
                'sss' => true,
                'philhealth' => true,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 200,

                // Loans & Deductions
                'sss_salary_loan' => 1845.80,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => 2028.96,
                'pagibig_calamity_loan' => 445.32,
                'tuition' => null,
                'china_bank' => 2865.56,
                'tea' => 1500.00,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 15
            [
                'first_name' => 'Newt',
                'last_name' => 'Scamander',
                'middle_name' => '',
                'role' => 'basic education instructor',
                'type' => 'Regular',
                'base_salary' => 24365.10,
                'college_rate' => null,
                'honorarium' => null,

                //Role Level
                'basic_edu_level' => 'Senior High School',

                // Contributions (Boolean)
                'sss' => true,
                'philhealth' => true,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 200,

                // Loans & Deductions
                'sss_salary_loan' => 1799.65,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => 1495.26,
                'pagibig_calamity_loan' => 445.32,
                'tuition' => null,
                'china_bank' => null,
                'tea' => null,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 16
            [
                'first_name' => 'Ash',
                'last_name' => 'Ketchum',
                'middle_name' => '',
                'role' => 'basic education instructor',
                'type' => 'Regular',
                'base_salary' => 18115.58,
                'college_rate' => null,
                'honorarium' => null,

                //Role Level
                'basic_edu_level' => 'Elementary',

                // Contributions (Boolean)
                'sss' => true,
                'philhealth' => true,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 200,

                // Loans & Deductions
                'sss_salary_loan' => null,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => 1074.35,
                'pagibig_calamity_loan' => null,
                'tuition' => 2000.00,
                'china_bank' => null,
                'tea' => 1500.00,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 17
            [
                'first_name' => 'Leonardo',
                'last_name' => 'Watch',
                'middle_name' => '',
                'role' => 'basic education instructor',
                'type' => 'Regular',
                'base_salary' => 19460.80,
                'college_rate' => null,
                'honorarium' => null,

                //Role Level
                'basic_edu_level' => 'Elementary',

                // Contributions (Boolean)
                'sss' => true,
                'philhealth' => true,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 200,

                // Loans & Deductions
                'sss_salary_loan' => null,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => 939.35,
                'pagibig_calamity_loan' => null,
                'tuition' => null,
                'china_bank' => null,
                'tea' => null,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
            // ### 18
            [
                'first_name' => 'Kang',
                'last_name' => 'Liu',
                'middle_name' => '',
                'role' => 'college instructor',
                'type' => 'Regular',
                'base_salary' => null,
                'college_rate' => 165.00,
                'honorarium' => null,

                //Role Level
                'college_program' => 'BSCS',

                // Contributions (Boolean)
                'sss' => false,
                'philhealth' => false,
                'withholding_tax' => true,

                // Contributions (Amount)
                'pag_ibig' => 200,

                // Loans & Deductions
                'sss_salary_loan' => null,
                'sss_calamity_loan' => null,
                'pagibig_multi_loan' => null,
                'pagibig_calamity_loan' => null,
                'tuition' => null,
                'china_bank' => null,
                'tea' => null,

                'work_schedule' => [
                    ['day' => 'mon', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'tue', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'wed', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'thu', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                    ['day' => 'fri', 'work_start_time' => '08:00:00', 'work_end_time' => '17:00:00'],
                ],
                'work_hours_per_day' => 8,
                'work_start_time' => '08:00:00',
                'work_end_time' => '17:00:00',
            ],
        ];

        foreach ($employees as $empData) {
            $data = [
                'last_name' => $empData['last_name'],
                'first_name' => $empData['first_name'],
                'middle_name' => $empData['middle_name'] ?? '',
                'employee_status' => 'Active',
                'roles' => $empData['role'],
                'college_program' => null, // Admin doesn't have college program
                'basic_edu_level' => $empData['basic_edu_level'] ?? null,
                'base_salary' => $empData['base_salary'],
                'college_rate' => $empData['college_rate'] ?? null,
                'honorarium' => $empData['honorarium'] ?? null,
                
                'sss' => $empData['sss'] ?? true,
                'philhealth' => $empData['philhealth'] ?? true,
                'pag_ibig' => $empData['pag_ibig'] ?? null,
                'withholding_tax' => $empData['withholding_tax'] ?? true,
                
                'sss_salary_loan' => $empData['sss_salary_loan'] ?? null,
                'sss_calamity_loan' => $empData['sss_calamity_loan'] ?? null,
                'pagibig_multi_loan' => $empData['pagibig_multi_loan'] ?? null,
                'pagibig_calamity_loan' => $empData['pagibig_calamity_loan'] ?? null,
                'tuition' => $empData['tuition'] ?? null,
                'china_bank' => $empData['china_bank'] ?? null,
                'tea' => $empData['tea'] ?? null,
                
                'work_hours_per_day' => $empData['work_hours_per_day'],
                'work_start_time' => $empData['work_start_time'],
                'work_end_time' => $empData['work_end_time'],
            ];

            $employee = Employees::create($data);

            // Create corresponding employee_types record
            $employee->employeeTypes()->create([
                'role' => $empData['role'],
                'type' => $empData['type'],
            ]);

            // Create work days
            foreach ($empData['work_schedule'] as $workDay) {
                DB::table('work_days')->insert([
                    'employee_id' => $employee->id,
                    'role' => $empData['role'],
                    'day' => $workDay['day'],
                    'work_start_time' => $workDay['work_start_time'],
                    'work_end_time' => $workDay['work_end_time'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
