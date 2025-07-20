import { EmployeeStatus } from '@/components/employee-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EmployeeCategory } from '@/components/employee-category';
import { EmployeeType } from '@/components/employee-type';
import { Checkbox } from '@/components/ui/checkbox';

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
    employeeCategory = 'Teaching',
}: Props) {
    const [category, setCategory] = useState<string>(employeeCategory);
    const teachingTypes = ['Full Time', 'Part Time', 'Provisionary'];
    const nonTeachingTypes = ['Regular', 'Provisionary'];
    const availableTypes = category === 'Non-Teaching' ? nonTeachingTypes : teachingTypes;
    const defaultType = availableTypes[0];
    const roleOptions = [
        { value: 'administrator', label: 'Administrator' },
        { value: 'college instructor', label: 'College Instructor' },
        { value: 'basic education instructor', label: 'Basic Education Instructor' },
    ];
    const { data, setData, post } = useForm({
        employee_name: '',
        employee_category: category,
        employee_type: defaultType,
        employee_status: 'Active',
        roles: '',
        base_salary: salaryDefaults[defaultType]?.base_salary.toString() ?? '',
        overtime_pay: salaryDefaults[defaultType]?.overtime_pay.toString() ?? '',
        sss: salaryDefaults[defaultType]?.sss.toString() ?? '',
        philhealth: salaryDefaults[defaultType]?.philhealth.toString() ?? '',
        pag_ibig: salaryDefaults[defaultType]?.pag_ibig.toString() ?? '',
        withholding_tax: salaryDefaults[defaultType]?.withholding_tax.toString() ?? '',
    });

    useEffect(() => {
        setData('employee_category', category);
        setData('employee_type', availableTypes[0]);
    }, [category]);

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
    }, [data.employee_type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedData = {
            ...data,
            base_salary: Number(data.base_salary.replace(/,/g, '')) || 0,
            overtime_pay: Number(data.overtime_pay.replace(/,/g, '')) || 0,
            sss: Number(data.sss.replace(/,/g, '')) || 0,
            philhealth: Number(data.philhealth.replace(/,/g, '')) || 0,
            pag_ibig: Number(data.pag_ibig.replace(/,/g, '')) || 0,
            withholding_tax: Number(data.withholding_tax.replace(/,/g, '')) || 0,
        };
        post(
            route('employees.store'),
            {
                ...cleanedData,
                search,
                category,
                types: filters.types,
                statuses: filters.statuses,
                page,
            },
            { preserveScroll: true }
        );
    };

    const handleRoleChange = (role: string) => {
        const rolesArr = data.roles ? data.roles.split(',') : [];
        if (rolesArr.includes(role)) {
            setData('roles', rolesArr.filter(r => r !== role).join(','));
        } else {
            setData('roles', [...rolesArr, role].join(','));
        }
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
                                <Label htmlFor="employee_category">Employee Category</Label>
                                <EmployeeCategory
                                    value={category}
                                    onChange={val => setCategory(val)}
                                />
                            </div>
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
                                <Label htmlFor="employee_type">
                                    Employee Type
                                </Label>
                                <EmployeeType
                                    value={data.employee_type}
                                    onChange={val => setData('employee_type', val)}
                                    types={availableTypes.map(type => ({ value: type, label: type }))}
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="employee_status">
                                    Employee Status
                                </Label>
                                <EmployeeStatus
                                    value={data.employee_status}
                                    onChange={val => setData('employee_status', val)}
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <Label>Roles</Label>
                                <div className="flex flex-col gap-2">
                                    {roleOptions.map(opt => (
                                        <label key={opt.value} className="flex items-center gap-2 text-sm select-none">
                                            <Checkbox
                                                checked={data.roles.split(',').includes(opt.value)}
                                                onCheckedChange={() => handleRoleChange(opt.value)}
                                                className="transition-all duration-200 ease-in-out transform data-[state=checked]:scale-110"
                                            />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
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
                            <Button type='submit'>Add Employee</Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

