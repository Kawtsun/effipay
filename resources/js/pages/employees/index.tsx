import { Head, Link, router, usePage } from '@inertiajs/react'
import { Users, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import EmployeeDelete from '@/components/employee-delete'
import EmployeeFilter from '@/components/employee-filter'
import EmployeeSearch from '@/components/employee-search'
import EmployeeViewDialog from '@/components/employee-view-dialog'
import { Button } from '@/components/ui/button'
import TableEmployee from '@/components/table_employee'
import AppLayout from '@/layouts/app-layout'
import { cn } from '@/lib/utils'
import { BreadcrumbItem, Employees } from '@/types'

type FlashObject = { type: string; message: string }
type Flash = { success?: string } | string | FlashObject
type PageProps = { flash?: Flash }

interface EmployeesProps {
    employees: Employees[]
    currentPage: number
    totalPages: number
    perPage?: number
    search?: string
    filters: { types: string[]; statuses: string[]; roles: string[]; collegeProgram: string; othersRole: string }
    othersRoles?: Array<{ value: string; label: string }>
}

type FilterState = { types: string[]; statuses: string[]; roles: string[]; othersRole?: string }

const MIN_SPINNER_MS = 400
const PAGE_SIZE_STORAGE_KEY = 'employees.table.pageSize'

const COLLEGE_PROGRAMS = [
    { value: 'BSBA', label: 'Bachelor of Science in Business Administration' },
    { value: 'BSA', label: 'Bachelor of Science in Accountancy' },
    { value: 'COELA', label: 'College of Education and Liberal Arts' },
    { value: 'BSCRIM', label: 'Bachelor of Science in Criminology' },
    { value: 'BSCS', label: 'Bachelor of Science in Computer Science' },
    { value: 'JD', label: 'Juris Doctor' },
    { value: 'BSN', label: 'Bachelor of Science in Nursing' },
    { value: 'RLE', label: 'Related Learning Experience' },
    { value: 'CG', label: 'Career Guidance' },
    { value: 'BSPT', label: 'Bachelor of Science in Physical Therapy' },
    { value: 'GSP', label: 'Graduate Studies Programs' },
    { value: 'MBA', label: 'Master of Business Administration' },
]
function getCollegeProgramLabel(acronym: string) {
    const found = COLLEGE_PROGRAMS.find((p) => p.value === acronym)
    return found ? found.label : acronym
}

export default function Index({
    employees,
    currentPage,
    totalPages,
    search: initialSearch = '',
    filters: initialFilters,
}: EmployeesProps & { filters: FilterState & { collegeProgram?: string; othersRole?: string } }) {
    const { props } = usePage<PageProps>()
    const [open, setOpen] = useState(false)
    const [sel, setSel] = useState<Employees | null>(null)
    const [viewing, setViewing] = useState<Employees | null>(null)

    const [loading, setLoading] = useState(true)
    const spinnerStart = useRef<number>(Date.now())
    const [pageSize, setPageSize] = useState<number>(10)

    useEffect(() => {
        const elapsed = Date.now() - spinnerStart.current
        const wait = Math.max(0, MIN_SPINNER_MS - elapsed)
        setTimeout(() => setLoading(false), wait)
    }, [])

    const [searchTerm, setSearchTerm] = useState(initialSearch)
    const toArray = (val: unknown) => (Array.isArray(val) ? val : val ? [val] : [])
    const [filters, setFilters] = useState<FilterState & { collegeProgram?: string; othersRole?: string }>({
        ...initialFilters,
        roles: toArray(initialFilters.roles),
        collegeProgram: typeof initialFilters.collegeProgram !== 'undefined' ? initialFilters.collegeProgram : '',
        othersRole: typeof initialFilters.othersRole !== 'undefined' ? initialFilters.othersRole : '',
    })
    const [appliedFilters, setAppliedFilters] = useState<FilterState & { collegeProgram?: string; othersRole?: string }>({
        ...initialFilters,
        roles: toArray(initialFilters.roles),
        collegeProgram: typeof initialFilters.collegeProgram !== 'undefined' ? initialFilters.collegeProgram : '',
        othersRole: typeof initialFilters.othersRole !== 'undefined' ? initialFilters.othersRole : '',
    })
    const hasFilters = appliedFilters.types.length > 0 || appliedFilters.statuses.length > 0 || appliedFilters.roles.length > 0

    useEffect(() => {
        if (!props.flash) return
        if (typeof props.flash === 'string') {
            toast.success(props.flash)
        } else if (typeof props.flash === 'object' && props.flash !== null) {
            if ('success' in props.flash && props.flash.success) {
                toast.success(props.flash.success)
            } else if ('type' in props.flash && 'message' in props.flash) {
                if (props.flash.type === 'error') {
                    toast.error(props.flash.message || 'An error occurred')
                } else if (props.flash.type === 'success') {
                    toast.success(props.flash.message || 'Success')
                } else {
                    toast(props.flash.message || 'Notification')
                }
            }
        }
    }, [props.flash])

    const visit = useCallback(
        (
            params: Partial<{
                search: string
                page: number
                category: string
                types: string[]
                statuses: string[]
                roles: string[]
                collegeProgram: string
                othersRole: string
                perPage: number
                per_page: number
            }>,
            options: { preserve?: boolean } = {},
        ) => {
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
        },
        [],
    )

    const handleSearch = useCallback(
        (term: string) => {
            setSearchTerm(term)
            visit(
                {
                    search: term || undefined,
                    page: 1,
                    types: hasFilters ? appliedFilters.types : undefined,
                    statuses: hasFilters ? appliedFilters.statuses : undefined,
                    roles: hasFilters ? appliedFilters.roles : undefined,
                    collegeProgram: appliedFilters.collegeProgram || undefined,
                    perPage: pageSize,
                    per_page: pageSize,
                },
                { preserve: true },
            )
        },
        [visit, appliedFilters, hasFilters, pageSize],
    )

    const handleFilterChange = useCallback(
        (newFilters: FilterState & { collegeProgram?: string; othersRole?: string }) => {
            setFilters(newFilters)

            let applied = { ...newFilters }
            let rolesToSend = [...applied.roles]

            if (applied.roles.includes('others') && applied.othersRole) {
                rolesToSend = rolesToSend.filter((r) => r !== 'others')
                rolesToSend.push(applied.othersRole)
            }

            const appliedForUI = { ...applied, roles: rolesToSend }
            setAppliedFilters(appliedForUI)

            visit(
                {
                    search: searchTerm || undefined,
                    page: 1,
                    types: applied.types.length ? applied.types : undefined,
                    statuses: applied.statuses.length ? applied.statuses : undefined,
                    roles: rolesToSend.length ? rolesToSend : undefined,
                    collegeProgram: applied.collegeProgram || undefined,
                    perPage: pageSize,
                    per_page: pageSize,
                },
                { preserve: true },
            )
        },
        [visit, searchTerm, pageSize],
    )

    const resetFilters = useCallback(() => {
        const empty = { types: [], statuses: [], roles: [], othersRole: '' }
        setFilters(empty)
        setAppliedFilters(empty)
        visit({ search: searchTerm || undefined, page: 1, perPage: pageSize, per_page: pageSize }, { preserve: true })
    }, [visit, searchTerm, pageSize])

    const handlePage = useCallback(
        (page: number) => {
            let rolesToSend = [...appliedFilters.roles]
            if (appliedFilters.roles.includes('others') && appliedFilters.othersRole) {
                rolesToSend = rolesToSend.filter((r) => r !== 'others')
                rolesToSend.push(appliedFilters.othersRole)
            }

            visit(
                {
                    search: searchTerm || undefined,
                    page,
                    types: appliedFilters.types.length ? appliedFilters.types : undefined,
                    statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
                    roles: rolesToSend.length ? rolesToSend : undefined,
                    collegeProgram: appliedFilters.collegeProgram || undefined,
                    perPage: pageSize,
                    per_page: pageSize,
                },
                { preserve: true },
            )
        },
        [visit, searchTerm, appliedFilters, pageSize],
    )

    const handleDelete = (emp: Employees) => {
        setSel(emp)
        setOpen(true)
    }

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

    function capitalizeWords(str: string) {
        return str.replace(/\b\w/g, (c) => c.toUpperCase())
    }

    return (
        <AppLayout breadcrumbs={crumbs}>
            <Head title="Employees" />
            <div className="flex h-full flex-col gap-4 overflow-hidden py-6 px-2 sm:px-4 md:px-8">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 dark:bg-primary p-3 rounded-full border border-primary/20 dark:border-primary">
                        <Users className="h-6 w-6 text-primary dark:text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
                        <p className="text-muted-foreground">Manage employee information, status, and salaries.</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-[200px] flex-1">
                            <EmployeeSearch initialSearch={searchTerm} onSearch={handleSearch} />
                        </div>
                        <div className="flex items-center gap-2">
                            {(filters.types.length > 0 || filters.statuses.length > 0 || filters.roles.length > 0) && (
                                <Button variant="ghost" size="sm" onClick={resetFilters}>
                                    Reset Filters
                                </Button>
                            )}
                            <EmployeeFilter
                                selectedTypes={filters.types}
                                selectedStatuses={filters.statuses}
                                selectedRoles={filters.roles}
                                collegeProgram={filters.collegeProgram}
                                othersRole={filters.othersRole}
                                othersRoles={Array.isArray(props.othersRoles) ? props.othersRoles : []}
                                onChange={(newFilters) => handleFilterChange({ ...filters, ...newFilters })}
                            />
                            <Link
                                href={route('employees.create', {
                                    search: searchTerm || undefined,
                                    types: appliedFilters.types.length ? appliedFilters.types : undefined,
                                    statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
                                    roles: appliedFilters.roles.length ? appliedFilters.roles : undefined,
                                    collegeProgram: appliedFilters.collegeProgram || undefined,
                                    othersRole: appliedFilters.othersRole || undefined,
                                    page: currentPage,
                                    perPage: pageSize,
                                })}
                            >
                                <Button className="flex items-center gap-2 whitespace-nowrap">
                                    <UserPlus className="w-4 h-4" />
                                    Add
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center justify-between w-full">
                        <div
                            className={cn(
                                'text-right text-xs text-muted-foreground transition-all duration-200 ease-in-out',
                                hasFilters ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
                            )}
                        >
                            Showing: {appliedFilters.types.length ? appliedFilters.types.map(capitalizeWords).join(', ') : 'All Types'} /
                            {appliedFilters.statuses.length ? ' ' + appliedFilters.statuses.map(capitalizeWords).join(', ') : ' All Statuses'} /
                            {appliedFilters.roles.length ? ' ' + appliedFilters.roles.map(capitalizeWords).join(', ') : ' All Roles'}
                            {appliedFilters.roles.includes('college instructor') && appliedFilters.collegeProgram
                                ? ` / ${' '}${appliedFilters.collegeProgram} - ${getCollegeProgramLabel(appliedFilters.collegeProgram)}`
                                : ''}
                            {appliedFilters.roles.includes('others') && appliedFilters.othersRole ? ` / ${' '}${capitalizeWords(appliedFilters.othersRole)}` : ''}
                        </div>
                    </div>
                </div>

                <div className="relative flex flex-1 flex-col">
                    <TableEmployee
                        data={employees}
                        loading={loading}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePage}
                        onPageSizeChange={(size) => {
                            setPageSize(size)
                            if (typeof window !== 'undefined') {
                                window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size))
                            }
                            visit(
                                {
                                    search: searchTerm || undefined,
                                    page: 1,
                                    types: appliedFilters.types.length ? appliedFilters.types : undefined,
                                    statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
                                    roles: appliedFilters.roles.length ? appliedFilters.roles : undefined,
                                    collegeProgram: appliedFilters.collegeProgram || undefined,
                                    perPage: size,
                                    per_page: size,
                                },
                                { preserve: true },
                            )
                        }}
                        onView={(emp) => setViewing(emp)}
                        onDelete={(emp) => handleDelete(emp)}
                        editHrefFor={(emp) =>
                            route('employees.edit', {
                                employee: emp.id,
                                search: searchTerm || undefined,
                                types: appliedFilters.types.length ? appliedFilters.types : undefined,
                                statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
                                roles: appliedFilters.roles.length ? appliedFilters.roles : undefined,
                                page: currentPage,
                                collegeProgram: appliedFilters.collegeProgram || undefined,
                                perPage: pageSize,
                                per_page: pageSize,
                            })
                        }
                    />

                    <EmployeeViewDialog employee={viewing} onClose={() => setViewing(null)} showPayroll={false} />
                    <EmployeeDelete
                        open={open}
                        setOpen={setOpen}
                        employee={sel}
                        search={searchTerm}
                        filters={{
                            ...appliedFilters,
                            roles: Array.isArray(appliedFilters.roles) ? appliedFilters.roles : appliedFilters.roles ? [appliedFilters.roles] : [],
                        }}
                        page={currentPage}
                        perPage={pageSize}
                    />
                </div>
            </div>
        </AppLayout>
    )
}