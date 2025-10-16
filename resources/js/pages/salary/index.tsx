import { Head, router, usePage } from '@inertiajs/react'
import { calculateSSS } from '@/utils/salaryFormulas'
import AppLayout from '@/layouts/app-layout'
import { EmployeeType } from '@/components/employee-type'
import { EmployeeSalaryEdit } from '@/components/employee-salary-edit'
import { type BreadcrumbItem } from '@/types'
import { Wallet, Pencil, Calculator, Lightbulb, TrendingUp } from 'lucide-react'
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
import ThirteenthMonthPayDialog from '@/components/thirtheen-month-pay-dialog'
import { PayrollMonthPicker } from '@/components/ui/payroll-month-picker'

type Defaults = {
  employee_type: string
  base_salary: number
  college_rate: number
  overtime_pay: number
  sss: number
  philhealth: number
  pag_ibig: number
  withholding_tax: number
  work_hours_per_day: number
}

type FlashObject = { type: string; message: string };
type PageProps = {
  flash?: string | FlashObject;
  errors: Record<string, string>;
  types: string[];
  selected: string;
  defaults: Defaults;
}

export default function Index() {
  const { flash, errors, types, selected, defaults } = usePage<PageProps>().props
  const [type, setType] = useState(selected || types[0])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [isRunningPayroll, setIsRunningPayroll] = useState(false)
  const [isThirteenthMonthDialogOpen, setIsThirteenthMonthDialogOpen] = useState(false);

  useEffect(() => setType(selected || types[0]), [selected, types])
  useEffect(() => {
    if (!flash) return;
    if (typeof flash === 'string') {
      if (flash === 'Payroll already run twice for this month.') {
        toast.info(flash);
      } else {
        toast.success(flash);
      }
    } else if (typeof flash === 'object' && flash !== null) {
      if (flash.type === 'error') {
        if (flash.message && flash.message.toLowerCase().includes('no time keeping data')) {
          toast.error('Some employees have no time keeping data. Please check time keeping records before running payroll.');
        } else {
          toast.error(flash.message || 'An error occurred');
        }
      } else if (flash.type === 'success') {
        toast.success(flash.message || 'Success');
      } else if (flash.message === 'Payroll already run twice for this month.') {
        toast.info(flash.message);
      } else {
        toast(flash.message || 'Notification');
      }
    }
  }, [flash])

  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
    }
  }, [errors]);

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
    if (!selectedMonth) {
      toast.error('Please select a date first')
      return
    }
    setIsRunningPayroll(true)
    router.post(
      route('payroll.run'),
      { payroll_date: selectedMonth },
      {
        preserveState: false,
        onFinish: () => setIsRunningPayroll(false),
      }
    )
  }, [selectedMonth])

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Salary Management', href: route('salary.index') },
  ]

  const cards = [
    { key: 'base_salary' as keyof Defaults, label: 'Base Salary', value: defaults.base_salary, isEarning: true },
    { key: 'college_rate' as keyof Defaults, label: 'Rate Per Hour', value: defaults.college_rate, isEarning: true },
    { key: 'sss' as keyof Defaults, label: 'SSS', value: calculateSSS(defaults.base_salary), isEarning: false },
    { key: 'philhealth' as keyof Defaults, label: 'PhilHealth', value: defaults.philhealth, isEarning: false },
    { key: 'pag_ibig' as keyof Defaults, label: 'Pag-IBIG', value: defaults.pag_ibig, isEarning: false },
    { key: 'withholding_tax' as keyof Defaults, label: 'Withholding Tax', value: defaults.withholding_tax, isEarning: false },
  ] as const

  const earningsCards = cards.filter(c => c.isEarning)
  const deductionCards = cards.filter(c => !c.isEarning)

  const allTypes = [
    { value: 'Full Time', label: 'Full Time' },
    { value: 'Part Time', label: 'Part Time' },
    { value: 'Provisionary', label: 'Provisionary' },
    { value: 'Regular', label: 'Regular' },
  ];

  return (
    <>
      <Head title="Salary Management" />
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="py-6 px-8 space-y-6">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 dark:bg-primary p-3 rounded-full border border-primary/20 dark:border-primary">
                <Wallet className="h-6 w-6 text-primary dark:text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Salary Management</h1>
                <p className="text-muted-foreground">Set default salary values by employee type and run payroll.</p>
              </div>
            </div>

            {/* Right side: Payroll and 13th Month Buttons */}
            <div className="flex items-center gap-4">
              {/* Run Payroll Group */}
              <div className="flex items-center gap-2">
                <PayrollMonthPicker
                  value={selectedMonth}
                  onValueChange={setSelectedMonth}
                  placeholder="Select payroll month"
                />
                <Button
                  onClick={handleRunPayroll}
                  disabled={!selectedMonth || isRunningPayroll}
                  className="flex items-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  {isRunningPayroll ? 'Running...' : 'Run Payroll'}
                </Button>
              </div>

              {/* 13th Month Button */}
              <Button
                onClick={() => setIsThirteenthMonthDialogOpen(true)}
                variant="secondary"
                className="flex items-center gap-2 transition-transform duration-150 hover:scale-[1.03]"
              >
                <TrendingUp className="w-4 h-4" />
                13th Month Pay
              </Button>

            </div>
          </div>
          <EmployeeType value={type} onChange={onTypeChange} types={allTypes} />

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
                        {(() => {
                          const num = Number(value);
                          return `₱${isNaN(num) ? '0.00' : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        })()}
                      </p>
                      <EmployeeSalaryEdit
                        employeeType={type}
                        field={key}
                        label={label}
                        value={value}
                      />
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
      {/* DIALOG COMPONENT INTEGRATION */}
      <ThirteenthMonthPayDialog
        isOpen={isThirteenthMonthDialogOpen}
        onClose={() => setIsThirteenthMonthDialogOpen(false)}
      />
    </>
  )
}