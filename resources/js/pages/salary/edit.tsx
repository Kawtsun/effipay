import { Head, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { EmployeeType } from '@/components/employee-type'
import { type BreadcrumbItem } from '@/types'
import { Wallet } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EmployeeSalaryEdit } from '@/components/employee-salary-edit'

type Defaults = {
  employee_type: string
  base_salary: number
  overtime_pay: number
  sss: number
  philhealth: number
  pag_ibig: number
  withholding_tax: number
}

type PageProps = {
  flash?: string
  types: string[]
  selected: string
  defaults: Defaults
}

export default function Index() {
  const { flash, types, selected, defaults } = usePage<PageProps>().props
  const [type, setType] = useState(selected)

  // sync server‐side change
  useEffect(() => setType(selected), [selected])
  // flash toast
  useEffect(() => { if (flash) toast.success(flash) }, [flash])

  // on dropdown change → reload defaults
  const onTypeChange = useCallback((val: string) => {
    setType(val)
    router.get(
      route('salary.index'),
      { type: val },
      { preserveState: true, preserveScroll: true }
    )
  }, [])

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Salary', href: route('salary.index') },
  ]

  // six default fields as cards
  const cards = [
    { key: 'base_salary',     label: 'Base Salary',     value: defaults.base_salary },
    { key: 'overtime_pay',    label: 'Overtime Pay',    value: defaults.overtime_pay },
    { key: 'sss',             label: 'SSS Deduction',   value: defaults.sss },
    { key: 'philhealth',      label: 'PhilHealth',      value: defaults.philhealth },
    { key: 'pag_ibig',        label: 'Pag-IBIG',        value: defaults.pag_ibig },
    { key: 'withholding_tax', label: 'Withholding Tax', value: defaults.withholding_tax },
  ] as const

  return (
    <>
      <Head title="Salary Defaults" />

      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="py-6 px-8 space-y-6">
          {/* HEADER + TYPE PICKER */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-semibold">
                <Wallet className="w-6 h-6 text-primary" />
                Salary Defaults
              </h1>
              <p className="text-sm text-muted-foreground">
                Set default payroll values by employee type.
              </p>
            </div>
            <EmployeeType value={type} onChange={onTypeChange} />
          </div>

          {/* CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(({ key, label, value }) => (
              <div
                key={key}
                className="bg-white border rounded-lg shadow-sm p-5 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-medium mb-1">
                    {label} [{type}]
                  </h3>
                  <p className="text-2xl font-semibold">
                    ₱{value.toLocaleString()}
                  </p>
                </div>
                <div className="mt-4 text-right">
                  <EmployeeSalaryEdit
                    employeeType={type}
                    field={key}
                    label={label}
                    value={value}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    </>
  )
}
