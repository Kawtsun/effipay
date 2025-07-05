// pages/employees/index.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
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
import { Loader2, Users } from 'lucide-react'
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

const MIN_SPINNER_MS = 500
const MAX_ROWS = 10
const ROW_HEIGHT = 53 // px

export default function Index({
    employees,
    currentPage,
    totalPages,
    search: initialSearch = '',
}: EmployeesProps) {
    const { props } = usePage<PageProps>()
    const [open, setOpen] = useState(false)
    const [sel, setSel] = useState<Employees | null>(null)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState(initialSearch)
    const spinnerStart = useRef<number>(0)

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success)
    }, [props.flash])

    const visit = useCallback(
        (params: Record<string, any>, options: { preserve?: boolean } = {}) => {
            spinnerStart.current = Date.now()
            setLoading(true)

            router.visit(route('employees.index'), {
                method: 'get',
                data: params,
                preserveState: options.preserve ?? false,
                preserveScroll: true,
                only: ['employees', 'currentPage', 'totalPages', 'search'],
                onFinish: () => {
                    const elapsed = Date.now() - spinnerStart.current
                    const wait = Math.max(0, MIN_SPINNER_MS - elapsed)
                    setTimeout(() => setLoading(false), wait)
                },
            })
        },
        []
    )

    const handleSearch = useCallback(
        (term: string) => {
            setSearchTerm(term)
            visit({ search: term || undefined, page: 1 }, { preserve: true })
        },
        [visit]
    )

    const handlePage = useCallback(
        (page: number) => {
            visit({ search: searchTerm || undefined, page }, { preserve: true }) // 👈 preserve state
        },
        [searchTerm, visit]
    )


    const handleDelete = (emp: Employees) => {
        setSel(emp)
        setOpen(true)
    }

    const crumbs: BreadcrumbItem[] = [
        { title: 'Employees', href: '/employees' },
    ]

    return (
        <AppLayout breadcrumbs={crumbs}>
            <Head title="Employees" />
            <div className="flex flex-col h-full gap-4 p-6">
                <div className="mb-2">
                    <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2 text-foreground">
                        <Users className="h-6 w-6 text-primary" />
                        Employees
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your organization’s employee type, status, and salary.
                    </p>
                </div>
                <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <EmployeeSearch
                            initialSearch={searchTerm}
                            onSearch={handleSearch}
                        />
                    </div>

                    <Link href={route('employees.create')}>
                        <Button className="whitespace-nowrap">Add Employee</Button>
                    </Link>
                </div>


                <div className="relative flex-1 flex flex-col overflow-auto">
                    {/* Loading overlay */}
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-black/70 flex items-center justify-center z-10 transition-opacity duration-300">
                            <Loader2 className="h-16 w-16 animate-spin text-green-600 dark:text-green-400" />
                        </div>
                    )}

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
                            {employees.length === 0 && !loading ? (
                                <TableRow className="transition-opacity duration-300 opacity-100">
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {employees.map((emp) => (
                                        <TableRow
                                            key={emp.id}
                                            className={`transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'
                                                }`}
                                        >
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
                                                    onClick={() => handleDelete(emp)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* Pad empty rows to keep table height consistent */}
                                    {Array.from({ length: Math.max(0, MAX_ROWS - employees.length) }).map((_, i) => (
                                        <TableRow key={`empty-${i}`}>
                                            <TableCell colSpan={5} style={{ height: ROW_HEIGHT }} />
                                        </TableRow>
                                    ))}
                                </>
                            )}
                        </TableBody>
                    </Table>

                    <EmployeeDelete
                        open={open}
                        setOpen={setOpen}
                        employee={sel}
                    />

                    <div className="flex justify-center mt-4 min-h-[56px]">
                        <EmployeePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePage}
                            searchTerm={searchTerm}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
