import { EmployeeStatus } from '@/components/employee-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
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
        }
    >;
    employeeCategory?: string;
};

export default function Create({
    search,
    filters,
    page,
    salaryDefaults,
}: Props) {
    const { data, setData, post } = useForm({
        employee_name: '',
        employee_type: 'Full Time',
        employee_status: 'Active',
        roles: '',
        base_salary: salaryDefaults['Full Time']?.base_salary.toString() ?? '',
        overtime_pay: salaryDefaults['Full Time']?.overtime_pay.toString() ?? '',
        sss: salaryDefaults['Full Time']?.sss.toString() ?? '',
        philhealth: salaryDefaults['Full Time']?.philhealth.toString() ?? '',
        pag_ibig: salaryDefaults['Full Time']?.pag_ibig.toString() ?? '',
        withholding_tax: salaryDefaults['Full Time']?.withholding_tax.toString() ?? '',
        college_program: '', // NEW
    });

    const [collegeProgram, setCollegeProgram] = useState('');
    const [collegeProgramError, setCollegeProgramError] = useState('');
    const collegeDeptRef = useRef<HTMLDivElement>(null);

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
        const cleanedData = {
            ...data,
            base_salary: Number(data.base_salary.replace(/,/g, '')) || 0,
            overtime_pay: Number(data.overtime_pay.replace(/,/g, '')) || 0,
            sss: Number(data.sss.replace(/,/g, '')) || 0,
            philhealth: Number(data.philhealth.replace(/,/g, '')) || 0,
            pag_ibig: Number(data.pag_ibig.replace(/,/g, '')) || 0,
            withholding_tax: Number(data.withholding_tax.replace(/,/g, '')) || 0,
        };
        post(route('employees.store'), cleanedData);
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
        const def = salaryDefaults[data.employee_type];
        if (def) {
            setData('base_salary', def.base_salary.toString());
            setData('overtime_pay', def.overtime_pay.toString());
            setData('sss', def.sss.toString());
            setData('philhealth', def.philhealth.toString());
            setData('pag_ibig', def.pag_ibig.toString());
            setData('withholding_tax', def.withholding_tax.toString());
        }
    }, [data.employee_type, salaryDefaults]);

    // When collegeProgram changes, sync to form state
    useEffect(() => {
        setData('college_program', collegeProgram);
    }, [collegeProgram]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Employees" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                <div className='w-2/5 p-4'>
                    <div>
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
                                Go Back
                            </Button>
                        </Link>
                    </div>
                    <form
                        className='container mx-auto mt-5 space-y-6'
                        onSubmit={handleSubmit}
                    >
                        {/* Employee Information */}
                        <h1 className='font-bold text-xl mb-4'>Employee Information</h1>
                        <div className='space-y-6'>
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="employee_name">
                                    Employee Name
                                </Label>
                                <Input
                                    id="employee_name"
                                    type="text"
                                    required
                                    placeholder="Name"
                                    value={data.employee_name}
                                    onChange={(e) => setData('employee_name', e.target.value)}
                                />
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
                        {/* Employee Salary */}
                        <h1 className='font-bold text-xl my-2'>Employee Salary</h1>
                        <div className='flex flex-row gap-6'>
                            <div className='earnings space-y-6'>
                                <h2 className='font-semibold text-lg my-2'>Earnings</h2>
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
                                            pattern="[0-9,]*"
                                            required
                                            placeholder="Salary"
                                            className="pl-8"
                                            min={0}
                                            onBeforeInput={(e: React.FormEvent<HTMLInputElement> & InputEvent) => {
                                                // Prevent non-numeric and non-comma input
                                                if (!/[\d,]/.test((e as InputEvent).data ?? '')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onInput={e => {
                                                const input = e.target as HTMLInputElement;
                                                let value = input.value.replace(/,/g, '');
                                                if (value && Number(value) < 0) {
                                                    value = '0';
                                                }
                                                if (value) {
                                                    input.value = Number(value).toLocaleString();
                                                } else {
                                                    input.value = '';
                                                }
                                            }}
                                            value={data.base_salary ? Number(data.base_salary.replace(/,/g, '')).toLocaleString() : ''}
                                            onChange={(e) => setData('base_salary', e.target.value.replace(/,/g, ''))}
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
                                            pattern="[0-9,]*"
                                            required
                                            placeholder="Overtime Pay"
                                            className="pl-8"
                                            min={0}
                                            onBeforeInput={(e: React.FormEvent<HTMLInputElement> & InputEvent) => {
                                                // Prevent non-numeric and non-comma input
                                                if (!/[\d,]/.test((e as InputEvent).data ?? '')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onInput={e => {
                                                const input = e.target as HTMLInputElement;
                                                let value = input.value.replace(/,/g, '');
                                                if (value && Number(value) < 0) {
                                                    value = '0';
                                                }
                                                if (value) {
                                                    input.value = Number(value).toLocaleString();
                                                } else {
                                                    input.value = '';
                                                }
                                            }}
                                            value={data.overtime_pay ? Number(data.overtime_pay.replace(/,/g, '')).toLocaleString() : ''}
                                            onChange={(e) => setData('overtime_pay', e.target.value.replace(/,/g, ''))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className='contributions space-y-6'>
                                <h2 className='font-semibold text-lg my-2'>Contributions</h2>
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
                                            pattern="[0-9,]*"
                                            required
                                            placeholder="SSS"
                                            className="pl-8"
                                            min={0}
                                            onBeforeInput={(e: React.FormEvent<HTMLInputElement> & InputEvent) => {
                                                // Prevent non-numeric and non-comma input
                                                if (!/[\d,]/.test((e as InputEvent).data ?? '')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onInput={e => {
                                                const input = e.target as HTMLInputElement;
                                                let value = input.value.replace(/,/g, '');
                                                if (value && Number(value) < 0) {
                                                    value = '0';
                                                }
                                                if (value) {
                                                    input.value = Number(value).toLocaleString();
                                                } else {
                                                    input.value = '';
                                                }
                                            }}
                                            value={data.sss ? Number(data.sss.replace(/,/g, '')).toLocaleString() : ''}
                                            onChange={(e) => setData('sss', e.target.value.replace(/,/g, ''))}
                                        />
                                    </div>
                                </div>
                                <div className='flex flex-col gap-3'>
                                    <Label htmlFor="philhealth">
                                        PhilHealth
                                    </Label>
                                    <div className='relative'>
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">₱</span>
                                        <Input
                                            id="philhealth"
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9,]*"
                                            required
                                            placeholder="PhilHealth"
                                            className="pl-8"
                                            min={0}
                                            onBeforeInput={(e: React.FormEvent<HTMLInputElement> & InputEvent) => {
                                                // Prevent non-numeric and non-comma input
                                                if (!/[\d,]/.test((e as InputEvent).data ?? '')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onInput={e => {
                                                const input = e.target as HTMLInputElement;
                                                let value = input.value.replace(/,/g, '');
                                                if (value && Number(value) < 0) {
                                                    value = '0';
                                                }
                                                if (value) {
                                                    input.value = Number(value).toLocaleString();
                                                } else {
                                                    input.value = '';
                                                }
                                            }}
                                            value={data.philhealth ? Number(data.philhealth.replace(/,/g, '')).toLocaleString() : ''}
                                            onChange={(e) => setData('philhealth', e.target.value.replace(/,/g, ''))}
                                        />
                                    </div>
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
                                            pattern="[0-9,]*"
                                            required
                                            placeholder="Pag-IBIG"
                                            className="pl-8"
                                            min={0}
                                            onBeforeInput={(e: React.FormEvent<HTMLInputElement> & InputEvent) => {
                                                // Prevent non-numeric and non-comma input
                                                if (!/[\d,]/.test((e as InputEvent).data ?? '')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onInput={e => {
                                                const input = e.target as HTMLInputElement;
                                                let value = input.value.replace(/,/g, '');
                                                if (value && Number(value) < 0) {
                                                    value = '0';
                                                }
                                                if (value) {
                                                    input.value = Number(value).toLocaleString();
                                                } else {
                                                    input.value = '';
                                                }
                                            }}
                                            value={data.pag_ibig ? Number(data.pag_ibig.replace(/,/g, '')).toLocaleString() : ''}
                                            onChange={(e) => setData('pag_ibig', e.target.value.replace(/,/g, ''))}
                                        />
                                    </div>
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
                                            className="pl-8"
                                            inputMode="numeric"
                                            pattern="[0-9,]*"
                                            min={0}
                                            onBeforeInput={(e: React.FormEvent<HTMLInputElement> & InputEvent) => {
                                                // Prevent non-numeric and non-comma input
                                                if (!/[\d,]/.test((e as InputEvent).data ?? '')) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onInput={e => {
                                                const input = e.target as HTMLInputElement;
                                                let value = input.value.replace(/,/g, '');
                                                if (value && Number(value) < 0) {
                                                    value = '0';
                                                }
                                                if (value) {
                                                    input.value = Number(value).toLocaleString();
                                                } else {
                                                    input.value = '';
                                                }
                                            }}
                                            value={data.withholding_tax ? Number(data.withholding_tax.replace(/,/g, '')).toLocaleString() : ''}
                                            onChange={(e) => setData('withholding_tax', e.target.value.replace(/,/g, ''))}
                                        />
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

