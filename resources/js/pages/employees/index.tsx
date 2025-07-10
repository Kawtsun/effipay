import EmployeeDelete from '@/components/employee-delete'
import EmployeeFilter from '@/components/employee-filter'
import EmployeePagination from '@/components/employee-pagination'
import EmployeeSearch from '@/components/employee-search'
import EmployeeViewDialog from '@/components/employee-view-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import AppLayout from '@/layouts/app-layout'
import { cn } from '@/lib/utils'
import { BreadcrumbItem, Employees } from '@/types'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { Eye, Loader2, Pencil, Plus, Trash, Users } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

type Flash = { success?: string }
type PageProps = { flash?: Flash }

interface EmployeesProps {
    employees: Employees[]
    currentPage: number
    totalPages: number
    search?: string
    filters: { types: string[]; statuses: string[] }
}

type FilterState = { types: string[]; statuses: string[] }

const MIN_SPINNER_MS = 400
const MAX_ROWS = 10
const ROW_HEIGHT = 53 // px

export default function Index({
    employees,
    currentPage,
    totalPages,
    search: initialSearch = '',
    filters: initialFilters,
}: EmployeesProps) {
    const { props } = usePage<PageProps>()
    const [open, setOpen] = useState(false)
    const [sel, setSel] = useState<Employees | null>(null)
    const [viewing, setViewing] = useState<Employees | null>(null)
    const [loading, setLoading] = useState(false)
    const spinnerStart = useRef<number>(0)

    // Local state seeded from props
    const [searchTerm, setSearchTerm] = useState(initialSearch)
    const [filters, setFilters] = useState<FilterState>(initialFilters)
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters)
    const hasFilters = appliedFilters.types.length > 0 || appliedFilters.statuses.length > 0

    // Sync local state when props change (e.g. after delete or redirect)
    const isFirstLoad = useRef(true)

    useEffect(() => {
        if (isFirstLoad.current) {
            setSearchTerm(initialSearch)
            setFilters(initialFilters)
            setAppliedFilters(initialFilters)
            isFirstLoad.current = false
        }
    }, [initialSearch, initialFilters])


    // Show toast on success
    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success)
        }
    }, [props.flash])

    // Visit helper
    const visit = useCallback((params: Record<string, any>, options: { preserve?: boolean } = {}) => {
        spinnerStart.current = Date.now()
        setLoading(true)

        router.visit(route('employees.index'), {
            method: 'get',
            data: params,
            preserveState: options.preserve ?? false,
            preserveScroll: true,
            only: ['employees', 'currentPage', 'totalPages', 'search', 'filters'],
            onFinish: () => {
                const elapsed = Date.now() - spinnerStart.current
                const wait = Math.max(0, MIN_SPINNER_MS - elapsed)
                setTimeout(() => setLoading(false), wait)
            },
        })
    }, [])

    // Search handler
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

    // Filter apply
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

    // Reset filters
    const resetFilters = useCallback(() => {
        const empty = { types: [], statuses: [] }
        setFilters(empty)
        setAppliedFilters(empty)
        visit({ search: searchTerm || undefined, page: 1 }, { preserve: true })
    }, [visit, searchTerm])

    // Pagination
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

    // Delete modal
    const handleDelete = (emp: Employees) => {
        setSel(emp)
        setOpen(true)
    }

    // Breadcrumbs
    const crumbs: BreadcrumbItem[] = [
        {
            title: 'Employees',
            href: route('employees.index', {
                search: initialSearch,
                types: initialFilters.types,
                statuses: initialFilters.statuses,
                page: currentPage,
            }),
        },
    ]

    return (
        <AppLayout breadcrumbs={crumbs}>
            <Head title="Employees" />

            <div className="flex h-full flex-col gap-4 overflow-hidden py-6 px-8">
                {/* HEADER */}
                <div className="flex-none">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                        <Users className="h-6 w-6 text-primary" />
                        Employees
                    </h1>
                    <p className="text-sm text-muted-foreground">Manage your organization’s employee type, status, and salary.</p>
                </div>

                {/* SEARCH & CONTROLS */}
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Search Input */}
                        <div className="min-w-[200px] flex-1">
                            <EmployeeSearch initialSearch={searchTerm} onSearch={handleSearch} />
                        </div>

                        {/* Reset / Filter / Add */}
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    'transition-all duration-200 ease-in-out',
                                    hasFilters ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
                                )}
                            >
                                <Button variant="ghost" size="sm" onClick={resetFilters}>
                                    Reset Filters
                                </Button>
                            </div>

                            <EmployeeFilter
                                selectedTypes={filters.types}
                                selectedStatuses={filters.statuses}
                                onChange={handleFilterChange}
                                isActive={hasFilters}
                            />

                            <Link
                                href={route('employees.create', {
                                    search: searchTerm || undefined,
                                    types: appliedFilters.types.length ? appliedFilters.types : undefined,
                                    statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
                                    page: currentPage,
                                })}
                            >
                                <Button className="flex items-center gap-2 whitespace-nowrap">
                                    <Plus className="w-4 h-4" />
                                    Add Employee
                                </Button>
                            </Link>

                        </div>
                    </div>

                    {/* Active Filters Preview */}
                    <div
                        className={cn(
                            'text-right text-xs text-muted-foreground transition-all duration-200 ease-in-out',
                            hasFilters ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
                        )}
                    >
                        Showing: {appliedFilters.types.join(', ') || 'All Types'} / {appliedFilters.statuses.join(', ') || 'All Statuses'}
                    </div>
                </div>

                {/* TABLE & PAGINATION */}
                <div className="relative flex flex-1 flex-col overflow-auto">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 transition-opacity duration-300 dark:bg-black/70">
                            <Loader2 className="h-16 w-16 animate-spin text-green-600 dark:text-green-400" />
                        </div>
                    )}

                    <Table className='select-none'>
                        <TableHeader className=''>
                            <TableRow className='odd:bg-muted/50 even:bg-background hover:bg-muted transition-colors'>
                                <TableHead className="text-xs font-semibold uppercase  tracking-wide text-left px-4 py-2">Employee ID</TableHead>
                                <TableHead className='text-xs font-semibold uppercase tracking-wide text-left px-4 py-2'>Employee Name</TableHead>
                                <TableHead className='text-xs font-semibold uppercase tracking-wide text-left px-4 py-2'>Employee Type</TableHead>
                                <TableHead className='text-xs font-semibold uppercase  tracking-wide text-left px-4 py-2'>Employee Status</TableHead>
                                <TableHead className='text-right text-xs font-semibold uppercase  tracking-wide px-4 py-2'>Actions</TableHead>
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
                                    {employees.map((emp) => (
                                        <TableRow
                                            key={emp.id}
                                            className={`transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}
                                        >
                                            <TableCell className="w-16 px-4 py-2">{emp.id}</TableCell>
                                            <TableCell className="w-52 px-4 py-2">{emp.employee_name}</TableCell>
                                            <TableCell className="w-36 px-4 py-2">{emp.employee_type}</TableCell>
                                            <TableCell className="w-40 px-4 py-2">{emp.employee_status}</TableCell>
                                            <TableCell className="w-44 px-4 py-2 whitespace-nowrap text-right">
                                                <div className='flex justify-end items-center gap-2'>
                                                    <Button variant="secondary" onClick={() => setViewing(emp)}>
                                                        <Eye />
                                                        View
                                                    </Button>

                                                    <Link
                                                        href={route('employees.edit', {
                                                            employee: emp.id,
                                                            search: searchTerm || undefined,
                                                            types: appliedFilters.types.length ? appliedFilters.types : undefined,
                                                            statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
                                                            page: currentPage,
                                                        })}
                                                        className={buttonVariants({ variant: 'default' })}
                                                    >
                                                        <Pencil />
                                                        Edit
                                                    </Link>


                                                    <Button variant="destructive" onClick={() => handleDelete(emp)}>
                                                        <Trash />
                                                        Delete
                                                    </Button>
                                                </div>

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
                    <EmployeeViewDialog employee={viewing} onClose={() => setViewing(null)} />

                    <EmployeeDelete open={open} setOpen={setOpen} employee={sel} search={searchTerm} filters={appliedFilters} page={currentPage} />

                    <div className="mt-4 flex min-h-[56px] justify-center">
                        <EmployeePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePage} searchTerm={searchTerm} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
