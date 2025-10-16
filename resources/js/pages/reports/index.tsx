import { toast } from 'sonner'
import ReportViewDialog from '@/components/report-view-dialog'
import EmployeeFilter from '@/components/employee-filter'
import EmployeeSearch from '@/components/employee-search'
import TableReport from '@/components/table_report' // <-- Using the new table component
import { Button } from '@/components/ui/button'
import AppLayout from '@/layouts/app-layout'
import { cn } from '@/lib/utils'
import { BreadcrumbItem, Employees } from '@/types'
import { Head, router, usePage } from '@inertiajs/react'
import { ClipboardList, Printer } from 'lucide-react' // <-- Using ClipboardList for the new header icon
import PrintDialog from '@/components/print-dialog'
import PrintAllDialog from '@/components/print-all-dialog'
import { useCallback, useEffect, useRef, useState } from 'react'
import AdjustmentDialog from '@/components/adjustment-dialog'
import ExportLedgerDialog from '@/components/export-ledger-dialog'

export default function ReportsIndex() {
    const page = usePage()
    // --- State and constants ---
    type FilterState = { types: string[]; statuses: string[]; roles: string[]; othersRole?: string }
    const MIN_SPINNER_MS = 400
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

    // --- Page props and state (from tcc-adjustments) ---
    const {
        employees = [],
        currentPage = 1,
        totalPages = 1,
        search: initialSearch = '',
        filters: initialFiltersRaw = { types: [], statuses: [], roles: [], collegeProgram: '', othersRole: '' },
        othersRoles: initialOthersRoles = [],
    } = page.props as unknown as {
        employees: Employees[]
        currentPage: number
        totalPages: number
        search: string
        filters: { types: string[]; statuses: string[]; roles: string[]; collegeProgram: string; othersRole: string }
        othersRoles?: Array<{ value: string; label: string }>
    }
    const initialFilters = initialFiltersRaw || { types: [], statuses: [], roles: [], collegeProgram: '', othersRole: '' }
    const [viewing, setViewing] = useState(null as Employees | null)
    const [adjusting, setAdjusting] = useState(null as Employees | null)
    const [printDialog, setPrintDialog] = useState<{ open: boolean; employee: Employees | null }>({ open: false, employee: null })
    const [searchTerm, setSearchTerm] = useState(initialSearch)
    const [printAllDialogOpen, setPrintAllDialogOpen] = useState(false)
    const [pageSize, setPageSize] = useState<number>(10)
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
    const [loading, setLoading] = useState(true)
    const spinnerStart = useRef<number>(Date.now())
    const [month, setMonth] = useState<string>(() => {
        const today = new Date()
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    })
    const hasFilters =
        (Array.isArray(appliedFilters.types) && appliedFilters.types.length > 0) ||
        (Array.isArray(appliedFilters.statuses) && appliedFilters.statuses.length > 0) ||
        (Array.isArray(appliedFilters.roles) && appliedFilters.roles.length > 0) ||
        (appliedFilters.othersRole && appliedFilters.othersRole.length > 0)

    const flash = (page.props as unknown as { flash?: string | { type?: string; message?: string } }).flash
    useEffect(() => {
        if (!flash) return
        if (typeof flash === 'string') {
            toast.success(flash)
        } else if (typeof flash === 'object' && flash !== null) {
            if ('type' in flash && 'message' in flash) {
                if (flash.type === 'error') {
                    toast.error(flash.message || 'An error occurred')
                } else if (flash.type === 'success') {
                    toast.success(flash.message || 'Success')
                } else {
                    toast(flash.message || 'Notification')
                }
            }
        }
    }, [flash])

    useEffect(() => {
        const elapsed = Date.now() - spinnerStart.current
        const wait = Math.max(0, MIN_SPINNER_MS - elapsed)
        setTimeout(() => setLoading(false), wait)
    }, [])

    // --- Data fetching and handlers (from tcc-adjustments) ---
    const visit = useCallback(
        (params: Partial<{ search: string; page: number; category: string; types: string[]; statuses: string[]; roles: string[]; collegeProgram: string; othersRole: string; perPage: number; per_page: number }>, options: { preserve?: boolean } = {}) => {
            spinnerStart.current = Date.now()
            setLoading(true)

            router.visit(route('reports.index'), {
                method: 'get',
                data: params,
                preserveState: options.preserve ?? false,
                preserveScroll: true,
                only: ['employees', 'currentPage', 'totalPages', 'search', 'filters', 'perPage'],
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

    function capitalizeWords(str: string) {
        return str.replace(/\b\w/g, (c) => c.toUpperCase())
    }

    const crumbs: BreadcrumbItem[] = [
        {
            title: 'Reports',
            href: route('reports.index', {
                search: initialSearch,
                types: initialFilters.types,
                statuses: initialFilters.statuses,
                page: currentPage,
            }),
        },
    ]

    return (
        <AppLayout breadcrumbs={crumbs}>
            <Head title="Reports" />
            <div className="flex h-full flex-col gap-4 overflow-hidden px-2 py-6 sm:px-4 md:px-8">
                {/* HEADER (from create-edit-page-recreate) */}
                <div className="flex items-center gap-4">
                    <div className="dark:bg-primary bg-primary/10 rounded-full border border-primary/20 p-3 dark:border-primary">
                        <ClipboardList className="h-6 w-6 text-primary dark:text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                        <p className="text-muted-foreground">View and print employee payroll reports.</p>
                    </div>
                </div>

                {/* SEARCH & CONTROLS (from tcc-adjustments) */}
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
                                othersRoles={Array.isArray(initialOthersRoles) ? initialOthersRoles : []}
                                onChange={(newFilters) => handleFilterChange({ ...filters, ...newFilters })}
                            />
                            <Button variant="default" onClick={() => setPrintAllDialogOpen(true)}>
                                <Printer />
                                Print All
                            </Button>
                            <ExportLedgerDialog />
                        </div>
                    </div>
                    <div className="flex w-full items-center justify-between">
                        <div
                            className={cn(
                                'text-right text-xs text-muted-foreground transition-all duration-200 ease-in-out',
                                appliedFilters.types.length > 0 || appliedFilters.statuses.length > 0 || appliedFilters.roles.length > 0 ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
                            )}
                        >
                            Showing: {appliedFilters.types.length ? appliedFilters.types.map(capitalizeWords).join(', ') : 'All Types'} /
                            {appliedFilters.statuses.length ? ' ' + appliedFilters.statuses.map(capitalizeWords).join(', ') : ' All Statuses'} /
                            {appliedFilters.roles.length ? ' ' + appliedFilters.roles.map(capitalizeWords).join(', ') : ' All Roles'}
                            {appliedFilters.roles.includes('college instructor') && appliedFilters.collegeProgram ? ` / ${' '}${appliedFilters.collegeProgram} - ${getCollegeProgramLabel(appliedFilters.collegeProgram)}` : ''}
                            {appliedFilters.roles.includes('others') && appliedFilters.othersRole ? ` / ${' '}${capitalizeWords(appliedFilters.othersRole)}` : ''}
                        </div>
                    </div>
                </div>

                {/* TABLE & DIALOGS */}
                <div className="relative flex flex-1 flex-col">
                    {/* The loading spinner is now handled inside TableReport */}
                    <TableReport
                        data={employees}
                        loading={loading}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePage}
                        onPageSizeChange={(size) => {
                            setPageSize(size)
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
                        onPrint={(emp) => setPrintDialog({ open: true, employee: emp })}
                        onAdjustments={(emp) => setAdjusting(emp)}
                        activeRoles={appliedFilters.roles}
                    />

                    {/* Dialogs from tcc-adjustments */}
                    <ReportViewDialog employee={viewing} onClose={() => setViewing(null)} activeRoles={appliedFilters.roles} />
                    <PrintDialog open={printDialog.open} onClose={() => setPrintDialog({ open: false, employee: null })} employee={printDialog.employee as Employees | null} />
                    <PrintAllDialog open={printAllDialogOpen} onClose={() => setPrintAllDialogOpen(false)} />
                    <AdjustmentDialog
                        employee={adjusting}
                        open={!!adjusting}
                        onClose={() => setAdjusting(null)}
                        month={month}
                        onMonthChange={setMonth}
                    />
                </div>
            </div>
        </AppLayout>
    )
}