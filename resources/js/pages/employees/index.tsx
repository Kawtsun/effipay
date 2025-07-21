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
import { Eye, Loader2, Pencil, Plus, Trash, Users, Shield, GraduationCap, Book } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

type Flash = { success?: string }
type PageProps = { flash?: Flash }

interface EmployeesProps {
    employees: Employees[]
    currentPage: number
    totalPages: number
    search?: string
    filters: { types: string[]; statuses: string[] }
}

type FilterState = { types: string[]; statuses: string[]; roles: string[] }

const MIN_SPINNER_MS = 400
const MAX_ROWS = 10
const ROW_HEIGHT = 53 // px

export default function Index({
    employees,
    currentPage,
    totalPages,
    search: initialSearch = '',
    filters: initialFilters,
}: EmployeesProps & { filters: FilterState }) {
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
    const hasFilters = appliedFilters.types.length > 0 || appliedFilters.statuses.length > 0 || appliedFilters.roles.length > 0

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
    const visit = useCallback((params: Partial<{ search: string; page: number; category: string; types: string[]; statuses: string[]; roles: string[] }>, options: { preserve?: boolean } = {}) => {
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
                    roles: hasFilters ? appliedFilters.roles : undefined,
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
                    roles: newFilters.roles.length ? newFilters.roles : undefined,
                },
                { preserve: true }
            )
        },
        [visit, searchTerm]
    )

    // Reset filters
    const resetFilters = useCallback(() => {
        const empty = { types: [], statuses: [], roles: [] };
        setFilters(empty);
        setAppliedFilters(empty);
        visit({ search: searchTerm || undefined, page: 1 }, { preserve: true });
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
                    roles: appliedFilters.roles.length ? appliedFilters.roles : undefined,
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

    // Helper to capitalize each word
    function capitalizeWords(str: string) {
        return str.replace(/\b\w/g, c => c.toUpperCase());
    }

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
                    <p className="text-sm text-muted-foreground">Manage your organization's employee type, status, and salary.</p>
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
                            {(filters.types.length > 0 || filters.statuses.length > 0 || filters.roles.length > 0) && (
                                <Button variant="ghost" size="sm" onClick={resetFilters}>
                                    Reset Filters
                                </Button>
                            )}
                            <EmployeeFilter
                                selectedTypes={filters.types}
                                selectedStatuses={filters.statuses}
                                selectedRoles={filters.roles}
                                onChange={newFilters => handleFilterChange({ ...filters, types: newFilters.types, statuses: newFilters.statuses, roles: newFilters.roles })}
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
                    {/* Category filter and Active Filters Preview in one line */}
                    <div className="flex items-center justify-between w-full">
                        <div
                            className={cn(
                                'text-right text-xs text-muted-foreground transition-all duration-200 ease-in-out',
                                (appliedFilters.types.length > 0 || appliedFilters.statuses.length > 0 || appliedFilters.roles.length > 0) ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
                            )}
                        >
                            Showing: {appliedFilters.types.length ? appliedFilters.types.map(capitalizeWords).join(', ') : 'All Types'} /
                            {appliedFilters.statuses.length ? appliedFilters.statuses.map(capitalizeWords).join(', ') : 'All Statuses'} /
                            {appliedFilters.roles.length ? appliedFilters.roles.map(capitalizeWords).join(', ') : 'All Roles'}
                        </div>
                    </div>
                </div>

                {/* TABLE & PAGINATION */}
                <div className="relative flex flex-1 flex-col overflow-auto">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 transition-opacity duration-300 dark:bg-black/70">
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                        </div>
                    )}

                    <Table className='select-none'>
                        <TableHeader className=''>
                            <TableRow className='odd:bg-muted/50 even:bg-background hover:bg-muted transition-colors'>
                                <TableHead className="text-xs font-semibold uppercase  tracking-wide text-left px-4 py-2">Employee ID</TableHead>
                                <TableHead className='text-xs font-semibold uppercase tracking-wide text-left px-4 py-2'>Employee Name</TableHead>
                                <TableHead className='text-xs font-semibold uppercase tracking-wide text-left px-4 py-2'>Employee Type</TableHead>
                                <TableHead className='text-xs font-semibold uppercase  tracking-wide text-left px-4 py-2'>Employee Status</TableHead>
                                <TableHead className='text-xs font-semibold uppercase  tracking-wide text-left px-4 py-2'>Roles</TableHead>
                                <TableHead className='text-right text-xs font-semibold uppercase  tracking-wide px-4 py-2'>Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {employees.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                                            <TableCell className="w-52 px-4 py-2">
                                                {(() => {
                                                    if (!emp.roles) return '';
                                                    let rolesArr = emp.roles.split(',').map(r => r.trim()).filter(Boolean);
                                                    const order = ['college instructor', 'basic education instructor', 'administrator'];
                                                    rolesArr = order.filter(r => rolesArr.includes(r));
                                                    if (appliedFilters.roles.length > 0) {
                                                        // Filtered roles first, then the rest
                                                        const filtered = appliedFilters.roles.filter(r => rolesArr.includes(r));
                                                        const rest = rolesArr.filter(r => !filtered.includes(r));
                                                        rolesArr = [...filtered, ...rest];
                                                    }
                                                    if (rolesArr.length === 0) return '';
                                                    // Determine which role to show based on active filter
                                                    let mainRole = rolesArr[0];
                                                    if (appliedFilters.roles.length > 0) {
                                                        // If admin is in filter and employee has admin, show admin
                                                        if (appliedFilters.roles.includes('administrator') && rolesArr.includes('administrator')) {
                                                            mainRole = 'administrator';
                                                        } else {
                                                            // Otherwise, show the first matching filtered role
                                                            const match = rolesArr.find(r => appliedFilters.roles.includes(r));
                                                            if (match) mainRole = match;
                                                        }
                                                    }
                                                    const restRoles = rolesArr.filter(r => r !== mainRole);
                                                    const badge = (role: string) => {
                                                        let color: 'secondary' | 'info' | 'purple' | 'warning' = 'secondary';
                                                        let icon = null;
                                                        if (role === 'administrator') {
                                                            color = 'info';
                                                            icon = <Shield className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                                                        } else if (role === 'college instructor') {
                                                            color = 'purple';
                                                            icon = <GraduationCap className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                                                        } else if (role === 'basic education instructor') {
                                                            color = 'warning';
                                                            icon = <Book className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                                                        }
                                                        return (
                                                            <Badge key={role} variant={color} className="mr-1 capitalize flex items-center">
                                                                {icon}{capitalizeWords(role)}
                                                            </Badge>
                                                        );
                                                    };
                                                    if (restRoles.length === 0) return badge(mainRole);
                                                    return (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="inline-flex items-center gap-1 cursor-pointer">
                                                                        {badge(mainRole)}
                                                                        <Badge variant="success" className="cursor-pointer">+{restRoles.length}</Badge>
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top">
                                                                    <div className="flex flex-col gap-1">
                                                                        {[mainRole, ...restRoles].map(role => badge(role))}
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    );
                                                })()}
                                            </TableCell>
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
                                                            roles: appliedFilters.roles.length ? appliedFilters.roles : undefined,
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
                                            <TableCell colSpan={7} style={{ height: ROW_HEIGHT }} />
                                        </TableRow>
                                    ))}
                                </>
                            )}
                        </TableBody>
                    </Table>
                    <EmployeeViewDialog employee={viewing} onClose={() => setViewing(null)} />

                    <EmployeeDelete open={open} setOpen={setOpen} employee={sel} search={searchTerm} filters={appliedFilters} page={currentPage} />

                    <div className="mt-4 flex min-h-[56px] justify-center">
                        <EmployeePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePage} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}


