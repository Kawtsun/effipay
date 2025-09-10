// resources/js/Pages/salary/index.tsx

import { Head, router, usePage } from '@inertiajs/react'
import { calculateSSS } from '@/utils/salaryFormulas'
import AppLayout from '@/layouts/app-layout'
import { EmployeeType } from '@/components/employee-type'
import { EmployeeSalaryEdit } from '@/components/employee-salary-edit'
import { type BreadcrumbItem } from '@/types'
import { Wallet, Pencil, Calculator, Lightbulb } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

// shadcn Card imports
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PayrollDatePicker } from '@/components/ui/payroll-date-picker'

type Defaults = {
  employee_type: string
  base_salary: number
  overtime_pay: number
  sss: number
  philhealth: number
  pag_ibig: number
  withholding_tax: number
  work_hours_per_day: number
}

type PageProps = {
  flash?: string
  types: string[]
  selected: string
  defaults: Defaults
}

export default function Index() {
  const { flash, types, selected, defaults } = usePage<PageProps>().props
  const [type, setType] = useState(selected || types[0])
  const [selectedDate, setSelectedDate] = useState('')
  const [isRunningPayroll, setIsRunningPayroll] = useState(false)

  useEffect(() => setType(selected || types[0]), [selected, types])
  useEffect(() => { if (flash) toast.success(flash) }, [flash])

  const onTypeChange = useCallback((val: string) => {
    setType(val)
    if (!val && types[0]) setType(types[0])
    router.get(
      route('salary.index'),
      { type: val || types[0] },
      { preserveState: true, preserveScroll: true }
    )
  }, [types])

  const handleRunPayroll = useCallback(async () => {
    if (!selectedDate) {
      toast.error('Please select a date first')
      return
    }
    setIsRunningPayroll(true)
    router.post(
      route('payroll.run'),
      { payroll_date: selectedDate },
      {
        preserveState: true,
        onFinish: () => setIsRunningPayroll(false),
      }
    )
  }, [selectedDate])

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Salary', href: route('salary.index') },
  ]

  const cards = [
  { key: 'base_salary' as keyof Defaults, label: 'Base Salary', value: defaults.base_salary, isEarning: true },
  { key: 'sss' as keyof Defaults, label: 'SSS', value: calculateSSS(defaults.base_salary), isEarning: false },
  { key: 'philhealth' as keyof Defaults, label: 'PhilHealth', value: defaults.philhealth, isEarning: false },
  { key: 'pag_ibig' as keyof Defaults, label: 'Pag-IBIG', value: defaults.pag_ibig, isEarning: false },
  { key: 'withholding_tax' as keyof Defaults, label: 'Withholding Tax', value: defaults.withholding_tax, isEarning: false },
  ] as const

  const earningsCards = cards.filter(c => c.isEarning)
  const deductionCards = cards.filter(c => !c.isEarning)
  // Calculate total compensation
  // const totalCompensation =
  //   Number(defaults.base_salary) -
  //   (Number(calculateSSS(defaults.base_salary)) + Number(defaults.pag_ibig) + Number(defaults.philhealth));

  const allTypes = [
    { value: 'Full Time', label: 'Full Time' },
    { value: 'Part Time', label: 'Part Time' },
    { value: 'Provisionary', label: 'Provisionary' },
    { value: 'Regular', label: 'Regular' },
  ];

  return (
    <>
      <Head title="Salary Defaults" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="py-6 px-8 space-y-6">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold">
                <Wallet className="w-6 h-6 text-primary" />
                Salary
              </h1>
              <p className="text-sm text-muted-foreground">
                Set default salary values by employee type.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <PayrollDatePicker
                  value={selectedDate}
                  onValueChange={setSelectedDate}
                  placeholder="Select payroll date"
                />
                <Button
                  onClick={handleRunPayroll}
                  disabled={!selectedDate || isRunningPayroll}
                  className="flex items-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  {isRunningPayroll ? 'Running...' : 'Run Payroll'}
                </Button>
              </div>
              
            </div>
          </div>
          <EmployeeType value={type} onChange={onTypeChange} types={allTypes} />

          {/* Total Compensation Box */}
          {/* <div className="mb-8">
            <label className="block text-sm font-medium mb-2">Total Compensation</label>
            <input
              type="text"
              value={`₱${totalCompensation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              readOnly
              className="w-64 px-3 py-2 border rounded bg-gray-900 text-green-500 font-bold text-xl"
            />
          </div> */}

          {/* EARNINGS */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Earnings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {earningsCards.map(({ key, label, value }) => {
                return (
                  <Card
                    key={key}
                    className="h-full shadow-none hover:shadow-lg transition-shadow rounded-lg select-none"
                  >
                    <CardHeader className="flex items-center justify-between pb-2">
                      <CardTitle className="text-base">{label}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {type}
                      </span>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <p className="text-3xl font-bold text-green-600">
                        ₱{Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {key === 'withholding_tax' ? (
                        <div className="flex flex-col items-end">
                          <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1 text-right">
                            Automated
                          </p>
                        </div>
                      ) : (
                        <EmployeeSalaryEdit
                          employeeType={type}
                          field={key}
                          label={label}
                          value={value}
                        />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* DEDUCTIONS */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Deductions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {deductionCards.map(({ key, label, value }) => {
                return (
                  <Card
                    key={key}
                    className="h-full shadow-none hover:shadow-lg transition-shadow rounded-lg select-none"
                  >
                    <CardHeader className="flex items-center justify-between pb-2">
                      <CardTitle className="text-base">{label}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {type}
                      </span>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-3xl font-bold text-red-600">
                          ₱{Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      {key === 'philhealth' ? (
                        <div className="flex flex-col items-end">
                          <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Button>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                            <Lightbulb width={18} height={18} color="var(--primary)" fill="var(--primary)" />
                            Automated
                          </p>
                        </div>
                      ) : key === 'withholding_tax' ? (
                        <div className="flex flex-col items-end">
                          <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                            <Pencil className="w-4 h-4" />
                            Edit
                          </Button>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                            <Lightbulb width={18} height={18} color="var(--primary)" fill="var(--primary)" />
                            Automated
                          </p>
                        </div>
                      ) : (
                        <EmployeeSalaryEdit
                          employeeType={type}
                          field={key}
                          label={label}
                          value={value}
                        />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </AppLayout>
    </>
  )
}
