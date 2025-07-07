// pages/employees/index.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import EmployeeSearch from '@/components/employee-search'
import EmployeeDelete from '@/components/employee-delete'
import EmployeePagination from '@/components/employee-pagination'
import EmployeeFilter from '@/components/employee-filter'
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
import { cn } from "@/lib/utils"

type Flash = { success?: string }
type PageProps = { flash?: Flash }

interface EmployeesProps {
    employees: Employees[]
    currentPage: number
    totalPages: number
    search?: string
}

type FilterState = { types: string[]; statuses: string[] }

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

    // Draft vs. applied filters
    const [filters, setFilters] = useState<FilterState>({ types: [], statuses: [] })
    const [appliedFilters, setAppliedFilters] = useState<FilterState>({ types: [], statuses: [] })
    const hasFilters = appliedFilters.types.length > 0 || appliedFilters.statuses.length > 0

    // Show toast & clear flash on mount
    // useEffect(() => {
    //     if (props.flash?.success) {
    //         toast.success(props.flash.success)
    //         setTimeout(() => {
    //             router.visit(window.location.pathname, {
    //                 only: [],
    //                 preserveState: true,
    //                 preserveScroll: true,
    //             })
    //         }, 100)
    //     }
    // }, [props.flash])

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success)
        }
    }, [props.flash])






    // “visit” helper must be declared before any calls to it
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

    // Search — include applied filters so search + filters work together
    const handleSearch = useCallback(
        (term: string) => {
            setSearchTerm(term)
            visit(
                {
                    search: term || undefined,
                    page: 1,
                    types: hasFilters ? appliedFilters.types : undefined,
                    statuses: hasFilters ? appliedFilters.statuses : undefined,
                },
                { preserve: true }
            )
        },
        [visit, appliedFilters, hasFilters]
    )

    // User clicks “Apply” inside popover
    const handleFilterChange = useCallback(
        (newFilters: FilterState) => {
            setFilters(newFilters)
            setAppliedFilters(newFilters)
            visit(
                {
                    search: searchTerm || undefined,
                    page: 1,
                    types: newFilters.types.length ? newFilters.types : undefined,
                    statuses: newFilters.statuses.length ? newFilters.statuses : undefined,
                },
                { preserve: true }
            )
        },
        [visit, searchTerm]
    )

    // Dedicated page‐level Reset button
    const resetFilters = useCallback(() => {
        const empty = { types: [], statuses: [] }
        setFilters(empty)
        setAppliedFilters(empty)
        visit({ search: searchTerm || undefined, page: 1 }, { preserve: true })
    }, [visit, searchTerm])

    // Pagination handler respects applied filters
    const handlePage = useCallback(
        (page: number) => {
            visit(
                {
                    search: searchTerm || undefined,
                    page,
                    types: appliedFilters.types.length ? appliedFilters.types : undefined,
                    statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
                },
                { preserve: true }
            )
        },
        [visit, searchTerm, appliedFilters]
    )

    const handleDelete = (emp: Employees) => {
        setSel(emp)
        setOpen(true)
    }

    const crumbs: BreadcrumbItem[] = [{ title: 'Employees', href: '/employees' }]

    return (
        <AppLayout breadcrumbs={crumbs}>
            <Head title="Employees" />

            <div className="flex flex-col h-full overflow-hidden p-6 gap-4">
                {/* HEADER */}
                <div className="flex-none">
                    <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2 text-foreground">
                        <Users className="h-6 w-6 text-primary" />
                        Employees
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your organization’s employee type, status, and salary.
                    </p>
                </div>

                {/* SEARCH & CONTROLS */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        {/* Search Input */}
                        <div className="flex-1 min-w-[200px]">
                            <EmployeeSearch
                                initialSearch={searchTerm}
                                onSearch={handleSearch}
                            />
                        </div>

                        {/* Reset / Filter / Add */}
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "transition-all duration-200 ease-in-out",
                                    hasFilters
                                        ? "opacity-100 translate-y-0"
                                        : "opacity-0 -translate-y-1 pointer-events-none"
                                )}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                >
                                    Reset Filters
                                </Button>
                            </div>

                            <EmployeeFilter
                                selectedTypes={filters.types}
                                selectedStatuses={filters.statuses}
                                onChange={handleFilterChange}
                                isActive={hasFilters}
                            />


                            <Link href={route('employees.create')}>
                                <Button className="whitespace-nowrap">
                                    Add Employee
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Active Filters Preview */}
                    <div
                        className={cn(
                            "text-xs text-muted-foreground text-right transition-all duration-200 ease-in-out",
                            hasFilters
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 -translate-y-1 pointer-events-none"
                        )}
                    >
                        Showing: {appliedFilters.types.join(', ') || 'All Types'} / {appliedFilters.statuses.join(', ') || 'All Statuses'}
                    </div>
                </div>

                {/* TABLE & PAGINATION */}
                <div className="relative flex-1 flex flex-col overflow-auto">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-black/70 flex items-center justify-center z-10 transition-opacity duration-300">
                            <Loader2 className="h-16 w-16 animate-spin text-green-600 dark:text-green-400" />
                        </div>
                    )}

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Employee ID</TableHead>
                                <TableHead>Employee Name</TableHead>
                                <TableHead>Employee Type</TableHead>
                                <TableHead>Employee Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {employees.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <>
                                    {employees.map(emp => (
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
                                                    href={route('employees.edit', {
                                                        employee: emp.id, // ✅ singular
                                                        search: searchTerm || undefined,
                                                        types: appliedFilters.types.length ? appliedFilters.types : undefined,
                                                        statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
                                                        page: currentPage,
                                                    })}
                                                    preserveState
                                                    className={buttonVariants({ variant: 'default' })}
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
                        search={searchTerm}
                        filters={appliedFilters}
                        page={currentPage}
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
