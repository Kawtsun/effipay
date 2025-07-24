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
  { value: 'CG', label: 'Career Guidance or Computer Graphics' },
  { value: 'BSPT', label: 'Bachelor of Science in Physical Therapy' },
  { value: 'GSP', label: 'GSIS Scholarship' },
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
}: EmployeesProps & { filters: FilterState & { collegeProgram?: string } }) {
    const { props } = usePage<PageProps>()
    const [open, setOpen] = useState(false)
    const [sel, setSel] = useState<Employees | null>(null)
    const [viewing, setViewing] = useState<Employees | null>(null)
    const [loading, setLoading] = useState(false)
    const spinnerStart = useRef<number>(0)

    // Local state seeded from props
    const [searchTerm, setSearchTerm] = useState(initialSearch)
    const [filters, setFilters] = useState<FilterState & { collegeProgram?: string }>({
        ...initialFilters,
        collegeProgram: typeof initialFilters.collegeProgram !== 'undefined' ? initialFilters.collegeProgram : '',
    })
    const [appliedFilters, setAppliedFilters] = useState<FilterState & { collegeProgram?: string }>({
        ...initialFilters,
        collegeProgram: typeof initialFilters.collegeProgram !== 'undefined' ? initialFilters.collegeProgram : '',
    })
    const hasFilters = appliedFilters.types.length > 0 || appliedFilters.statuses.length > 0 || appliedFilters.roles.length > 0

    // Sync local state when props change (e.g. after delete or redirect)
    const isFirstLoad = useRef(true)

    // Show toast on success
    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success)
        }
    }, [props.flash])

    // Visit helper
    const visit = useCallback((params: Partial<{ search: string; page: number; category: string; types: string[]; statuses: string[]; roles: string[]; collegeProgram: string }>, options: { preserve?: boolean } = {}) => {
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
                },
                { preserve: true }
            )
        },
        [visit, appliedFilters, hasFilters]
    )

    // Filter apply
    const handleFilterChange = useCallback(
        (newFilters: FilterState & { collegeProgram?: string }) => {
            setFilters(newFilters)
            setAppliedFilters(newFilters)
            visit(
                {
                    search: searchTerm || undefined,
                    page: 1,
                    types: newFilters.types.length ? newFilters.types : undefined,
                    statuses: newFilters.statuses.length ? newFilters.statuses : undefined,
                    roles: newFilters.roles.length ? newFilters.roles : undefined,
                    collegeProgram: newFilters.collegeProgram || undefined,
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
                    collegeProgram: appliedFilters.collegeProgram || undefined,
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

    const badge = (role: string, emp: Employees, restRoles: string[] = []) => {
        let color: 'secondary' | 'info' | 'purple' | 'warning' = 'secondary';
        let icon = null;
        let extra = null;
        let tooltip = undefined;
        if (role === 'administrator') {
            color = 'info';
            icon = <Shield className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
        } else if (role === 'college instructor') {
            color = 'purple';
            icon = <GraduationCap className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
            const program = emp.college_program;
            if (program) {
                extra = <span className="ml-1 text-xs font-semibold text-white">[{program}]</span>;
                // Tooltip: full program name + extra roles
                tooltip = (
                    <div className="min-w-[220px]">
                        <div className="font-semibold text-base mb-2 text-gray-900 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            {getCollegeProgramLabel(program)}
                        </div>
                        {restRoles.length > 0 && (
                            <>
                                <div className="my-2 h-px bg-muted-foreground/20" />
                                <div className="text-xs text-muted-foreground font-semibold mb-1">Other Roles:</div>
                                <div className="flex flex-wrap gap-2">
                                    {restRoles.map(r => {
                                        let i = null;
                                        let pillColor = 'bg-gray-200 text-gray-800';
                                        if (r === 'administrator') {
                                            i = <Shield className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom text-blue-600" />;
                                            pillColor = 'bg-blue-100 text-blue-800';
                                        } else if (r === 'college instructor') {
                                            i = <GraduationCap className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom text-purple-600" />;
                                            pillColor = 'bg-purple-100 text-purple-800';
                                        } else if (r === 'basic education instructor') {
                                            i = <Book className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom text-orange-600" />;
                                            pillColor = 'bg-orange-100 text-orange-800';
                                        }
                                        return (
                                            <span key={r} className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pillColor}`}>
                                                {i}{capitalizeWords(r)}
                                            </span>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                );
            }
        } else if (role === 'basic education instructor') {
            color = 'warning';
            icon = <Book className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
        }
        const badgeContent = (
            <Badge key={role} variant={color} className="mr-1 capitalize flex items-center">
                {icon}{capitalizeWords(role)}{extra}
            </Badge>
        );
        return tooltip ? (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
                    <TooltipContent side="top">{tooltip}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        ) : badgeContent;
    };

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
                                collegeProgram={filters.collegeProgram}
                                onChange={newFilters => handleFilterChange({ ...filters, ...newFilters })}
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
                <div className="relative flex flex-1 flex-col">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 transition-opacity duration-300 dark:bg-black/70">
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                        </div>
                    )}

                    <div className="w-full overflow-x-auto">
                        <Table className="select-none min-w-[900px]" style={{ tableLayout: 'fixed', width: '100%' }}>
                            <TableHeader className=''>
                                <TableRow className='odd:bg-muted/50 even:bg-background hover:bg-muted transition-colors'>
                                    <TableHead style={{ width: 120 }} className="text-xs font-semibold uppercase  tracking-wide text-left px-4 py-2">Employee ID</TableHead>
                                    <TableHead style={{ width: 200 }} className='text-xs font-semibold uppercase tracking-wide text-left px-4 py-2'>Employee Name</TableHead>
                                    <TableHead style={{ width: 160 }} className='text-xs font-semibold uppercase tracking-wide text-left px-4 py-2'>Employee Type</TableHead>
                                    <TableHead style={{ width: 160 }} className='text-xs font-semibold uppercase  tracking-wide text-left px-4 py-2'>Employee Status</TableHead>
                                    <TableHead style={{ width: 350 }} className="text-xs font-semibold uppercase  tracking-wide text-left px-4 py-2">Roles</TableHead>
                                    <TableHead style={{ width: 180 }} className='text-right text-xs font-semibold uppercase  tracking-wide px-4 py-2'>Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {employees.length === 0 && !loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground" style={{ width: '100%' }}>
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
                                                <TableCell style={{ width: 120 }} className="px-4 py-2">{emp.id}</TableCell>
                                                <TableCell style={{ width: 200 }} className="px-4 py-2">{emp.employee_name}</TableCell>
                                                <TableCell style={{ width: 160 }} className="px-4 py-2">{emp.employee_type}</TableCell>
                                                <TableCell style={{ width: 160 }} className="px-4 py-2">{emp.employee_status}</TableCell>
                                                <TableCell style={{ width: 350 }} className="px-4 py-2 min-w-[160px]">
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
                                                        let displayRoles = rolesArr;
                                                        if (appliedFilters.roles.length > 0) {
                                                            const filtered = appliedFilters.roles.filter(r => rolesArr.includes(r));
                                                            const rest = rolesArr.filter(r => !filtered.includes(r));
                                                            displayRoles = [...filtered, ...rest];
                                                        } else {
                                                            const order = ['college instructor', 'basic education instructor', 'administrator'];
                                                            displayRoles = order.filter(r => rolesArr.includes(r));
                                                        }
                                                        const mainRole = displayRoles[0];
                                                        let color: 'secondary' | 'info' | 'purple' | 'warning' = 'secondary';
                                                        let icon = null;
                                                        let extra = null;
                                                        let tooltip = null;
                                                        if (mainRole === 'administrator') {
                                                            color = 'info';
                                                            icon = <Shield className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                                                        } else if (mainRole === 'college instructor') {
                                                            color = 'purple';
                                                            icon = <GraduationCap className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                                                            if (emp.college_program) {
                                                                extra = <span className="ml-1 text-xs font-semibold text-white">[{emp.college_program}]</span>;
                                                            }
                                                        } else if (mainRole === 'basic education instructor') {
                                                            color = 'warning';
                                                            icon = <Book className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                                                        }
                                                        // Tooltip content: all roles as badges, and if mainRole is college instructor, show full program name
                                                        if (displayRoles.length > 1 || mainRole === 'college instructor') {
                                                            tooltip = (
                                                                <div className="min-w-[220px]">
                                                                    {mainRole === 'college instructor' && emp.college_program && (
                                                                        <div className="font-semibold text-base mb-2 text-gray-900 flex items-center gap-2">
                                                                            <GraduationCap className="w-4 h-4" />
                                                                            {getCollegeProgramLabel(emp.college_program)}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {displayRoles.map(role => {
                                                                            let c: 'secondary' | 'info' | 'purple' | 'warning' = 'secondary';
                                                                            let i = null;
                                                                            let e = null;
                                                                            if (role === 'administrator') {
                                                                                c = 'info';
                                                                                i = <Shield className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                                                                            } else if (role === 'college instructor') {
                                                                                c = 'purple';
                                                                                i = <GraduationCap className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                                                                                if (emp.college_program) {
                                                                                    e = <span className="ml-1 text-xs font-semibold text-white">[{emp.college_program}]</span>;
                                                                                }
                                                                            } else if (role === 'basic education instructor') {
                                                                                c = 'warning';
                                                                                i = <Book className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                                                                            }
                                                                            return (
                                                                                <Badge key={role} variant={c} className="capitalize flex items-center">
                                                                                    {i}{capitalizeWords(role)}{e}
                                                                                </Badge>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        const badgeContent = (
                                                            <span className="inline-flex items-center gap-1 cursor-pointer">
                                                                <Badge key={mainRole} variant={color} className="capitalize flex items-center">
                                                                    {icon}{capitalizeWords(mainRole)}{extra}
                                                                </Badge>
                                                                {displayRoles.length > 1 && (
                                                                    <Badge variant="success" className="cursor-pointer">+{displayRoles.length - 1}</Badge>
                                                                )}
                                                            </span>
                                                        );
                                                        return tooltip ? (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
                                                                    <TooltipContent side="top">{tooltip}</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : badgeContent;
                                                    })()}
                                                </TableCell>
                                                <TableCell style={{ width: 180 }} className="px-4 py-2 whitespace-nowrap text-right">
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
                                                <TableCell style={{ width: 120, height: ROW_HEIGHT }} className="px-4 py-2" />
                                                <TableCell style={{ width: 200, height: ROW_HEIGHT }} className="px-4 py-2" />
                                                <TableCell style={{ width: 160, height: ROW_HEIGHT }} className="px-4 py-2" />
                                                <TableCell style={{ width: 160, height: ROW_HEIGHT }} className="px-4 py-2" />
                                                <TableCell style={{ width: 240, height: ROW_HEIGHT }} className="px-4 py-2" />
                                                <TableCell style={{ width: 180, height: ROW_HEIGHT }} className="px-4 py-2" />
                                            </TableRow>
                                        ))}
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <EmployeeViewDialog employee={viewing} onClose={() => setViewing(null)} activeRoles={appliedFilters.roles} />

                    <EmployeeDelete open={open} setOpen={setOpen} employee={sel} search={searchTerm} filters={appliedFilters} page={currentPage} />

                    <div className="mt-4 flex min-h-[56px] justify-center">
                        <EmployeePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePage} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}


