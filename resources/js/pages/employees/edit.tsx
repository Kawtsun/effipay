function formatWithCommas(value: string) {
    if (!value) return '';
    const [int, dec] = value.split('.');
    return dec !== undefined
        ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec
        : int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

import { calculatePhilHealth, calculateWithholdingTax } from '@/utils/salaryFormulas';
import { calculateSSS } from '@/utils/salaryFormulas';
import { EmployeeStatus } from '@/components/employee-status';
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
import { formatFullName } from '@/utils/formatFullName';

type Props = {
    employee: {
        id: number;
        last_name: string;
        first_name: string;
        middle_name: string;
        employee_type: string;
        employee_status: string;
        roles: string;
        base_salary: number;
        rate_per_hour?: number;
        college_rate?: number;
        sss: number;
        philhealth: number;
        pag_ibig: number;
        withholding_tax: number;
        work_hours_per_day: number;
        work_start_time: string;
        work_end_time: string;
        sss_salary_loan?: number;
        sss_calamity_loan?: number;
        pagibig_multi_loan?: number;
        pagibig_calamity_loan?: number;
        peraa_con?: number;
        tuition?: number;
        china_bank?: number;
        tea?: number;
        honorarium?: number;
        college_program?: string;
    };
    employeeCategory?: string;
    search?: string;
    filters?: Record<string, unknown>;
    page?: number;
    salaryDefaults?: Record<string, {
        base_salary: number;
        sss: number;
        philhealth: number;
        pag_ibig: number;
        withholding_tax: number;
        work_hours_per_day: number;
    }>;
};



export default function Edit({
    employee,
    search,
    filters,
    page,
    salaryDefaults,
}: Props) {
    // Show input fields by default if value exists
    const [showSalaryLoanInput, setShowSalaryLoanInput] = useState(!!employee.sss_salary_loan);
    const [showCalamityLoanInput, setShowCalamityLoanInput] = useState(!!employee.sss_calamity_loan);
    const [showPagibigMultiInput, setShowPagibigMultiInput] = useState(!!employee.pagibig_multi_loan);
    const [showPagibigCalamityInput, setShowPagibigCalamityInput] = useState(!!employee.pagibig_calamity_loan);
    const [showPERAAConInput, setShowPERAAConInput] = useState(!!employee.peraa_con);
    // Other Deductions
    const [showTuitionInput, setShowTuitionInput] = useState(!!employee.tuition);
    const [showChinaBankInput, setShowChinaBankInput] = useState(!!employee.china_bank);
    const [showTEAInput, setShowTEAInput] = useState(!!employee.tea);
    const trimToHM = (t?: string) => (t ? t.split(':').slice(0, 2).join(':') : '');
    const { data, setData } = useForm({
        last_name: employee.last_name || '',
        first_name: employee.first_name || '',
        middle_name: employee.middle_name || '',
        employee_type: employee.employee_type,
        employee_status: employee.employee_status,
        roles: employee.roles,
        base_salary: employee.base_salary !== null && employee.base_salary !== undefined ? employee.base_salary.toString() : '',
        rate_per_hour: employee.college_rate !== null && employee.college_rate !== undefined ? employee.college_rate.toString() : '',
        sss: employee.sss !== null && employee.sss !== undefined ? employee.sss.toString() : '',
        philhealth: employee.philhealth !== null && employee.philhealth !== undefined ? employee.philhealth.toString() : '',
        pag_ibig: employee.pag_ibig !== null && employee.pag_ibig !== undefined ? employee.pag_ibig.toString() : '',
        withholding_tax: employee.withholding_tax !== null && employee.withholding_tax !== undefined ? employee.withholding_tax.toString() : '',
        work_hours_per_day: employee.work_hours_per_day !== null && employee.work_hours_per_day !== undefined ? employee.work_hours_per_day.toString() : '',
        work_start_time: trimToHM(employee.work_start_time),
        work_end_time: trimToHM(employee.work_end_time),
        college_program: employee.college_program || '',
        sss_salary_loan: employee.sss_salary_loan !== null && employee.sss_salary_loan !== undefined ? employee.sss_salary_loan.toString() : '',
        sss_calamity_loan: employee.sss_calamity_loan !== null && employee.sss_calamity_loan !== undefined ? employee.sss_calamity_loan.toString() : '',
        pagibig_multi_loan: employee.pagibig_multi_loan !== null && employee.pagibig_multi_loan !== undefined ? employee.pagibig_multi_loan.toString() : '',
        pagibig_calamity_loan: employee.pagibig_calamity_loan !== null && employee.pagibig_calamity_loan !== undefined ? employee.pagibig_calamity_loan.toString() : '',
        peraa_con: employee.peraa_con !== null && employee.peraa_con !== undefined ? employee.peraa_con.toString() : '',
        tuition: employee.tuition !== null && employee.tuition !== undefined ? employee.tuition.toString() : '',
        china_bank: employee.china_bank !== null && employee.china_bank !== undefined ? employee.china_bank.toString() : '',
        tea: employee.tea !== null && employee.tea !== undefined ? employee.tea.toString() : '',
        honorarium: employee.honorarium !== null && employee.honorarium !== undefined ? employee.honorarium.toString() : '',
    });
    // Initialize checkboxes based on employee roles
    const initialRolesArr = employee.roles ? employee.roles.split(',').map(r => r.trim()) : [];
    const [isCollegeInstructorChecked, setIsCollegeInstructorChecked] = useState(initialRolesArr.includes('college instructor'));
    const [isBasicEduInstructorChecked, setIsBasicEduInstructorChecked] = useState(initialRolesArr.includes('basic education instructor'));
    
        // Sync roles field with checkboxes
        useEffect(() => {
            let rolesArr = data.roles ? data.roles.split(',').map(r => r.trim()).filter(r => r) : [];
            rolesArr = rolesArr.filter(r => r !== 'college instructor' && r !== 'basic education instructor');
            if (isCollegeInstructorChecked) rolesArr.push('college instructor');
            if (isBasicEduInstructorChecked) rolesArr.push('basic education instructor');
            setData('roles', rolesArr.join(','));
        }, [isCollegeInstructorChecked, isBasicEduInstructorChecked]);

    // Watch for College Instructor role to clear contribution fields and remove validation
    // For college instructor, always show the current value from the employee record (do not clear)
    useEffect(() => {
        const rolesArr = data.roles.split(',').map(r => r.trim());
        if (!rolesArr.includes('college instructor')) {
            // Restore defaults if not college instructor and fields are empty
            if (data.sss === '' && salaryDefaults?.[data.employee_type]?.sss)
                setData('sss', salaryDefaults[data.employee_type].sss.toString());
            if (data.philhealth === '' && salaryDefaults?.[data.employee_type]?.philhealth)
                setData('philhealth', salaryDefaults[data.employee_type].philhealth.toString());
            if (data.pag_ibig === '' && salaryDefaults?.[data.employee_type]?.pag_ibig)
                setData('pag_ibig', salaryDefaults[data.employee_type].pag_ibig.toString());
            if (data.withholding_tax === '' && salaryDefaults?.[data.employee_type]?.withholding_tax)
                setData('withholding_tax', salaryDefaults[data.employee_type].withholding_tax.toString());
        }
        // For college instructor, do nothing: keep the current value from the employee record
    }, [data.roles, data.employee_type]);
    // Determine if College Instructor is selected
    const isCollegeInstructor = data.roles.split(',').includes('college instructor');
    // Track manual mode for contributions
    const [manualContribMode, setManualContribMode] = useState(isCollegeInstructor);

    // Watch for role changes to toggle manual/auto mode
    useEffect(() => {
        const isNowCollegeInstructor = data.roles.split(',').includes('college instructor');
        setManualContribMode(isNowCollegeInstructor);
    }, [data.roles]);

    const [collegeProgram, setCollegeProgram] = useState(employee.college_program || '');
    const [collegeProgramError, setCollegeProgramError] = useState('');
    const collegeDeptRef = useRef<HTMLDivElement>(null);

    // Helper function to format time to 12-hour format
    const formatTime12Hour = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Auto-calculate SSS when base_salary changes (unless manual mode)
    useEffect(() => {
        if (manualContribMode) return;
        setData('sss', calculateSSS(Number(data.base_salary.replace(/,/g, '')) || 0).toString());
    }, [data.base_salary, setData, manualContribMode]);

    const handleUpdate = (e: React.FormEvent) => {
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
        // College Instructor: Rate Per Hour required
        if (data.roles.split(',').includes('college instructor') && (!data.rate_per_hour || !data.rate_per_hour.trim())) {
            toast.error('Rate Per Hour is required.');
            return;
        }
        // Non-college: Base Salary required
        if (!data.roles.split(',').includes('college instructor') && (!data.base_salary || !data.base_salary.trim())) {
            toast.error('Base Salary is required.');
            return;
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
        const isCollege = data.roles.split(',').includes('college instructor');
        if (!isCollege && pagIbigValue < 200) {
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
            let actualWorkMinutes = endMinutes - startMinutes;
            if (actualWorkMinutes <= 0) actualWorkMinutes += 24 * 60;
            workHours = Math.max(1, Math.round(actualWorkMinutes / 60) - 1); // Subtract 1 hour for break
        }

        const employee_name = `${data.last_name}, ${data.first_name}, ${data.middle_name}`;
        const cleanedData = {
            ...data,
            employee_name,
            base_salary: Number(data.base_salary.replace(/,/g, '')) || 0,
            sss: Number(data.sss.replace(/,/g, '')) || 0,
            philhealth: Number(data.philhealth.replace(/,/g, '')) || 0,
            pag_ibig: pagIbigValue,
            withholding_tax: Number(data.withholding_tax.replace(/,/g, '')) || 0,
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

        // Submit via PUT with correct route params
        router.put(route('employees.update', { employee: employee.id }), cleanedData, {
            preserveScroll: true,
            onSuccess: () => {
                router.reload(); // Reload all props and pages to reflect updated info everywhere
            },
            onError: (errors) => {
                const first = Object.values(errors)[0] as string | undefined;
                if (first) toast.error(first);
            }
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employees',
            href: route('employees.index', {
                search,
                types: filters?.types,
                statuses: filters?.statuses,
                page,
            }),
        },

        {
            title: `#${employee.id} - ${formatFullName(employee.last_name, employee.first_name, employee.middle_name)}`,
            href: route('employees.show', employee.id),
        },
    ];

    // Validation for roles selection
    const rolesArr = data.roles ? data.roles.split(',') : [];
    const hasTeachingRole = rolesArr.includes('college instructor') || rolesArr.includes('basic education instructor');
    const canSubmit = rolesArr.includes('administrator') || hasTeachingRole;

    // For EmployeeType, filter options based on roles
    const teachingTypes = [
        { value: 'Full Time', label: 'Full Time' },
        { value: 'Part Time', label: 'Part Time' },
        { value: 'Provisionary', label: 'Provisionary' },
    ];
    const adminTypes = [
        { value: 'Regular', label: 'Regular' },
        { value: 'Provisionary', label: 'Provisionary' },
    ];
    let availableTypes = teachingTypes;
    if (rolesArr.includes('administrator') && (rolesArr.includes('college instructor') || rolesArr.includes('basic education instructor'))) {
        // Merge and deduplicate by value
        const merged = [...teachingTypes, ...adminTypes];
        const seen = new Set();
        availableTypes = merged.filter(t => {
            if (seen.has(t.value)) return false;
            seen.add(t.value);
            return true;
        });
    } else if (rolesArr.includes('administrator')) {
        availableTypes = adminTypes;
    } else if (rolesArr.includes('college instructor') || rolesArr.includes('basic education instructor')) {
        availableTypes = teachingTypes;
    }

    const availableStatuses = ['Active', 'Paid Leave', 'Maternity Leave', 'Sick Leave', 'Study Leave'];

    // useEffect: When roles change and not empty, set type and status to first available
    useEffect(() => {
        const rolesArr = data.roles ? data.roles.split(',') : [];
        if (rolesArr.length > 0) {
            // Set type to first available if not set
            if (!data.employee_type && availableTypes[0]?.value) {
                setData('employee_type', availableTypes[0].value);
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
            // Only set defaults if the field is truly undefined or null, not just empty string
            if (data.base_salary === undefined || data.base_salary === null) setData('base_salary', def.base_salary.toString());
            if (data.sss === undefined || data.sss === null) setData('sss', def.sss.toString());
            if (data.philhealth === undefined || data.philhealth === null) setData('philhealth', def.philhealth.toString());
            if (data.pag_ibig === undefined || data.pag_ibig === null) setData('pag_ibig', def.pag_ibig.toString());
            if (data.withholding_tax === undefined || data.withholding_tax === null) setData('withholding_tax', def.withholding_tax.toString());
            if (data.work_hours_per_day === undefined || data.work_hours_per_day === null) setData('work_hours_per_day', def.work_hours_per_day.toString());
            // Do NOT override existing work start/end times on edit.
        }
    }, [data.employee_type, salaryDefaults, data.base_salary, data.sss, data.philhealth, data.pag_ibig, data.withholding_tax, data.work_hours_per_day, setData]);

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
            let actualWorkMinutes = endMinutes - startMinutes;
            if (actualWorkMinutes <= 0) {
                actualWorkMinutes += 24 * 60; // Add 24 hours
            }

            const actualWorkHours = Math.max(1, Math.round(actualWorkMinutes / 60) - 1); // Subtract 1 hour for break

            // Only update if the calculated hours are reasonable (1-24 hours)
            if (actualWorkHours >= 1 && actualWorkHours <= 24) {
                setData('work_hours_per_day', actualWorkHours.toString());
            }
        }
    }, [data.work_start_time, data.work_end_time, setData]);

    // When collegeProgram changes, sync to form state

    // useEffect: When base_salary, sss, or pag_ibig change, recalculate PhilHealth and Withholding Tax (unless manual mode)
    useEffect(() => {
        if (manualContribMode) return;
        const baseSalary = Number(data.base_salary.replace(/,/g, '')) || 0;
        const sss = Number(data.sss.replace(/,/g, '')) || 0;
        const pagIbig = Number(data.pag_ibig.replace(/,/g, '')) || 0;
        const calculatedPhilHealth = calculatePhilHealth(baseSalary);

        if (data.sss.replace(/,/g, '') !== sss.toFixed(2)) {
            setData('sss', sss.toFixed(2));
        }

        if (data.philhealth.replace(/,/g, '') !== calculatedPhilHealth.toFixed(2)) {
            setData('philhealth', calculatedPhilHealth.toFixed(2));
        }
        const calculatedWithholdingTax = calculateWithholdingTax(baseSalary, sss, pagIbig, calculatedPhilHealth);
        if (data.withholding_tax.replace(/,/g, '') !== calculatedWithholdingTax.toFixed(2)) {
            setData('withholding_tax', calculatedWithholdingTax.toFixed(2));
        }
    }, [data.base_salary, data.sss, data.pag_ibig, data.philhealth, data.withholding_tax, setData, manualContribMode]);

    useEffect(() => {
        setData('college_program', collegeProgram);
    }, [collegeProgram, setData]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Employee" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-hidden py-6 px-2 sm:px-4 md:px-8">
                <div className="mb-4">
                    <Link
                        href={route('employees.index', {
                            search,
                            types: filters?.types,
                            statuses: filters?.statuses,
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
                        onSubmit={handleUpdate}
                    >
                        {/* Two Column Layout */}
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
                                        {/* Work hours per day is auto-derived; input removed */}
                                        <div className='flex flex-row gap-6'>
                                            <div className='flex flex-col gap-3'>
                                                <TimePicker
                                                    value={data.work_start_time}
                                                    onChange={(value) => setData('work_start_time', value)}
                                                    label="Work Start Time"
                                                    placeholder="Select start time"
                                                />
                                            </div>
                                            <div className='flex flex-col gap-3'>
                                                <TimePicker
                                                    value={data.work_end_time}
                                                    onChange={(value) => setData('work_end_time', value)}
                                                    label="Work End Time"
                                                    placeholder="Select end time"
                                                />
                                            </div>
                                        </div>
                                        {data.work_start_time && data.work_end_time && (
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                                    {(() => {
                                                        const [startHour, startMinute] = data.work_start_time.split(':').map(Number);
                                                        const [endHour, endMinute] = data.work_end_time.split(':').map(Number);
                                                        const startMinutes = startHour * 60 + startMinute;
                                                        const endMinutes = endHour * 60 + endMinute;
                                                        let actualWorkMinutes = endMinutes - startMinutes;
                                                        if (actualWorkMinutes <= 0) actualWorkMinutes += 24 * 60;
                                                        const totalMinutes = Math.max(1, actualWorkMinutes - 60); // minus 1 hour for break
                                                        const hours = Math.floor(totalMinutes / 60);
                                                        const minutes = totalMinutes % 60;
                                                        const durationText = minutes === 0 ? `${hours} hours` : `${hours} hours and ${minutes} minutes`;
                                                        return (
                                                            <>
                                                                📅 Schedule: {formatTime12Hour(data.work_start_time)} - {formatTime12Hour(data.work_end_time)} ({durationText})<br />
                                                                <span className="text-xs text-blue-600 dark:text-blue-400">*Break time is included. 1 hour is subtracted from total work hours.</span>
                                                            </>
                                                        );
                                                    })()}
                                                </p>
                                            </div>
                                        )}
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
                                                {/* Show Rate Per Hour if College Instructor, else Base Salary */}
                                                {(isCollegeInstructor && rolesArr.length >= 2) ? (
                                                    <>
                                                        <Label htmlFor="base_salary">Base Salary</Label>
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
                                                                value={formatWithCommas(data.base_salary ?? '')}
                                                                onChange={e => {
                                                                    const raw = e.target.value.replace(/,/g, '');
                                                                    if (!/^\d*(\.\d*)?$/.test(raw)) return;
                                                                    setData('base_salary', raw);
                                                                    const baseSalaryNum = Number(raw) || 0;
                                                                    const calculatedPhilHealth = Math.max(250, Math.min(2500, (baseSalaryNum * 0.05) / 2));
                                                                    setData('philhealth', calculatedPhilHealth.toString());
                                                                }}
                                                            />
                                                        </div>
                                                        <Label htmlFor="rate_per_hour">Rate Per Hour</Label>
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
                                                ) : isCollegeInstructor ? (
                                                    <>
                                                        <Label htmlFor="rate_per_hour">Rate Per Hour</Label>
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
                                                ) : (
                                                    <>
                                                        <Label htmlFor="base_salary">Base Salary</Label>
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
                                                                value={formatWithCommas(data.base_salary ?? '')}
                                                                onChange={e => {
                                                                    const raw = e.target.value.replace(/,/g, '');
                                                                    if (!/^\d*(\.\d*)?$/.test(raw)) return;
                                                                    setData('base_salary', raw);
                                                                    const baseSalaryNum = Number(raw) || 0;
                                                                    const calculatedPhilHealth = Math.max(250, Math.min(2500, (baseSalaryNum * 0.05) / 2));
                                                                    setData('philhealth', calculatedPhilHealth.toString());
                                                                }}
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* Honorarium (optional) */}
                                                <div className='flex flex-col gap-3'>
                                                    <Label htmlFor="honorarium">Honorarium <span className="text-xs text-muted-foreground">(optional)</span></Label>
                                                    <div className='relative'>
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                        <Input id="honorarium" type="text" inputMode="numeric" pattern="[0-9.,]*" placeholder="Honorarium" className="pl-8" min={0} value={formatWithCommas(data.honorarium ?? '')} onChange={e => { const raw = e.target.value.replace(/,/g, ''); setData('honorarium', raw); }} />
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
                                                <Label htmlFor="sss">
                                                    SSS
                                                </Label>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                    <Input
                                                        id="sss"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9.,]*"
                                                        required={!data.roles.split(',').includes('college instructor')}
                                                        placeholder="SSS"
                                                        className={manualContribMode ? "pl-8" : "pl-8 bg-gray-50 cursor-not-allowed text-gray-700 leading-normal align-middle"}
                                                        min={data.roles.split(',').includes('college instructor') ? undefined : 0}
                                                        value={formatWithCommas(data.sss ?? '')}
                                                        disabled={!manualContribMode}
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
                                                <Label htmlFor="philhealth">
                                                    PhilHealth
                                                </Label>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">₱</span>
                                                    <Input
                                                        id="philhealth"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9.,]*"
                                                        required={!data.roles.split(',').includes('college instructor')}
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
                                                    <Input id="pag-ibig" type="text" inputMode="decimal" pattern="^[0-9,]+(\.[0-9]{1,2})?$" required={!data.roles.split(',').includes('college instructor')} placeholder="Pag-IBIG" className="pl-8" min={data.roles.split(',').includes('college instructor') ? undefined : 200} value={formatWithCommas(data.pag_ibig ?? '')} onChange={e => { const raw = e.target.value.replace(/[^\d.,]/g, ''); setData('pag_ibig', raw); }} />
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
                                                        required={!data.roles.split(',').includes('college instructor')}
                                                        placeholder="Withholding Tax"
                                                        className={manualContribMode ? "pl-8" : "pl-8 bg-gray-50 cursor-not-allowed text-gray-700 leading-normal align-middle"}
                                                        inputMode="decimal"
                                                        pattern="^[0-9,]+(\.[0-9]{1,2})?$"
                                                        min={data.roles.split(',').includes('college instructor') ? undefined : 0}
                                                        disabled={!manualContribMode}
                                                        value={formatWithCommas(data.withholding_tax ?? '')}
                                                        onChange={e => {
                                                            if (!manualContribMode) return;
                                                            const raw = e.target.value.replace(/[^\d.,]/g, '');
                                                            setData('withholding_tax', raw);
                                                        }}
                                                    />
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

                        <div className='flex justify-end'>
                            <Button type='submit' disabled={!canSubmit}>Update Employee</Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}