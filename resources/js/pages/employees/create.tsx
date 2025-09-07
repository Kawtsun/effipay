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
import EmployeeInstructorRadioRole from '@/components/employee-instructor-radio-role';
import { AnimatePresence, motion } from 'framer-motion';

type Props = {
    search: string;
    filters: { types: string[]; statuses: string[]; category?: string };
    page: number;

    // ← NEW props from controller
    salaryDefaults: Record<
        string,
        {
            base_salary: number;
            overtime_pay: number;
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
        const { search, filters, page, salaryDefaults } = props;
        const trimToHM = (t?: string) => (t ? t.split(':').slice(0, 2).join(':') : '');
        const { data, setData, post } = useForm({
            first_name: '',
            middle_name: '',
            last_name: '',
            employee_name: '',
            employee_type: 'Full Time',
            employee_status: 'Active',
            roles: '',
            base_salary: salaryDefaults['Full Time']?.base_salary.toString() ?? '',
            overtime_pay: salaryDefaults['Full Time']?.overtime_pay.toString() ?? '',
            sss: calculateSSS(Number(salaryDefaults['Full Time']?.base_salary ?? 0)).toString(),
            philhealth: salaryDefaults['Full Time']?.philhealth.toString() ?? '',
            pag_ibig: salaryDefaults['Full Time']?.pag_ibig.toString() ?? '',
            withholding_tax: salaryDefaults['Full Time']?.withholding_tax.toString() ?? '',
            work_hours_per_day: salaryDefaults['Full Time']?.work_hours_per_day.toString() ?? '8',
            work_start_time: trimToHM((salaryDefaults['Full Time']?.work_hours_per_day ?? 8) === 8 ? '08:00' : (salaryDefaults['Full Time']?.work_hours_per_day === 6 ? '09:00' : '08:00')),
            work_end_time: trimToHM((salaryDefaults['Full Time']?.work_hours_per_day ?? 8) === 8 ? '16:00' : (salaryDefaults['Full Time']?.work_hours_per_day === 6 ? '15:00' : '17:00')),
            college_program: '', // NEW
        });
        const [collegeProgram, setCollegeProgram] = useState('');
        const [collegeProgramError, setCollegeProgramError] = useState('');
        const collegeDeptRef = useRef<HTMLDivElement>(null);
        useEffect(() => {
            const baseSalaryNum = Number(data.base_salary.replace(/,/g, '')) || 0;
            const sssNum = calculateSSS(baseSalaryNum);
            const pagIbigNum = Number(data.pag_ibig.replace(/,/g, '')) || 0;
            const calculatedPhilHealth = calculatePhilHealth(baseSalaryNum);
            if (data.sss.replace(/,/g, '') !== sssNum.toString()) {
                setData('sss', sssNum.toString());
            }
            if (data.philhealth.replace(/,/g, '') !== calculatedPhilHealth.toFixed(2)) {
                setData('philhealth', calculatedPhilHealth.toFixed(2));
            }
            const calculatedWithholdingTax = calculateWithholdingTax(baseSalaryNum, sssNum, pagIbigNum, calculatedPhilHealth);
            if (data.withholding_tax.replace(/,/g, '') !== calculatedWithholdingTax.toFixed(2)) {
                setData('withholding_tax', calculatedWithholdingTax.toFixed(2));
            }
        }, [data.base_salary, data.pag_ibig, setData]);


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
        if (data.roles.split(',').includes('college instructor') && !collegeProgram) {
            setCollegeProgramError('Please select a college department/program.');
            return;
        } else {
            setCollegeProgramError('');
        }
        if (!data.employee_type) {
            setData('employee_type', 'Full Time');
            return;
        }
        
        // Validate Pag-IBIG minimum
        const pagIbigValue = Number(data.pag_ibig.replace(/,/g, '')) || 0;
        if (pagIbigValue < 200) {
            toast.error('Pag-IBIG must be at least ₱200');
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

            // Auto-calculate PhilHealth and Withholding Tax
            let actualWorkMinutes = endMinutes - startMinutes;
            if (actualWorkMinutes <= 0) actualWorkMinutes += 24 * 60;
            workHours = Math.round(actualWorkMinutes / 60);
        }

    const employee_name = `${data.last_name}, ${data.first_name}, ${data.middle_name}`;
        const cleanedData = {
            ...data,
            employee_name: employee_name,
            base_salary: Number(data.base_salary.replace(/,/g, '')) || 0,
            overtime_pay: Number(data.overtime_pay.replace(/,/g, '')) || 0,
            sss: Number(data.sss.replace(/,/g, '')) || 0,
            philhealth: Number(data.philhealth.replace(/,/g, '')) || 0,
            pag_ibig: pagIbigValue,
            withholding_tax: Number(data.withholding_tax.replace(/,/g, '')) || 0,
            work_hours_per_day: workHours,
            work_start_time: startTime,
            work_end_time: endTime,
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
            setData('base_salary', def.base_salary.toString());
            setData('overtime_pay', def.overtime_pay.toString());
            setData('sss', def.sss.toString());
            setData('philhealth', def.philhealth.toString());
            setData('pag_ibig', def.pag_ibig.toString());
            setData('withholding_tax', def.withholding_tax.toString());
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
    }, [data.employee_type, salaryDefaults]);

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
            
            const actualWorkHours = Math.round(actualWorkMinutes / 60);
            
            // Only update if the calculated hours are reasonable (1-24 hours)
            if (actualWorkHours >= 1 && actualWorkHours <= 24) {
                setData('work_hours_per_day', actualWorkHours.toString());
            }
        }
    }, [data.work_start_time, data.work_end_time]);

    // When collegeProgram changes, sync to form state
    useEffect(() => {
        setData('college_program', collegeProgram);
    }, [collegeProgram]);

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
                            page,
                        })}
                    >
                        <Button variant='outline'>
                            <ArrowLeft className='w-4 h-4' />
                            Back
                        </Button>
                    </Link>
                </div>
                <div className='w-full max-w-6xl mx-auto'>
                    <form
                        className='space-y-8'
                        onSubmit={handleSubmit}
                    >
                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
                            {/* Left Column - Employee Info & Work Schedule */}
                            <div className="space-y-8">
                                {/* Employee Information */}
                                <div>
                                    <h1 className='font-bold text-xl mb-6'>Employee Information</h1>
                                    <div className='space-y-6'>
                                        <div className="flex flex-col gap-3">
                                            <Label>Last Name</Label>
                                            <Input id="last_name" type="text" required placeholder="Last Name" value={data.last_name} onChange={e => setData('last_name', e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <Label>First Name</Label>
                                            <Input id="first_name" type="text" required placeholder="First Name" value={data.first_name} onChange={e => setData('first_name', e.target.value)} />
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
                                                <div className="mt-2 mb-1 text-xs font-semibold text-muted-foreground select-none">Instructor</div>
                                                <EmployeeInstructorRadioRole
                                                    value={data.roles.split(',').find(r => r === 'college instructor' || r === 'basic education instructor') || ''}
                                                    onChange={val => {
                                                        // Remove any instructor role, add the new one
                                                        const rolesArr = data.roles.split(',').filter(r => r !== 'college instructor' && r !== 'basic education instructor' && r !== '');
                                                        setData('roles', [val, ...rolesArr].filter(Boolean).join(','));
                                                        if (val === 'college instructor') {
                                                            setTimeout(() => {
                                                                collegeDeptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            }, 100);
                                                        }
                                                    }}
                                                />
                                                <AnimatePresence>
                                                    {data.roles.split(',').includes('college instructor') && (
                                                        <motion.div
                                                            ref={collegeDeptRef}
                                                            initial={{ opacity: 0, y: -20, scale: 0.98 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                                                            transition={{ duration: 0.35, ease: 'easeOut' }}
                                                            className="pl-4 mt-2"
                                                        >
                                                            <div className="text-xs font-semibold mb-1">College Department</div>
                                                            <EmployeeCollegeRadioDepartment
                                                                value={collegeProgram}
                                                                onChange={setCollegeProgram}
                                                                className="max-h-40 overflow-y-auto pr-2"
                                                            />
                                                            {collegeProgramError && (
                                                                <div className="text-xs text-red-500 mt-1">{collegeProgramError}</div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
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
                                                disabled={data.roles === ''}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <Label htmlFor="employee_status">Employee Status</Label>
                                            <EmployeeStatus
                                                value={data.employee_status}
                                                onChange={val => setData('employee_status', val)}
                                                statuses={availableStatuses}
                                                disabled={data.roles === ''}
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
                                                    📅 Schedule: {formatTime12Hour(data.work_start_time)} - {formatTime12Hour(data.work_end_time)} ({data.work_hours_per_day} hours)
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
                                                <Label htmlFor="base_salary">
                                                    Base Salary
                                                </Label>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                    <Input
                                                        id="base_salary"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9.,]*"
                                                        required
                                                        placeholder="Salary"
                                                        className="pl-8"
                                                        min={0}
                                                        value={formatWithCommas(data.base_salary ?? '')}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            setData('base_salary', raw);
                                                            // Auto-calculate PhilHealth based on base salary
                                                            const baseSalaryNum = Number(raw) || 0;
                                                            const calculatedPhilHealth = Math.max(250, Math.min(2500, (baseSalaryNum * 0.05) / 2));
                                                            setData('philhealth', calculatedPhilHealth.toString());
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className='flex flex-col gap-3'>
                                                <Label htmlFor="overtime_pay">
                                                    Overtime Pay
                                                </Label>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                    <Input
                                                        id="overtime_pay"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9.,]*"
                                                        required
                                                        placeholder="Overtime Pay"
                                                        className="pl-8"
                                                        min={0}
                                                        value={formatWithCommas(data.overtime_pay ?? '')}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            setData('overtime_pay', raw);
                                                        }}
                                                    />
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
                                                        required
                                                        placeholder="SSS"
                                                        className="pl-8 bg-gray-50 cursor-not-allowed text-gray-700 leading-normal align-middle"
                                                        min={0}
                                                        value={formatWithCommas(Number(data.sss ?? 0).toFixed(2))}
                                                        disabled
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Lightbulb width={18} height={18} color="var(--primary)" fill="var(--primary)" />
                                                    Automated
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
                                                        required
                                                        placeholder="PhilHealth"
                                                        className="pl-8 bg-gray-50 cursor-not-allowed text-gray-700 leading-normal align-middle"
                                                        style={{ lineHeight: '1.5rem' }}
                                                        min={250}
                                                        max={2500}
                                                        disabled
                                                        value={formatWithCommas(data.philhealth ?? '')}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            setData('philhealth', raw);
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Lightbulb width={18} height={18} color="var(--primary)" fill="var(--primary)" />
                                                    Automated
                                                </p>
                                            </div>
                                            <div className='flex flex-col gap-3'>
                                                <Label htmlFor="pag-ibig">
                                                    Pag-IBIG
                                                </Label>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                    <Input
                                                        id="pag-ibig"
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9.,]*"
                                                        required
                                                        placeholder="Pag-IBIG"
                                                        className="pl-8"
                                                        min={200}
                                                        value={formatWithCommas(data.pag_ibig ?? '')}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/,/g, '');
                                                            setData('pag_ibig', raw);
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Lightbulb width={18} height={18} color="var(--primary)" fill="var(--primary)" />
                                                    Must be at least ₱200
                                                </p>
                                            </div>
                                            <div className='flex flex-col gap-3'>
                                                <Label htmlFor="withholding_tax">
                                                    Withholding Tax
                                                </Label>
                                                <div className='relative'>
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                                        <Input
                                                            id="withholding_tax"
                                                            type="text"
                                                            required
                                                            placeholder="Withholding Tax"
                                                            className="pl-8 bg-gray-50 cursor-not-allowed text-gray-700 leading-normal align-middle"
                                                            inputMode="numeric"
                                                            pattern="[0-9.,]*"
                                                            min={0}
                                                            disabled
                                                            value={formatWithCommas(data.withholding_tax ?? '')}
                                                            onChange={e => {
                                                                const raw = e.target.value.replace(/,/g, '');
                                                                setData('withholding_tax', raw);
                                                            }}
                                                        />
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Lightbulb width={18} height={18} color="var(--primary)" fill="var(--primary)" />
                                                    Automated
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='flex justify-end'>
                            <Button type='submit' disabled={!canSubmit}>Add Employee</Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

