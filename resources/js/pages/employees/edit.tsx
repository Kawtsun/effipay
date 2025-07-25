import { EmployeeStatus } from '@/components/employee-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Employees, type BreadcrumbItem } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { EmployeeType } from '@/components/employee-type';
import { Checkbox } from '@/components/ui/checkbox';
import EmployeeCollegeRadioDepartment from '@/components/employee-college-radio-department';
import EmployeeInstructorRadioRole from '@/components/employee-instructor-radio-role';
import { AnimatePresence, motion } from 'framer-motion';

type Props = {
    employee: Employees
    search: string
    filters: { types: string[]; statuses: string[]; category?: string }
    page: number
    employeeCategory?: string
}

export default function Edit({ employee, search, filters, page, employeeCategory = 'Teaching' }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employees',
            href: '/employees',
        },
        {
            title: `#${employee.id} - ${employee.employee_name}`,
            href: route('employees.edit', { employee: employee.id }),
        },
    ];

    const { data, setData, put } = useForm({
        employee_name: employee.employee_name ?? '',
        employee_type: employee.employee_type ?? 'Full Time',
        employee_status: employee.employee_status ?? 'Active',
        roles: employee.roles ?? '',
        base_salary: employee.base_salary?.toString() ?? '',
        overtime_pay: employee.overtime_pay?.toString() ?? '',
        sss: employee.sss?.toString() ?? '',
        philhealth: employee.philhealth?.toString() ?? '',
        pag_ibig: employee.pag_ibig?.toString() ?? '',
        withholding_tax: employee.withholding_tax?.toString() ?? '',
        college_program: employee.college_program ?? '', // NEW
    });
    const [collegeProgram, setCollegeProgram] = useState(data.college_program);
    const [collegeProgramError, setCollegeProgramError] = useState('');
    // When collegeProgram changes, sync to form state
    useEffect(() => {
        setData('college_program', collegeProgram);
    }, [collegeProgram]);

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.roles.split(',').includes('college instructor') && !collegeProgram) {
            setCollegeProgramError('Please select a college department/program.');
            return;
        } else {
            setCollegeProgramError('');
        }
        const cleanedData = {
            ...data,
            base_salary: data.base_salary.replace(/,/g, '') === '' ? 0 : parseInt(data.base_salary.replace(/,/g, ''), 10),
            overtime_pay: data.overtime_pay.replace(/,/g, '') === '' ? 0 : parseInt(data.overtime_pay.replace(/,/g, ''), 10),
            sss: data.sss.replace(/,/g, '') === '' ? 0 : parseInt(data.sss.replace(/,/g, ''), 10),
            philhealth: data.philhealth.replace(/,/g, '') === '' ? 0 : parseInt(data.philhealth.replace(/,/g, ''), 10),
            pag_ibig: data.pag_ibig.replace(/,/g, '') === '' ? 0 : parseInt(data.pag_ibig.replace(/,/g, ''), 10),
            withholding_tax: data.withholding_tax.replace(/,/g, '') === '' ? 0 : parseInt(data.withholding_tax.replace(/,/g, ''), 10),
        };
        put(
            route('employees.update', { employee: employee.id }),
            {
                data: {
                    ...cleanedData,
                    search,
                    category: employeeCategory,
                    types: filters.types,
                    statuses: filters.statuses,
                    collegeProgram: filters.collegeProgram, // preserve college program filter
                    page,
                },
                preserveScroll: true
            }
        );
    };

    const rolesArr = data.roles ? data.roles.split(',') : [];
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

    useEffect(() => {
        const rolesArr = data.roles ? data.roles.split(',') : [];
        if (rolesArr.length > 0) {
            if (!data.employee_type && availableTypes[0]?.value) {
                setData('employee_type', availableTypes[0].value);
            }
            // Only set to 'Active' if there is no current value
            if (!data.employee_status) {
                setData('employee_status', 'Active');
            }
        }
        // Only run when roles change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.roles]);

    const collegeDeptRef = useRef<HTMLDivElement>(null);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Employee" />
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
                                <ArrowLeft className='w-4 h-4'/>
                                Go Back
                            </Button>
                        </Link>

                    </div>
                    <form
                        className='container mx-auto mt-5 space-y-6'
                        onSubmit={handleUpdate}
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
                                <Label htmlFor="employee_type">
                                    Employee Type
                                </Label>
                                <EmployeeType
                                    value={data.employee_type}
                                    onChange={val => setData('employee_type', val)}
                                    roles={data.roles ? data.roles.split(',') : []}
                                    disabled={data.roles === ''}
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="employee_status">
                                    Employee Status
                                </Label>
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
                            <Button type='submit'>Update Employee</Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
