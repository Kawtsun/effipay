// pages/employees/index.tsx
import { useState, useEffect, useCallback } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import EmployeeSearch from '@/components/employee-search'
import EmployeeDelete from '@/components/employee-delete'
import EmployeePagination from '@/components/employee-pagination'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { BreadcrumbItem, Employees } from '@/types'

type Flash = { success?: string }
type PageProps = { flash?: Flash }

interface EmployeesProps {
  employees: Employees[]
  currentPage: number
  totalPages: number
  search?: string
}

export default function Index({
  employees,
  currentPage,
  totalPages,
  search: initialSearch = '',
}: EmployeesProps) {
  const { props } = usePage<PageProps>()
  const [open, setOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employees | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState(initialSearch)

  useEffect(() => {
    if (props.flash?.success) {
      toast.success(props.flash.success)
    }
  }, [props.flash])

  // Core Inertia visit helper
  const visit = useCallback(
    (params: Record<string, any>, options: { preserve?: boolean } = {}) => {
      setLoading(true)
      router.visit(route('employees.index'), {
        method: 'get',
        data: params,
        preserveState: options.preserve ?? false,
        preserveScroll: true,
        only: ['employees', 'currentPage', 'totalPages', 'search'],
        onFinish: () => setLoading(false),
      })
    },
    []
  )

  // 1) Auto-search: preserveState true so input stays focused
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term)
      visit({ search: term || undefined, page: 1 }, { preserve: true })
    },
    [visit]
  )

  // 2) Pagination: replace state so page/rows update cleanly
  const handlePageChange = useCallback(
    (page: number) => {
      visit({ search: searchTerm || undefined, page }, { preserve: false })
    },
    [searchTerm, visit]
  )

  const handleDeleteClick = (emp: Employees) => {
    setSelectedEmployee(emp)
    setOpen(true)
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employees', href: '/employees' },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Employees" />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="p-4 flex flex-col" style={{ height: 600 }}>
          <EmployeeSearch
            initialSearch={searchTerm}
            onSearch={handleSearch}
          />

          <div className="flex justify-end mb-2">
            <Link href={route('employees.create')}>
              <Button>Add Employee</Button>
            </Link>
          </div>

          <div className="flex flex-col flex-1">
            <div className="flex-1 flex flex-col overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center">
                        <Loader2 className="inline-block h-6 w-6 animate-spin mr-2" />
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : employees.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No employees found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map(emp => (
                      <TableRow key={emp.id}>
                        <TableCell>{emp.id}</TableCell>
                        <TableCell>{emp.employee_name}</TableCell>
                        <TableCell>{emp.employee_type}</TableCell>
                        <TableCell>{emp.employee_status}</TableCell>
                        <TableCell className="flex gap-4">
                          <Link
                            className={buttonVariants({ variant: 'default' })}
                            href={route('employees.edit', { employee: emp.id })}
                          >
                            Edit
                          </Link>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteClick(emp)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <EmployeeDelete
              open={open}
              setOpen={setOpen}
              employee={selectedEmployee}
            />

            <div className="flex justify-center mt-4">
              <EmployeePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                searchTerm={searchTerm}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
