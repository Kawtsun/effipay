// ...existing code...
import EmployeeDelete from '@/components/employee-delete'
import EmployeeFilter from '@/components/employee-filter'
import EmployeeSearch from '@/components/employee-search'
import EmployeeViewDialog from '@/components/employee-view-dialog'
import { Button } from '@/components/ui/button'
import TableEmployee from '@/components/table_employee'
import AppLayout from '@/layouts/app-layout'
import { cn } from '@/lib/utils'
import { BreadcrumbItem, Employees } from '@/types'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { Loader2, Users, UserPlus2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
 

type FlashObject = { type: string; message: string };
type Flash = { success?: string } | string | FlashObject;
type PageProps = { flash?: Flash };

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

// Add this mapping at the top of the file (or near the badge logic)
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
];
function getCollegeProgramLabel(acronym: string) {
  const found = COLLEGE_PROGRAMS.find(p => p.value === acronym);
  return found ? found.label : acronym;
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
    const [loading, setLoading] = useState(false)
    const spinnerStart = useRef<number>(0)
    const [pageSize, setPageSize] = useState<number>(10)

    // Local state seeded from props
    const [searchTerm, setSearchTerm] = useState(initialSearch)
    const toArray = (val: unknown) => Array.isArray(val) ? val : val ? [val] : [];
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

    // Sync local state when props change (e.g. after delete or redirect)

    // Show toast on success
    useEffect(() => {
        if (!props.flash) return;
        if (typeof props.flash === 'string') {
            toast.success(props.flash);
        } else if (typeof props.flash === 'object' && props.flash !== null) {
            if ('success' in props.flash && props.flash.success) {
                toast.success(props.flash.success);
            } else if ('type' in props.flash && 'message' in props.flash) {
                if (props.flash.type === 'error') {
                    toast.error(props.flash.message || 'An error occurred');
                } else if (props.flash.type === 'success') {
                    toast.success(props.flash.message || 'Success');
                } else {
                    toast(props.flash.message || 'Notification');
                }
            }
        }
    }, [props.flash]);

    // Visit helper
    const visit = useCallback((params: Partial<{ search: string; page: number; category: string; types: string[]; statuses: string[]; roles: string[]; collegeProgram: string; othersRole: string; perPage: number; per_page: number }>, options: { preserve?: boolean } = {}) => {
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
                    collegeProgram: appliedFilters.collegeProgram || undefined,
                    perPage: pageSize,
                    per_page: pageSize,
                },
                { preserve: true }
            )
        },
        [visit, appliedFilters, hasFilters, pageSize]
    )

    // Filter apply
    const handleFilterChange = useCallback(
    (newFilters: FilterState & { collegeProgram?: string; othersRole?: string }) => {
        // The local `filters` state should immediately reflect the UI controls
        setFilters(newFilters);

        // Now, construct the filters that will actually be APPLIED and sent to the backend
        let applied = { ...newFilters };
        let rolesToSend = [...applied.roles];

        // If 'others' is selected and a specific 'othersRole' is chosen,
        // we replace 'others' with the specific role for the backend query.
        if (applied.roles.includes('others') && applied.othersRole) {
            rolesToSend = rolesToSend.filter(r => r !== 'others');
            rolesToSend.push(applied.othersRole);
        }

        // Update the applied filters state. We create a version for the UI display
        // that keeps the specific role for the badge, but doesn't include 'others'.
        const appliedForUI = { ...applied, roles: rolesToSend };
        setAppliedFilters(appliedForUI);

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
            { preserve: true }
        );
    },
    [visit, searchTerm, pageSize]
);

    // Reset filters
    const resetFilters = useCallback(() => {
        const empty = { types: [], statuses: [], roles: [], othersRole: '' };
        setFilters(empty); // Clear local draft filters
        setAppliedFilters(empty); // Clear applied filters
        visit({ search: searchTerm || undefined, page: 1, perPage: pageSize, per_page: pageSize }, { preserve: true });
    }, [visit, searchTerm, pageSize])

    // Pagination
    const handlePage = useCallback(
        (page: number) => {
            let rolesToSend = [...appliedFilters.roles];
            // Re-apply the same logic for pagination requests
            if (appliedFilters.roles.includes('others') && appliedFilters.othersRole) {
                rolesToSend = rolesToSend.filter(r => r !== 'others');
                rolesToSend.push(appliedFilters.othersRole);
            }

            visit(
                {
                    search: searchTerm || undefined,
                    page,
                    types: appliedFilters.types.length ? appliedFilters.types : undefined,
                    statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
                    roles: rolesToSend.length ? rolesToSend : undefined,
                    collegeProgram: appliedFilters.collegeProgram || undefined,
                    // othersRole is now part of the 'roles' array, no need to send separately
                    perPage: pageSize,
                    per_page: pageSize,
                },
                { preserve: true }
            )
        },
        [visit, searchTerm, appliedFilters, pageSize]
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

            <div className="flex h-full flex-col gap-4 overflow-hidden py-6 px-2 sm:px-4 md:px-8">
                {/* HEADER */}
                <div className="flex-none">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                        <Users className="h-6 w-6 text-primary" />
                        Employees
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage employee information, status, and salaries.
                    </p>
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
                                collegeProgram={filters.collegeProgram}
                                othersRole={filters.othersRole}
                                othersRoles={Array.isArray(props.othersRoles) ? props.othersRoles : []}
                                onChange={newFilters => handleFilterChange({ ...filters, ...newFilters })}
                            />
                            <Link
                                href={route('employees.create', {
                                    search: searchTerm || undefined,
                                    types: appliedFilters.types.length ? appliedFilters.types : undefined,
                                    statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
                                    page: currentPage,
                                    perPage: pageSize,
                                })}
                            >
                                <Button className="flex items-center gap-2 whitespace-nowrap">
                                    <UserPlus2 className="w-4 h-4" />
                                    Add
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
                            {appliedFilters.statuses.length ? ' ' + appliedFilters.statuses.map(capitalizeWords).join(', ') : ' All Statuses'} /
                            {appliedFilters.roles.length ? ' ' + appliedFilters.roles.map(capitalizeWords).join(', ') : ' All Roles'}
                            {appliedFilters.roles.includes('college instructor') && appliedFilters.collegeProgram ?
                                ` / ${' '}${appliedFilters.collegeProgram} - ${getCollegeProgramLabel(appliedFilters.collegeProgram)}` : ''}
                            {appliedFilters.roles.includes('others') && appliedFilters.othersRole ?
                                ` / ${' '}${capitalizeWords(appliedFilters.othersRole)}` : ''}
                        </div>
                    </div>
                </div>

                {/* TABLE & PAGINATION */
                }
                <div className="relative flex flex-1 flex-col">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 transition-opacity duration-300 dark:bg-black/70">
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                        </div>
                    )}
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
                                { preserve: true }
                            )
                        }}
                        onView={(emp) => setViewing(emp)}
                        onDelete={(emp) => handleDelete(emp)}
                        editHrefFor={(emp) => route('employees.edit', {
                                                                employee: emp.id,
                                                                search: searchTerm || undefined,
                                                                types: appliedFilters.types.length ? appliedFilters.types : undefined,
                                                                statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
                                                                roles: appliedFilters.roles.length ? appliedFilters.roles : undefined,
                                                                page: currentPage,
                                                                // othersRole is now part of the 'roles' array, no need to send separately
                                                                collegeProgram: appliedFilters.collegeProgram || undefined,
                            perPage: pageSize,
                            per_page: pageSize,
                                                            })}
                        activeRoles={appliedFilters.roles}
                    />
                    <EmployeeViewDialog
                        employee={viewing}
                        onClose={() => setViewing(null)}
                        activeRoles={appliedFilters.roles}
                        showPayroll={false}
                    />

                    <EmployeeDelete
                        open={open}
                        setOpen={setOpen}
                        employee={sel}
                        search={searchTerm}
                        filters={{
                            ...appliedFilters,
                            roles: Array.isArray(appliedFilters.roles)
                                ? appliedFilters.roles
                                : appliedFilters.roles
                                    ? [appliedFilters.roles]
                                    : [],
                        }}
                        page={currentPage}
                        perPage={pageSize}
                    />

                    {/* Pagination UI is provided by TableEmployee */}
                </div>
            </div>
        </AppLayout>
    );
}
