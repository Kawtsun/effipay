
// ...existing imports and type definitions...
function formatWithCommas(value: string): string {
    if (!value) return '';
    const [int, dec] = value.split('.');
    return dec !== undefined
        ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec
        : int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
import { EmployeeStatus } from '@/components/employee-status';
import { calculateSSS } from '@/utils/salaryFormulas';
import { calculatePhilHealth, calculateWithholdingTax } from '@/utils/salaryFormulas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { EmployeeType } from '@/components/employee-type';
import { Checkbox } from '@/components/ui/checkbox';
import EmployeeCollegeRadioDepartment from '@/components/employee-college-radio-department';
import CollegeProgramScrollArea from '@/components/college-program-scroll-area';
import EmployeeInstructorRadioRole from '@/components/employee-instructor-radio-role';
import { AnimatePresence, motion } from 'framer-motion';
import { WorkDaysSelector, WorkDayTime } from '@/components/work-days-selector';

type Props = {
    search: string;
    filters: { types: string[]; statuses: string[]; roles: string[]; collegeProgram: string; othersRole: string };
    page: number;

    // ← NEW props from controller
    salaryDefaults: Record<
        string,
        {
            base_salary: number;
            college_rate: number;
            sss: number;
            philhealth: number;
            pag_ibig: number;
            withholding_tax: number;
            work_hours_per_day: number;
        }
    >;
    employeeCategory?: string;
};

export default function Create(props: Props) {
    // --- Instructor Role Selection as Checkboxes ---
    const [selectedIndex, setSelectedIndex] = useState(0);
    // Track checkbox state for college/basic education instructor
    const [isCollegeInstructorChecked, setIsCollegeInstructorChecked] = useState(false);
    const [isBasicEduInstructorChecked, setIsBasicEduInstructorChecked] = useState(false);
    const [isOthersChecked, setIsOthersChecked] = useState(false);
    const [othersRole, setOthersRole] = useState('');
    const [isBaseSalaryOptional, setIsBaseSalaryOptional] = useState(false);

    // Sync roles field with checkboxes and custom 'Others' role input
    useEffect(() => {
        // Build rolesArr only from checked roles and custom 'Others' role if checked
        const rolesArr = [];
        if (data.roles.split(',').includes('administrator')) rolesArr.push('administrator');
        if (isCollegeInstructorChecked) rolesArr.push('college instructor');
        if (isBasicEduInstructorChecked) rolesArr.push('basic education instructor');
        if (isOthersChecked && othersRole.trim()) rolesArr.push(othersRole.trim().toLowerCase());
        setData('roles', rolesArr.join(','));
    }, [isCollegeInstructorChecked, isBasicEduInstructorChecked, isOthersChecked, othersRole]);
    const { search, filters, page, salaryDefaults } = props;
    // Add state for showing/hiding Salary Loan input
    const [showSalaryLoanInput, setShowSalaryLoanInput] = useState(false);
    const [showCalamityLoanInput, setShowCalamityLoanInput] = useState(false);
    const [showPagibigMultiInput, setShowPagibigMultiInput] = useState(false);
    const [showPagibigCalamityInput, setShowPagibigCalamityInput] = useState(false);
    const [showPERAAConInput, setShowPERAAConInput] = useState(false);
    // Other Deductions
    const [showTuitionInput, setShowTuitionInput] = useState(false);
    const [showChinaBankInput, setShowChinaBankInput] = useState(false);
    const [showTEAInput, setShowTEAInput] = useState(false);
    const trimToHM = (t?: string) => (t ? t.split(':').slice(0, 2).join(':') : '');
    type EmployeeFormData = {
        first_name: string;
        middle_name: string;
        last_name: string;
        employee_name: string;
        employee_type: string;
        employee_status: string;
        roles: string;
        base_salary: string;
        rate_per_hour: string;
        sss: string;
        philhealth: string;
        pag_ibig: string;
        withholding_tax: string;
        work_hours_per_day: string;
        work_start_time: string;
        work_end_time: string;
        college_program: string;
        sss_salary_loan: string;
        sss_calamity_loan: string;
        pagibig_multi_loan: string;
        pagibig_calamity_loan: string;
        peraa_con: string;
        tuition: string;
        china_bank: string;
        tea: string;
        honorarium: string;
        work_days: WorkDayTime[];
    };

    const isInitiallyOthers = props.employeeCategory === 'others' || false;

    const { data, setData } = useForm<EmployeeFormData>({
        first_name: '',
        middle_name: '',
        last_name: '',
        employee_name: '',
        employee_type: 'Full Time',
        employee_status: 'Active',
        roles: '',
        base_salary: salaryDefaults['Full Time']?.base_salary.toString() ?? '',
        rate_per_hour: '',
        sss: salaryDefaults['Full Time']?.sss.toString() ?? '',
        philhealth: salaryDefaults['Full Time']?.philhealth.toString() ?? '',
        pag_ibig: salaryDefaults['Full Time']?.pag_ibig.toString() ?? '',
        withholding_tax: salaryDefaults['Full Time']?.withholding_tax.toString() ?? '',
        work_hours_per_day: salaryDefaults['Full Time']?.work_hours_per_day.toString() ?? '8',
        work_start_time: trimToHM((salaryDefaults['Full Time']?.work_hours_per_day ?? 8) === 8 ? '08:00' : (salaryDefaults['Full Time']?.work_hours_per_day === 6 ? '09:00' : '08:00')),
        work_end_time: trimToHM((salaryDefaults['Full Time']?.work_hours_per_day ?? 8) === 8 ? '16:00' : (salaryDefaults['Full Time']?.work_hours_per_day === 6 ? '15:00' : '17:00')),
        college_program: '',
        sss_salary_loan: '',
        sss_calamity_loan: '',
        pagibig_multi_loan: '',
        pagibig_calamity_loan: '',
        peraa_con: '',
        tuition: '',
        china_bank: '',
        tea: '',
        honorarium: '',
        work_days: [], // now array of WorkDayTime
    });
    // base_salary cleared if Others role is checked

    // Sync college_program and handle salary/contributions for roles


    // Watch for College Instructor role to clear contribution fields and remove validation
    // Removed duplicate useEffect for contribution clearing
    // Determine if College Instructor is selected
    const rolesArrManual = data.roles.split(',').map(r => r.trim());
    const isCollegeInstructor = rolesArrManual.includes('college instructor');
    const isBasicEduInstructor = rolesArrManual.includes('basic education instructor');
    const isOthersRole = rolesArrManual.includes(othersRole.trim()) && othersRole.trim() !== '';

    // Track manual mode for contributions
    const [manualContribMode, setManualContribMode] = useState(
        isCollegeInstructor || isBasicEduInstructor || isOthersRole || data.employee_type.toLowerCase() === 'retired'
    );

    // Watch for role or employee_type changes to toggle manual/auto mode
    useEffect(() => {
        const rolesArrManual = data.roles.split(',').map(r => r.trim());
        const isNowCollegeInstructor = rolesArrManual.includes('college instructor');
        // const isNowBasicEduInstructor = rolesArrManual.includes('basic education instructor'); // <-- No longer needed for MANUAL MODE FLAG
        const isNowOthersRole = rolesArrManual.includes(othersRole.trim()) && othersRole.trim() !== '';

        // Only College Instructor, Others, or Retired force Manual Contribution Mode (disables SSS/PhilHealth/WHT auto-calc)
        setManualContribMode(
            isNowCollegeInstructor || isNowOthersRole || data.employee_type.toLowerCase() === 'retired'
        );
    }, [data.roles, othersRole, data.employee_type]);

    // manual contribution mode
    const [collegeProgram, setCollegeProgram] = useState('');
    // const collegeDeptRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        // If we are in manual mode, stop all automatic calculation and prevent field overwrite.
        if (manualContribMode) return;

        const baseSalaryNum = Number(data.base_salary.replace(/,/g, '')) || 0;
        const pagIbigNum = Number(data.pag_ibig.replace(/,/g, '')) || 0;

        // 1. Calculate Contributions based on Base Salary
        const calculatedSSS = calculateSSS(baseSalaryNum);
        const calculatedPhilHealth = calculatePhilHealth(baseSalaryNum);
        const calculatedWHT = calculateWithholdingTax(baseSalaryNum, calculatedSSS, pagIbigNum, calculatedPhilHealth);

        // 2. Only update state if the new calculated value is different from the current state.
        // Use Math.round(..., 2) or toFixed(2) consistently for comparison.

        // Update SSS
        const currentSSS = Number(data.sss.replace(/,/g, ''));
        if (currentSSS.toFixed(2) !== calculatedSSS.toFixed(2)) {
            setData('sss', calculatedSSS.toFixed(2));
        }

        // Update PhilHealth
        const currentPhilHealth = Number(data.philhealth.replace(/,/g, ''));
        if (currentPhilHealth.toFixed(2) !== calculatedPhilHealth.toFixed(2)) {
            setData('philhealth', calculatedPhilHealth.toFixed(2));
        }

        // Update Withholding Tax
        const currentWHT = Number(data.withholding_tax.replace(/,/g, ''));
        if (currentWHT.toFixed(2) !== calculatedWHT.toFixed(2)) {
            setData('withholding_tax', calculatedWHT.toFixed(2));
        }

        // Pag-IBIG is usually user-set, so no auto-update here unless default logic is complex.

    }, [data.base_salary, data.pag_ibig, data.sss, data.philhealth, data.withholding_tax, setData, manualContribMode]);

    useEffect(() => {
        setData('college_program', collegeProgram);

        const rolesArr = data.roles.split(',').map(r => r.trim());
        const hasCollege = rolesArr.includes('college instructor');
        const hasBasicEdu = rolesArr.includes('basic education instructor');
        const hasAdmin = rolesArr.includes('administrator'); // Use isAdmin here
        const hasOthers = isOthersChecked;

        // Determine if Base Salary should be treated as optional and thus, forced blank
        const shouldBeOptional = hasOthers && !hasCollege && !hasBasicEdu && !hasAdmin;

        // Control the new state flag:
        setIsBaseSalaryOptional(shouldBeOptional); // <--- NEW LOGIC

        // CRUCIAL MODIFICATION: Force data.base_salary to clear if the field becomes optional.
        if (shouldBeOptional && data.base_salary !== '') {
            setData('base_salary', '');
        }
        // CRUCIAL MODIFICATION: Restore default value ONLY if it is NOT optional AND the field is currently empty.
        else if (!shouldBeOptional && data.base_salary === '') {
            if (salaryDefaults[data.employee_type]?.base_salary !== undefined) {
                setData('base_salary', salaryDefaults[data.employee_type].base_salary.toString());
            }
        }

        // Clear contributions if any of the three roles are selected
        if (hasCollege || hasBasicEdu || hasOthers) {
            setData(data => ({
                ...data,
                sss: '',
                philhealth: '',
                pag_ibig: '',
                withholding_tax: '',
                // MODIFIED: Only set the default rate if College Instructor is selected AND the field is currently empty.
                // This preserves user input for both College and Basic Edu if they started typing.
                // If the field is empty and College is checked, it sets the default rate.
                rate_per_hour:
                    (salaryDefaults[data.employee_type]?.college_rate !== undefined && hasCollege && data.rate_per_hour === '')
                        ? salaryDefaults[data.employee_type].college_rate.toString()
                        : data.rate_per_hour, // Keep the existing value for manual editing/Basic Edu
            }));
        } else if (data.employee_type.toLowerCase() === 'retired') {
            // Do not auto-fill contributions for retired
            if (data.rate_per_hour !== '') setData('rate_per_hour', '');
        } else {
            if (data.sss === '' && salaryDefaults[data.employee_type]?.sss)
                setData('sss', salaryDefaults[data.employee_type].sss.toString());
            if (data.philhealth === '' && salaryDefaults[data.employee_type]?.philhealth)
                setData('philhealth', salaryDefaults[data.employee_type].philhealth.toString());
            if (data.pag_ibig === '' && salaryDefaults[data.employee_type]?.pag_ibig)
                setData('pag_ibig', salaryDefaults[data.employee_type].pag_ibig.toString());
            if (data.withholding_tax === '' && salaryDefaults[data.employee_type]?.withholding_tax)
                setData('withholding_tax', salaryDefaults[data.employee_type].withholding_tax.toString());
            if (data.rate_per_hour !== '') setData('rate_per_hour', '');
        }

        // Clear college department selection if college instructor is unselected
        if (!hasCollege) {
            setCollegeProgram('');
            setData('college_program', '');
        }
    }, [collegeProgram, data.roles, data.employee_type, salaryDefaults, setData, data.rate_per_hour, data.sss, data.philhealth, data.pag_ibig, data.withholding_tax, isOthersChecked]);


    // Helper function to format time to 12-hour format
    const formatTime12Hour = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validate required fields and show toast instead of browser popup
        if (!data.last_name.trim()) {
            toast.error('Last Name is required.');
            return;
        }
        if (!data.first_name.trim()) {
            toast.error('First Name is required.');
            return;
        }
        const rolesArr = data.roles.split(',').map(r => r.trim());
        const isAdmin = rolesArr.includes('administrator');
        const isBasicEdu = rolesArr.includes('basic education instructor');
        const isCollege = rolesArr.includes('college instructor');
        const isOthers = rolesArr.includes(othersRole.trim()) && othersRole.trim() !== '';

        // If 'Others' is checked and is the only role, allow base_salary to be empty
        let baseSalaryValue = data.base_salary;
        if (isOthers && rolesArr.length === 1) {
            // We set baseSalaryValue to '' only upon submission if Others is the only role.
            // The UI input will hold the actual string value if the user typed something.
            baseSalaryValue = '';
        }

        // If both college instructor and (admin or basic edu) are selected, require both fields
        if (isCollege) {
            // Rate Per Hour is REQUIRED if College Instructor is selected, regardless of other roles
            if (!data.rate_per_hour || !data.rate_per_hour.trim()) {
                toast.error('Rate Per Hour is required.');
                return;
            }
        }

        // Base Salary is required for Admin or Basic Edu, unless "Others" is the only role
        const requiresBaseSalary = (isAdmin || isBasicEdu) && !isOthers;

        if (requiresBaseSalary) {
            if (!baseSalaryValue || !baseSalaryValue.trim()) {
                toast.error('Base Salary is required.');
                return;
            }
        }

        // This is the core optionality check for the "Others" role
        if (isOthers && rolesArr.length === 1) {
            if ((!data.honorarium || !data.honorarium.trim()) && (!baseSalaryValue || !baseSalaryValue.trim())) {
                toast.error('Honorarium or Base Salary is required for the custom role.');
                return;
            }
        }
        if (!data.employee_type) {
            toast.error('Employee Type is required.');
            return;
        }
        if (!data.employee_status) {
            toast.error('Employee Status is required.');
            return;
        }
        if (!data.roles.trim()) {
            toast.error('At least one role is required.');
            return;
        }
        if (data.roles.split(',').includes('college instructor') && !collegeProgram) {
            toast.error('Please select a college department/program.');
            return;
        }

        // Validate Pag-IBIG minimum only if not college instructor
        const pagIbigValue = Number(data.pag_ibig.replace(/,/g, '')) || 0;
        if ((!isCollege || !isBasicEdu || !isOthers) && (isAdmin && !(data.employee_type = 'Retired')) && pagIbigValue < 200) {
            toast.error('Pag-IBIG must be at least ₱200.');
            return;
        }

        // Derive work hours from start/end time instead of blocking submission
        const startTime = trimToHM(data.work_start_time);
        const endTime = trimToHM(data.work_end_time);
        let workHours = Number(data.work_hours_per_day) || 8;
        if (startTime && endTime) {
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;

            // Define fixed break window and deduction
            const fixedBreakStartMinutes = 12 * 60; // 720 minutes (12:00 PM)
            const fixedBreakEndMinutes = 13 * 60;   // 780 minutes (1:00 PM)
            const mandatedDeduction = 60;          // 1 hour

            // 1. Handle overnight shifts
            let totalScheduledMinutes = endMinutes - startMinutes;
            if (totalScheduledMinutes <= 0) {
                totalScheduledMinutes += 24 * 60;
            }

            // 2. Calculate Overlap (Raw Non-Work Time)
            const overlapStartMinutes = Math.max(startMinutes, fixedBreakStartMinutes);
            const overlapEndMinutes = Math.min(endMinutes, fixedBreakEndMinutes);
            const overlapMinutes = Math.max(0, overlapEndMinutes - overlapStartMinutes);

            // 3. Determine Final Deduction Amount (The Conditional Rule)
            let finalDeductionMinutes;

            if (endMinutes > fixedBreakEndMinutes) {
                // Shift ends later than 1:00 PM -> Mandate 1 hour
                finalDeductionMinutes = mandatedDeduction;
            } else {
                // Shift ends at 1:00 PM or earlier -> Deduction is the actual overlap
                finalDeductionMinutes = overlapMinutes;
            }

            // 4. Calculate Net Work Hours (as a whole number)
            const netWorkMinutes = Math.max(0, totalScheduledMinutes - finalDeductionMinutes);
            workHours = Math.max(1, Math.round(netWorkMinutes / 60)); // Round to nearest whole hour, ensuring minimum 1
            // --- End New Logic ---
        }

        const employee_name = `${data.last_name}, ${data.first_name}, ${data.middle_name}`;
        const cleanedData = {
            ...data,
            employee_name: employee_name,
            base_salary: baseSalaryValue === '' ? null : Number(baseSalaryValue.replace(/,/g, '')),
            rate_per_hour: (isCollege ? data.rate_per_hour : null),
            sss: data.sss === '' ? null : Number(data.sss.replace(/,/g, '')),
            philhealth: data.philhealth === '' ? null : Number(data.philhealth.replace(/,/g, '')),
            pag_ibig: data.pag_ibig === '' ? null : pagIbigValue,
            withholding_tax: data.withholding_tax === '' ? null : Number(data.withholding_tax.replace(/,/g, '')),
            work_hours_per_day: workHours,
            work_start_time: startTime,
            work_end_time: endTime,
            sss_salary_loan: data.sss_salary_loan === '' ? null : Number(data.sss_salary_loan.replace(/,/g, '')),
            sss_calamity_loan: data.sss_calamity_loan === '' ? null : Number(data.sss_calamity_loan.replace(/,/g, '')),
            pagibig_multi_loan: data.pagibig_multi_loan === '' ? null : Number(data.pagibig_multi_loan.replace(/,/g, '')),
            pagibig_calamity_loan: data.pagibig_calamity_loan === '' ? null : Number(data.pagibig_calamity_loan.replace(/,/g, '')),
            peraa_con: data.peraa_con === '' ? null : Number(data.peraa_con.replace(/,/g, '')),
            tuition: data.tuition === '' ? null : Number(data.tuition.replace(/,/g, '')),
            china_bank: data.china_bank === '' ? null : Number(data.china_bank.replace(/,/g, '')),
            tea: data.tea === '' ? null : Number(data.tea.replace(/,/g, '')),
            honorarium: data.honorarium === '' ? null : Number(data.honorarium.replace(/,/g, '')),
        };
        router.post(route('employees.store'), cleanedData, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload({ only: ['employeeClassifications'] });
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employees',
            href: route('employees.index', {
                search,
                types: filters.types,
                statuses: filters.statuses,
                page,
            }),
        },
        {
            title: 'Add Employee',
            href: route('employees.create', {
                search,
                types: filters.types,
                statuses: filters.statuses,
                page,
            }),
        },
    ];

    // Validation for roles selection
    const rolesArr = data.roles ? data.roles.split(',') : [];
    const hasTeachingRole = rolesArr.includes('college instructor') || rolesArr.includes('basic education instructor');
    const hasOthersRole = isOthersChecked && othersRole.trim() !== '';
    const canSubmit = rolesArr.includes('administrator') || hasTeachingRole || hasOthersRole;

    // For EmployeeType, filter options based on roles
    // const teachingTypes = [
    //     { value: 'Full Time', label: 'Full Time' },
    //     { value: 'Part Time', label: 'Part Time' },
    //     { value: 'Provisionary', label: 'Provisionary' },
    // ];
    // const adminTypes = [
    //     { value: 'Regular', label: 'Regular' },
    //     { value: 'Provisionary', label: 'Provisionary' },
    // ];
    // let availableTypes = teachingTypes;
    // if (rolesArr.includes('administrator') && (rolesArr.includes('college instructor') || rolesArr.includes('basic education instructor'))) {
    //     // Merge and deduplicate by value
    //     const merged = [...teachingTypes, ...adminTypes];
    //     const seen = new Set();
    //     availableTypes = merged.filter(t => {
    //         if (seen.has(t.value)) return false;
    //         seen.add(t.value);
    //         return true;
    //     });
    // } else if (rolesArr.includes('administrator')) {
    //     availableTypes = adminTypes;
    // } else if (rolesArr.includes('college instructor') || rolesArr.includes('basic education instructor')) {
    //     availableTypes = teachingTypes;
    // }

    const availableStatuses = ['Active', 'Paid Leave', 'Maternity Leave', 'Sick Leave', 'Study Leave'];

    // useEffect: When roles change and not empty, set type and status to first available
    useEffect(() => {
        const rolesArr = data.roles ? data.roles.split(',') : [];
        const hasAdmin = rolesArr.includes('administrator');
        const hasTeaching = rolesArr.includes('college instructor') || rolesArr.includes('basic education instructor');
        if (rolesArr.length === 0) {
            if (data.employee_type !== 'Full Time') {
                setData('employee_type', 'Full Time');
            }
        } else {
            // If admin is checked and not teaching, set to Regular
            if (hasAdmin && !hasTeaching && data.employee_type !== 'Regular') {
                setData('employee_type', 'Regular');
            }
            // If admin is unchecked and not teaching, set to Full Time
            if (!hasAdmin && !hasTeaching && data.employee_type !== 'Full Time') {
                setData('employee_type', 'Full Time');
            }
            // If teaching only, set to Full Time
            if (!hasAdmin && hasTeaching && data.employee_type !== 'Full Time') {
                setData('employee_type', 'Full Time');
            }
            // Set status to 'Active' as default if not already
            if (data.employee_status !== 'Active') {
                setData('employee_status', 'Active');
            }
        }
        // Only run when roles change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.roles]);

    // useEffect: When employee_type changes, set salary fields to defaults
    useEffect(() => {
        if (salaryDefaults && salaryDefaults[data.employee_type]) {
            const def = salaryDefaults[data.employee_type];
            // Only set base_salary if Others is NOT checked
            if (!(isOthersChecked && othersRole.trim())) {
                setData('base_salary', def.base_salary.toString());
            }
            // Only set rate_per_hour if college instructor, using college_rate
            if (data.roles.split(',').map(r => r.trim()).includes('college instructor') && def.college_rate !== undefined) {
                setData('rate_per_hour', def.college_rate.toString());
            } else {
                setData('rate_per_hour', '');
            }
            // Only set SSS, PhilHealth, Pag-IBIG, Withholding Tax if not college instructor
            if (data.roles.split(',').map(r => r.trim()).includes('administrator')) {
                setData('sss', def.sss.toString());
                setData('philhealth', def.philhealth.toString());
                setData('pag_ibig', def.pag_ibig.toString());
                setData('withholding_tax', def.withholding_tax.toString());
            }
            setData('work_hours_per_day', def.work_hours_per_day.toString());
            // Update work times based on default work hours (first-time add)
            const workHours = def.work_hours_per_day;
            if (workHours === 8) {
                setData('work_start_time', '08:00');
                setData('work_end_time', '16:00');
            } else if (workHours === 6) {
                setData('work_start_time', '09:00');
                setData('work_end_time', '15:00');
            } else {
                setData('work_start_time', '08:00');
                setData('work_end_time', '17:00');
            }
        }
    }, [data.employee_type, salaryDefaults, setData, data.roles, isOthersChecked, othersRole]);

    // Auto-calculate work hours when start/end times change
    useEffect(() => {
        const startTime = data.work_start_time;
        const endTime = data.work_end_time;

        if (startTime && endTime) {
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);

            // Convert to minutes for easier calculation
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;

            // Handle overnight shifts (end time is next day)
            // Define fixed break window and deduction
            const fixedBreakStartMinutes = 12 * 60; // 720 minutes (12:00 PM)
            const fixedBreakEndMinutes = 13 * 60;   // 780 minutes (1:00 PM)
            const mandatedDeduction = 60;          // 1 hour

            // 1. Handle overnight shifts (this is your existing actualWorkMinutes renamed)
            let totalScheduledMinutes = endMinutes - startMinutes;
            if (totalScheduledMinutes <= 0) {
                totalScheduledMinutes += 24 * 60; // Add 24 hours
            }

            // 2. Calculate Overlap (Raw Non-Work Time)
            const overlapStartMinutes = Math.max(startMinutes, fixedBreakStartMinutes);
            const overlapEndMinutes = Math.min(endMinutes, fixedBreakEndMinutes);
            const overlapMinutes = Math.max(0, overlapEndMinutes - overlapStartMinutes);

            // 3. Determine Final Deduction Amount (The Conditional Rule)
            let finalDeductionMinutes;

            if (endMinutes > fixedBreakEndMinutes) {
                // Shift ends later than 1:00 PM -> Mandate 1 hour
                finalDeductionMinutes = mandatedDeduction;
            } else {
                // Shift ends at 1:00 PM or earlier -> Deduction is the actual overlap
                finalDeductionMinutes = overlapMinutes;
            }

            // 4. Calculate Net Work Hours (as a whole number)
            const netWorkMinutes = Math.max(0, totalScheduledMinutes - finalDeductionMinutes);
            const actualWorkHours = Math.max(1, Math.round(netWorkMinutes / 60)); // Round to nearest whole hour, ensuring minimum 1
            // --- End New Logic ---

            // Only update if the calculated hours are reasonable (1-24 hours)
            if (actualWorkHours >= 1 && actualWorkHours <= 24) {
                setData('work_hours_per_day', actualWorkHours.toString());
            }
        }
    }, [data.work_start_time, data.work_end_time, setData]);

    // When collegeProgram changes, sync to form state


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Employees" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-hidden py-6 px-2 sm:px-4 md:px-8">
                <div className="mb-4">
                    <Link
                        href={route('employees.index', {
                            search,
                            types: filters.types,
                            statuses: filters.statuses,
                            roles: filters.roles,
                            collegeProgram: filters.collegeProgram,
                            othersRole: filters.othersRole,
                            page,
                        })}
                    >
                        <Button variant='outline'>
                            <ArrowLeft className='w-4 h-4' />
                            Back
                        </Button>
                    </Link>
                </div>
                <div className='w-full max-w-7xl mx-auto'>
                    <form
                        className='space-y-8'
                        onSubmit={handleSubmit}
                    >
                        {/* Three Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-42">
                            {/* Left Column - Employee Info & Work Schedule */}
                            <div className="space-y-8">
                                {/* Employee Information */}
                                <div>
                                    <h1 className='font-bold text-xl mb-6'>Employee Information</h1>
                                    <div className='space-y-6'>
                                        <div className="flex flex-col gap-3">
                                            <Label>Last Name</Label>
                                            <Input id="last_name" type="text" placeholder="Last Name" value={data.last_name} onChange={e => setData('last_name', e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <Label>First Name</Label>
                                            <Input id="first_name" type="text" placeholder="First Name" value={data.first_name} onChange={e => setData('first_name', e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <Label>Middle Name</Label>
                                            <Input id="middle_name" type="text" placeholder="Middle Name" value={data.middle_name} onChange={e => setData('middle_name', e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <Label>Employee Roles</Label>
                                            <div className="flex flex-col gap-2">
                                                <label className="flex items-center gap-2 text-sm select-none">
                                                    <Checkbox
                                                        checked={data.roles.split(',').includes('administrator')}
                                                        onCheckedChange={() => {
                                                            const rolesArr = data.roles.split(',').filter(r => r !== 'administrator' && r !== '');
                                                            if (data.roles.split(',').includes('administrator')) {
                                                                setData('roles', rolesArr.join(','));
                                                            } else {
                                                                setData('roles', [...rolesArr, 'administrator'].filter(Boolean).join(','));
                                                            }
                                                        }}
                                                        className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                                                    />
                                                    Administrator
                                                </label>
                                                <label className="flex items-center gap-2 text-sm select-none mt-2">
                                                    <Checkbox
                                                        checked={isCollegeInstructorChecked}
                                                        onCheckedChange={checked => setIsCollegeInstructorChecked(!!checked)}
                                                        className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                                                    />
                                                    College Instructor
                                                </label>
                                                <label className="flex items-center gap-2 text-sm select-none mt-2">
                                                    <Checkbox
                                                        checked={isBasicEduInstructorChecked}
                                                        onCheckedChange={checked => setIsBasicEduInstructorChecked(!!checked)}
                                                        className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                                                    />
                                                    Basic Education Instructor
                                                </label>
                                                <label className="flex items-center gap-2 text-sm select-none mt-2">
                                                    <Checkbox
                                                        checked={isOthersChecked}
                                                        onCheckedChange={checked => {
                                                            setIsOthersChecked(!!checked);

                                                            // ACTION: If checking 'Others', clear base_salary. (Requirement: cleared by default)
                                                            if (checked) {
                                                                setData('base_salary', '');
                                                            } else {
                                                                // ACTION: If unchecking 'Others', restore the default base salary.
                                                                const defaultBaseSalary = salaryDefaults[data.employee_type]?.base_salary.toString();
                                                                if (defaultBaseSalary) {
                                                                    setData('base_salary', defaultBaseSalary);
                                                                }
                                                            }
                                                        }}
                                                        className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                                                    />
                                                    Others
                                                </label>
                                                {isOthersChecked && (
                                                    <div className="pl-4 mt-2">
                                                        <Input
                                                            id="others_role"
                                                            type="text"
                                                            placeholder="Please specify other role"
                                                            value={othersRole}
                                                            onChange={e => setOthersRole(e.target.value)}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                )}
                                                {isCollegeInstructorChecked && (
                                                    <div className="pl-4 mt-2">
                                                        <div className="text-xs font-semibold mb-1">College Department</div>
                                                        <CollegeProgramScrollArea>
                                                            <EmployeeCollegeRadioDepartment
                                                                value={collegeProgram}
                                                                onChange={setCollegeProgram}
                                                            />
                                                        </CollegeProgramScrollArea>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Please select at least one role before choosing employee type or status.
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <Label htmlFor="employee_type">Employee Type</Label>
                                            <EmployeeType
                                                value={data.employee_type}
                                                onChange={val => setData('employee_type', val)}
                                                roles={data.roles ? data.roles.split(',') : []}
                                                disabled={!(data.roles.split(',').includes('administrator') || data.roles.split(',').includes('college instructor') || data.roles.split(',').includes('basic education instructor'))}
                                                types={data.roles === '' ? [{ value: 'Full Time', label: 'Full Time' }] : undefined}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <Label htmlFor="employee_status">Employee Status</Label>
                                            <EmployeeStatus
                                                value={data.employee_status}
                                                onChange={val => setData('employee_status', val)}
                                                statuses={availableStatuses}
                                                disabled={!(data.roles.split(',').includes('administrator') || data.roles.split(',').includes('college instructor') || data.roles.split(',').includes('basic education instructor'))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Work Schedule */}
                                <div>
                                    <h1 className='font-bold text-xl mb-6'>Work Schedule</h1>
                                    <div className='space-y-6'>
                                        {/* Work Days Selector */}
                                        {/* Work Days Selector with navigation and single time picker */}
                                        <WorkDaysSelector
                                            value={data.work_days}
                                            onChange={(days: WorkDayTime[]) => setData('work_days', days)}
                                            selectedIndex={selectedIndex}
                                            onSelectIndex={setSelectedIndex}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Employee Salary */}
                            <div>
                                <h1 className='font-bold text-xl mb-6'>Employee Salary</h1>
                                <div className='space-y-8'>
                                    {/* Earnings */}
                                    <div>
                                        <h2 className='font-semibold text-lg mb-4'>Earnings</h2>
                                        <div className='space-y-6'>
                                            <div className='flex flex-col gap-3'>
                                                {/* Show both fields if two or more roles and one is college instructor */}
                                                {(() => {
                                                    const rolesArr = data.roles.split(',').map(r => r.trim()).filter(Boolean);
                                                    const isCollege = rolesArr.includes('college instructor');
                                                    const isBasicEdu = rolesArr.includes('basic education instructor');
                                                    const isAdmin = rolesArr.includes('administrator');
                                                    const isOthers = isOthersChecked;

                                                    // Flags
                                                    // Base Salary appears unless it is a College Instructor ONLY role
                                                    const isCollegeInstructorOnly = isCollege && !isAdmin && !isBasicEdu && !isOthers;
                                                    const showBaseSalary = !isCollegeInstructorOnly;

                                                    // Rate Per Hour appears for any instructor role (College or Basic Edu)
                                                    const showRatePerHour = isCollege || isBasicEdu;

                                                    // Show something if any role is selected, OR if Base Salary is the default view.
                                                    const shouldRenderAnyEarningField = showBaseSalary || showRatePerHour || isOthers;

                                                    if (!shouldRenderAnyEarningField) {
                                                        // Only return null if absolutely no earning field should display (highly unlikely in a working scenario)
                                                        return null;
                                                    }

                                                    return (
                                                        <>
                                                            {/* 1. Base Salary Input */}
                                                            {showBaseSalary && (
                                                                <>
                                                                    <Label htmlFor="base_salary">
                                                                        Base Salary
                                                                        {isBaseSalaryOptional ? <span className="text-xs text-muted-foreground">(optional)</span> : null}
                                                                    </Label>
                                                                    <div className='relative'>
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                                        <Input
                                                                            id="base_salary"
                                                                            type="text"
                                                                            inputMode="numeric"
                                                                            pattern="[0-9.,]*"
                                                                            placeholder="Salary"
                                                                            className="pl-8"
                                                                            min={0}
                                                                            // MODIFIED VALUE: If optional AND the current value is NOT empty, display the formatted value.
                                                                            // If optional and current value IS empty, display nothing (the initial cleared state).
                                                                            // If NOT optional, always display the formatted value.
                                                                            value={
                                                                                isBaseSalaryOptional && data.base_salary === ''
                                                                                    ? ''
                                                                                    : formatWithCommas(data.base_salary ?? '')
                                                                            }

                                                                            onChange={e => {
                                                                                const raw = e.target.value.replace(/,/g, '');
                                                                                if (!/^\d*(\.\d*)?$/.test(raw)) return;

                                                                                // Setting the raw value here allows editing.
                                                                                setData('base_salary', raw);

                                                                                // ... (PhilHealth auto-calculation logic remains here) ...
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}

                                                            {/* 2. Rate Per Hour Input */}
                                                            {showRatePerHour && (
                                                                <>
                                                                    <Label htmlFor="rate_per_hour">
                                                                        Rate Per Hour
                                                                        {isCollege ? null : <span className="text-xs text-muted-foreground">(optional)</span>}
                                                                    </Label>
                                                                    <div className='relative'>
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                                        <Input
                                                                            id="rate_per_hour"
                                                                            type="text"
                                                                            inputMode="numeric"
                                                                            pattern="[0-9.,]*"
                                                                            placeholder="Rate Per Hour"
                                                                            className="pl-8"
                                                                            min={0}
                                                                            value={formatWithCommas(data.rate_per_hour ?? '')}
                                                                            onChange={e => {
                                                                                const raw = e.target.value.replace(/,/g, '');
                                                                                if (!/^\d*(\.\d*)?$/.test(raw)) return;
                                                                                setData('rate_per_hour', raw);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </>
                                                            )}
                                                        </>
                                                    );
                                                })()}

                                                {/* Honorarium (optional) */}
                                                <div className='flex flex-col gap-3'>
                                                    {(() => {
                                                        const rolesArr = data.roles.split(',').map(r => r.trim());
                                                        const isOthersOnly = rolesArr.length >= 0;
                                                        return (
                                                            <Label htmlFor="honorarium">
                                                                Honorarium
                                                                {isOthersOnly ? null : <span className="text-xs text-muted-foreground">(optional)</span>}
                                                            </Label>
                                                        );
                                                    })()}
                                                    <div className='relative'>
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                        <Input id="honorarium" type="text" inputMode="decimal" pattern="^[0-9]*\.?[0-9]{0,2}$" placeholder="Honorarium" className="pl-8" min={0} value={data.honorarium ?? ''} onChange={e => {
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            // Accept only valid decimal numbers with up to 2 decimal places
                                                            if (/^\d*(\.\d{0,2})?$/.test(raw)) {
                                                                setData('honorarium', raw);
                                                            }
                                                        }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contributions */}
                                    <div>
                                        <h2 className='font-semibold text-lg mb-4'>Contributions</h2>
                                        <div className='space-y-6'>
                                            <div className='flex flex-col gap-3'>
                                                <Label htmlFor="sss">SSS</Label>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                    <Input
                                                        id="sss"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9.,]*"
                                                        required={
                                                            (() => {
                                                                if (data.employee_type && data.employee_type.toLowerCase() === 'retired') return false;
                                                                const rolesArr = data.roles.split(',').map(r => r.trim());
                                                                return rolesArr.includes('administrator');
                                                            })()
                                                        }
                                                        placeholder="SSS"
                                                        className={manualContribMode ? "pl-8" : "pl-8 bg-gray-50 cursor-not-allowed text-gray-700 leading-normal align-middle"}
                                                        min={data.roles.split(',').includes('college instructor') ? undefined : 0}
                                                        disabled={!manualContribMode}
                                                        value={formatWithCommas(data.sss ?? '')}
                                                        onChange={e => {
                                                            if (!manualContribMode) return;
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            setData('sss', raw);
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Lightbulb width={18} height={18} color="var(--primary)" fill="var(--primary)" />
                                                    {manualContribMode ? 'Manual entry enabled' : 'Automated'}
                                                </p>
                                            </div>
                                            <div className='flex flex-col gap-3'>
                                                <Label htmlFor="philhealth">PhilHealth</Label>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">₱</span>
                                                    <Input
                                                        id="philhealth"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9.,]*"
                                                        required={
                                                            (() => {
                                                                if (data.employee_type && data.employee_type.toLowerCase() === 'retired') return false;
                                                                const rolesArr = data.roles.split(',').map(r => r.trim());
                                                                return rolesArr.includes('administrator');
                                                            })()
                                                        }
                                                        placeholder="PhilHealth"
                                                        className={manualContribMode ? "pl-8" : "pl-8 bg-gray-50 cursor-not-allowed text-gray-700 leading-normal align-middle"}
                                                        style={{ lineHeight: '1.5rem' }}
                                                        min={data.roles.split(',').includes('college instructor') ? undefined : 250}
                                                        max={data.roles.split(',').includes('college instructor') ? undefined : 2500}
                                                        disabled={!manualContribMode}
                                                        value={formatWithCommas(data.philhealth ?? '')}
                                                        onChange={e => {
                                                            if (!manualContribMode) return;
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            setData('philhealth', raw);
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Lightbulb width={18} height={18} color="var(--primary)" fill="var(--primary)" />
                                                    {manualContribMode ? 'Manual entry enabled' : 'Automated'}
                                                </p>
                                            </div>
                                            <div className='flex flex-col gap-3'>
                                                <Label htmlFor="pag-ibig">Pag-IBIG</Label>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                    <Input
                                                        id="pag-ibig"
                                                        type="text"
                                                        inputMode="decimal"
                                                        pattern="^[0-9,]+(\.[0-9]{1,2})?$"
                                                        required={
                                                            (() => {
                                                                if (data.employee_type && data.employee_type.toLowerCase() === 'retired') return false;
                                                                const rolesArr = data.roles.split(',').map(r => r.trim());
                                                                return rolesArr.includes('administrator');
                                                            })()
                                                        }
                                                        placeholder="Pag-IBIG"
                                                        className="pl-8"
                                                        min={data.roles.split(',').includes('college instructor') ? undefined : 200}
                                                        value={formatWithCommas(data.pag_ibig ?? '')}
                                                        onChange={e => { const raw = e.target.value.replace(/[^\d.,]/g, ''); setData('pag_ibig', raw); }} />
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Lightbulb width={18} height={18} color="var(--primary)" fill="var(--primary)" />
                                                    {data.roles.split(',').includes('college instructor') ? 'Manual entry enabled' : 'Must be at least ₱200'}
                                                </p>
                                            </div>
                                            <div className='flex flex-col gap-3'>
                                                <Label htmlFor="withholding_tax">Withholding Tax</Label>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                    <Input
                                                        id="withholding_tax"
                                                        type="text"
                                                        required={
                                                            (() => {
                                                                if (data.employee_type && data.employee_type.toLowerCase() === 'retired') return false;
                                                                const rolesArr = data.roles.split(',').map(r => r.trim());
                                                                return rolesArr.includes('administrator');
                                                            })()
                                                        }
                                                        placeholder="Withholding Tax"
                                                        className={manualContribMode ? "pl-8" : "pl-8 bg-gray-50 cursor-not-allowed text-gray-700 leading-normal align-middle"}
                                                        inputMode="decimal"
                                                        pattern="^[0-9,]+(\.[0-9]{1,2})?$"
                                                        min={data.roles.split(',').includes('college instructor') ? undefined : 0}
                                                        disabled={!manualContribMode}
                                                        value={formatWithCommas(data.withholding_tax ?? '')}
                                                        onChange={e => { if (!manualContribMode) return; const raw = e.target.value.replace(/[^\d.,]/g, ''); setData('withholding_tax', raw); }} />
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Lightbulb width={18} height={18} color="var(--primary)" fill="var(--primary)" />
                                                    {manualContribMode ? 'Manual entry enabled' : 'Automated'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Third Column - Loans */}
                            <div>
                                <h1 className='font-bold text-xl mb-6'>Loans</h1>
                                <div className='space-y-8'>
                                    {/* SSS Salary Loan */}
                                    <div className='mb-4'>
                                        <div className='flex items-center gap-2 mb-2'>
                                            <Label>SSS Salary Loan</Label>
                                            <Button type="button" size="sm" variant="outline" onClick={() => {
                                                if (showSalaryLoanInput && data.sss_salary_loan) {
                                                    setData('sss_salary_loan', '');
                                                }
                                                setShowSalaryLoanInput(!showSalaryLoanInput);
                                            }}>
                                                {showSalaryLoanInput ? '-' : '+'}
                                            </Button>
                                        </div>
                                        {showSalaryLoanInput && (
                                            <div className='flex flex-col gap-3'>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                    <Input
                                                        id="sss_salary_loan"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9.,]*"
                                                        placeholder="SSS Salary Loan"
                                                        className="pl-8"
                                                        min={0}
                                                        value={formatWithCommas(data.sss_salary_loan ?? '')}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            setData('sss_salary_loan', raw);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* SSS Calamity Loan */}
                                    <div className='mb-4'>
                                        <div className='flex items-center gap-2 mb-2'>
                                            <Label>SSS Calamity Loan</Label>
                                            <Button type="button" size="sm" variant="outline" onClick={() => {
                                                if (showCalamityLoanInput && data.sss_calamity_loan) {
                                                    setData('sss_calamity_loan', '');
                                                }
                                                setShowCalamityLoanInput(!showCalamityLoanInput);
                                            }}>
                                                {showCalamityLoanInput ? '-' : '+'}
                                            </Button>
                                        </div>
                                        {showCalamityLoanInput && (
                                            <div className='flex flex-col gap-3'>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                    <Input
                                                        id="sss_calamity_loan"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9.,]*"
                                                        placeholder="SSS Calamity Loan"
                                                        className="pl-8"
                                                        min={0}
                                                        value={formatWithCommas(data.sss_calamity_loan ?? '')}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            setData('sss_calamity_loan', raw);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Pag-IBIG Multi Purpose Loan */}
                                    <div className='mb-4'>
                                        <div className='flex items-center gap-2 mb-2'>
                                            <Label>Pag-IBIG Multi Purpose Loan</Label>
                                            <Button type="button" size="sm" variant="outline" onClick={() => {
                                                if (showPagibigMultiInput && data.pagibig_multi_loan) {
                                                    setData('pagibig_multi_loan', '');
                                                }
                                                setShowPagibigMultiInput(!showPagibigMultiInput);
                                            }}>
                                                {showPagibigMultiInput ? '-' : '+'}
                                            </Button>
                                        </div>
                                        {showPagibigMultiInput && (
                                            <div className='flex flex-col gap-3'>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                    <Input
                                                        id="pagibig_multi_loan"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9.,]*"
                                                        placeholder="Pag-IBIG Multi Purpose Loan"
                                                        className="pl-8"
                                                        min={0}
                                                        value={formatWithCommas(data.pagibig_multi_loan ?? '')}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            setData('pagibig_multi_loan', raw);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Pag-IBIG Calamity Loan */}
                                    <div className='mb-4'>
                                        <div className='flex items-center gap-2 mb-2'>
                                            <Label>Pag-IBIG Calamity Loan</Label>
                                            <Button type="button" size="sm" variant="outline" onClick={() => {
                                                if (showPagibigCalamityInput && data.pagibig_calamity_loan) {
                                                    setData('pagibig_calamity_loan', '');
                                                }
                                                setShowPagibigCalamityInput(!showPagibigCalamityInput);
                                            }}>
                                                {showPagibigCalamityInput ? '-' : '+'}
                                            </Button>
                                        </div>
                                        {showPagibigCalamityInput && (
                                            <div className='flex flex-col gap-3'>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                    <Input
                                                        id="pagibig_calamity_loan"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9.,]*"
                                                        placeholder="Pag-IBIG Calamity Loan"
                                                        className="pl-8"
                                                        min={0}
                                                        value={formatWithCommas(data.pagibig_calamity_loan ?? '')}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            setData('pagibig_calamity_loan', raw);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* PERAA Con. */}
                                    <div className='mb-4'>
                                        <div className='flex items-center gap-2 mb-2'>
                                            <Label>PERAA Con.</Label>
                                            <Button type="button" size="sm" variant="outline" onClick={() => {
                                                if (showPERAAConInput && data.peraa_con) {
                                                    setData('peraa_con', '');
                                                }
                                                setShowPERAAConInput(!showPERAAConInput);
                                            }}>
                                                {showPERAAConInput ? '-' : '+'}
                                            </Button>
                                        </div>
                                        {showPERAAConInput && (
                                            <div className='flex flex-col gap-3'>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                    <Input
                                                        id="peraa_con"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9.,]*"
                                                        placeholder="PERAA Contribution"
                                                        className="pl-8"
                                                        min={0}
                                                        value={formatWithCommas(data.peraa_con ?? '')}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            setData('peraa_con', raw);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Other Deductions */}
                                    <div className='mt-8'>
                                        <h2 className='font-semibold text-lg mb-4'>Other Deductions</h2>
                                        {/* Tuition */}
                                        <div className='mb-4'>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <Label>Tuition</Label>
                                                <Button type="button" size="sm" variant="outline" onClick={() => {
                                                    if (showTuitionInput && data.tuition) {
                                                        setData('tuition', '');
                                                    }
                                                    setShowTuitionInput(!showTuitionInput);
                                                }}>
                                                    {showTuitionInput ? '-' : '+'}
                                                </Button>
                                            </div>
                                            {showTuitionInput && (
                                                <div className='flex flex-col gap-3'>
                                                    <div className='relative'>
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                        <Input
                                                            id="tuition"
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9.,]*"
                                                            placeholder="Tuition Deduction"
                                                            className="pl-8"
                                                            min={0}
                                                            value={formatWithCommas(data.tuition ?? '')}
                                                            onChange={e => {
                                                                const raw = e.target.value.replace(/,/g, '');
                                                                setData('tuition', raw);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* China Bank */}
                                        <div className='mb-4'>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <Label>China Bank</Label>
                                                <Button type="button" size="sm" variant="outline" onClick={() => {
                                                    if (showChinaBankInput && data.china_bank) {
                                                        setData('china_bank', '');
                                                    }
                                                    setShowChinaBankInput(!showChinaBankInput);
                                                }}>
                                                    {showChinaBankInput ? '-' : '+'}
                                                </Button>
                                            </div>
                                            {showChinaBankInput && (
                                                <div className='flex flex-col gap-3'>
                                                    <div className='relative'>
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                        <Input
                                                            id="china_bank"
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9.,]*"
                                                            placeholder="China Bank Deduction"
                                                            className="pl-8"
                                                            min={0}
                                                            value={formatWithCommas(data.china_bank ?? '')}
                                                            onChange={e => {
                                                                const raw = e.target.value.replace(/,/g, '');
                                                                setData('china_bank', raw);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* TEA */}
                                        <div className='mb-4'>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <Label>TEA</Label>
                                                <Button type="button" size="sm" variant="outline" onClick={() => {
                                                    if (showTEAInput && data.tea) {
                                                        setData('tea', '');
                                                    }
                                                    setShowTEAInput(!showTEAInput);
                                                }}>
                                                    {showTEAInput ? '-' : '+'}
                                                </Button>
                                            </div>
                                            {showTEAInput && (
                                                <div className='flex flex-col gap-3'>
                                                    <div className='relative'>
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                        <Input
                                                            id="tea"
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9.,]*"
                                                            placeholder="TEA Deduction"
                                                            className="pl-8"
                                                            min={0}
                                                            value={formatWithCommas(data.tea ?? '')}
                                                            onChange={e => {
                                                                const raw = e.target.value.replace(/,/g, '');
                                                                setData('tea', raw);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='flex justify-end mt-8'>
                            <Button type='submit' disabled={!canSubmit}>Add Employee</Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

