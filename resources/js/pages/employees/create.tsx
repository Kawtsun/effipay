import { EmployeeStatus } from '@/components/employee-status';
import { EmployeeType } from '@/components/employee-type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Add Employee',
        href: '/employees/create',
    },
];

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        employee_name: '',
        employee_type: 'Full Time',
        employee_status: 'Active',
        base_salary: '',
        overtime_pay: '',
        sss: '',
        philhealth: '',
        pag_ibig: '',
        withholding_tax: ''
    });

    // filepath: c:\xampp\htdocs\effipay\resources\js\pages\employees\create.tsx
    // ...existing code...
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanedData = {
            employee_name: data.employee_name,
            employee_type: data.employee_type,
            employee_status: data.employee_status,
            base_salary: data.base_salary.replace(/,/g, '') === '' ? 0 : parseInt(data.base_salary.replace(/,/g, ''), 10),
            overtime_pay: data.overtime_pay.replace(/,/g, '') === '' ? 0 : parseInt(data.overtime_pay.replace(/,/g, ''), 10),
            sss: data.sss.replace(/,/g, '') === '' ? 0 : parseInt(data.sss.replace(/,/g, ''), 10),
            philhealth: data.philhealth.replace(/,/g, '') === '' ? 0 : parseInt(data.philhealth.replace(/,/g, ''), 10),
            pag_ibig: data.pag_ibig.replace(/,/g, '') === '' ? 0 : parseInt(data.pag_ibig.replace(/,/g, ''), 10),
            withholding_tax: data.withholding_tax.replace(/,/g, '') === '' ? 0 : parseInt(data.withholding_tax.replace(/,/g, ''), 10),
        };
        post(route('employees.store'), cleanedData);
    };
    // ...existing code...

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Employees" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                <div className='w-2/5 p-4'>
                    <div>
                        <Link href={route('employees.index')}>
                            <Button>Go Back</Button>
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
                                <Label htmlFor="employee_type">
                                    Employee Type
                                </Label>
                                <EmployeeType
                                    value={data.employee_type}
                                    onChange={val => setData('employee_type', val)}
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

