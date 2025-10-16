import { usePage } from '@inertiajs/react'
type FilterState = { types: string[]; statuses: string[]; roles: string[]; collegeProgram?: string; othersRole?: string }
const MIN_SPINNER_MS = 400
import EmployeeFilter from '@/components/employee-filter'
import Encoding from 'encoding-japanese'
// import EmployeePagination from '@/components/employee-pagination';
import TableTimekeeping from '@/components/table_timekeeping'
import EmployeeSearch from '@/components/employee-search'
import TimeKeepingViewDialog from '@/components/timekeeping-view-dialog'
import BTRDialog from '@/components/btr-dialog'
import { Button } from '@/components/ui/button'

import AppLayout from '@/layouts/app-layout'
import { cn } from '@/lib/utils'
import { BreadcrumbItem, Employees } from '@/types'
import { Head, router } from '@inertiajs/react'
import { Users, Import, Calendar, Clock } from 'lucide-react'
import { CalendarViewDialog } from '@/components/calendar-view-dialog'
import { Spinner } from '@/components/ui/spinner'

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export default function TimeKeeping() {
    const { csrfToken } = usePage().props as unknown as { csrfToken: string }
    const [selectedEmployee, setSelectedEmployee] = useState<Employees | null>(null)
    const [selectedBtrEmployee, setSelectedBtrEmployee] = useState<Employees | null>(null)
    const [calendarOpen, setCalendarOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [pageSize, setPageSize] = useState<number>(10)

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
            fileInputRef.current.click()
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        const validExtensions = ['.csv', '.xls', '.xlsx']
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
        if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
            toast.error('Invalid file type. Only CSV or Excel files are accepted.')
            return
        }

        let rows: Record<string, unknown>[] = []
        const importToast = toast.loading('Importing file...')
        // Show loading toast for at least 1.5s before verifying file
        setTimeout(() => {
            if (ext === '.csv') {
                file.arrayBuffer().then((buffer) => {
                    // Use encoding.js to auto-detect and convert encoding to UTF-8
                    const uint8Array = new Uint8Array(buffer)
                    const detected = Encoding.detect(uint8Array)
                    const text = Encoding.convert(uint8Array, {
                        to: 'UNICODE',
                        from: detected,
                        type: 'string',
                    })
                    // Strip BOM if present
                    let cleanText = text
                    if (cleanText.charCodeAt(0) === 0xfeff) {
                        cleanText = cleanText.slice(1)
                    }
                    console.log('Raw CSV text:', cleanText)
                    const result = Papa.parse(cleanText, {
                        header: true,
                        skipEmptyLines: true,
                        transform: (value: string) => (value ? value.normalize('NFC') : value),
                        error: (err: Error) => {
                            console.error('PapaParse error:', err)
                        },
                    })
                    console.log('Parsed rows:', result.data)
                    // Log and filter out empty/malformed rows
                    const validRows = (result.data as Record<string, unknown>[]).filter((row) => row && Object.values(row).some((v) => v !== null && v !== undefined && v !== ''))
                    if (validRows.length !== (result.data as Record<string, unknown>[]).length) {
                        toast.dismiss(importToast)
                        toast.warning(`Some rows were skipped due to parsing errors. Imported ${validRows.length} of ${(result.data as Record<string, unknown>[]).length} rows.`, { duration: 3000, id: `skipped-${Date.now()}` })
                    }
                    rows = validRows
                    // Add another delay before removing loading toast and showing result
                    setTimeout(() => {
                        sendImport(rows, file.name, importToast)
                    }, 1000)
                })
            } else {
                file.arrayBuffer().then((data) => {
                    const workbook = XLSX.read(data, { type: 'array' })
                    const sheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[sheetName]
                    rows = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]
                    // Convert Excel serial date numbers to YYYY-MM-DD strings
                    function excelSerialToDate(serial: number) {
                        // Excel's epoch starts at 1899-12-30
                        const excelEpoch = new Date(Date.UTC(1899, 11, 30))
                        const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000)
                        return date.toISOString().slice(0, 10)
                    }
                    function excelSerialToTime(serial: number) {
                        // Excel time serial is a fraction of a day
                        const totalSeconds = Math.round(serial * 24 * 60 * 60)
                        const hours = Math.floor(totalSeconds / 3600)
                        const minutes = Math.floor((totalSeconds % 3600) / 60)
                        const seconds = totalSeconds % 60
                        return [hours, minutes, seconds].map((v) => v.toString().padStart(2, '0')).join(':')
                    }
                    rows = rows.map((row) => {
                        if (row.Date && typeof row.Date === 'number') {
                            row.Date = excelSerialToDate(row.Date)
                        }
                        if (row.ClockIn && typeof row.ClockIn === 'number') {
                            row.ClockIn = excelSerialToTime(row.ClockIn)
                        }
                        if (row.ClockOut && typeof row.ClockOut === 'number') {
                            row.ClockOut = excelSerialToTime(row.ClockOut)
                        }
                        // Also handle alternate column names (if your sheet uses 'Clock In'/'Clock Out')
                        if (row['Clock In'] && typeof row['Clock In'] === 'number') {
                            row['Clock In'] = excelSerialToTime(row['Clock In'])
                        }
                        if (row['Clock Out'] && typeof row['Clock Out'] === 'number') {
                            row['Clock Out'] = excelSerialToTime(row['Clock Out'])
                        }
                        return row
                    })
                    setTimeout(() => {
                        sendImport(rows, file.name, importToast)
                    }, 1000)
                })
            }
        }, 1500)
        function sendImport(rows: Record<string, unknown>[], fileName: string, toastId: string | number) {
            fetch('/time-keeping/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ records: rows }),
            })
                .then(async (response) => {
                    // Dismiss loading toast first, then show result toast
                    toast.dismiss(typeof toastId === 'number' ? undefined : toastId)

                    // Session expired / CSRF problem
                    if (response.status === 419 || response.status === 401) {
                        toast.error('Session expired. The page will reload to recover your session.');
                        window.setTimeout(() => window.location.reload(), 1200);
                        return;
                    }

                    // Method not allowed / route mismatch
                    if (response.status === 405) {
                        toast.error('Server route mismatch detected. Reloading the page to refresh routes.');
                        window.setTimeout(() => window.location.reload(), 1200);
                        return;
                    }

                    if (response.ok) {
                        toast.success(`Successfully imported: ${fileName}`, { id: `success-${Date.now()}`, duration: 1000 })
                        router.reload({ only: ['employees', 'currentPage', 'totalPages', 'search', 'filters'] })
                    } else {
                        let errorMsg = 'Import failed.'
                        try {
                            const errorData = await response.json()
                            if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                                errorMsg = errorData.errors.join('\n')
                            }
                        } catch (err) {
                            // Could not parse error JSON
                            console.error('Error parsing import error response:', err)
                        }
                        toast.error(errorMsg, { duration: 3000 })
                    }
                })
                .catch((err) => {
                    // Network or unexpected error — reload to attempt recovery
                    toast.error('Import failed due to network or session error. The page will reload to try to recover.');
                    toast.dismiss(typeof toastId === 'number' ? undefined : toastId)
                    console.error('Import failed:', err)
                    window.setTimeout(() => window.location.reload(), 1200);
                })
        }
    }

    function getCollegeProgramLabel(acronym: string) {
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
        const found = COLLEGE_PROGRAMS.find((p) => p.value === acronym)
        return found ? found.label : acronym
    }
    const page = usePage()
    const {
        employees = [],
        currentPage = 1,
        totalPages = 1,
        search: initialSearch = '',
        filters: initialFiltersRaw = { types: [], statuses: [], roles: [] },
        othersRoles: initialOthersRoles = [],
    } = page.props as {
        employees?: Employees[]
        currentPage?: number
        totalPages?: number
        search?: string
        filters?: FilterState
        othersRoles?: Array<{ value: string; label: string }>
    }

    const initialFilters = initialFiltersRaw || { types: [], statuses: [], roles: [] }
    const [searchTerm, setSearchTerm] = useState(initialSearch)
    const toArray = (val: unknown) => (Array.isArray(val) ? val : val ? [val] : [])
    const [filters, setFilters] = useState<FilterState>({
        ...initialFilters,
        roles: toArray(initialFilters.roles),
        collegeProgram: typeof initialFilters.collegeProgram !== 'undefined' ? initialFilters.collegeProgram : '',
    })
    const [appliedFilters, setAppliedFilters] = useState<FilterState>({
        ...initialFilters,
        roles: toArray(initialFilters.roles),
        collegeProgram: typeof initialFilters.collegeProgram !== 'undefined' ? initialFilters.collegeProgram : '',
    })
    const [loading, setLoading] = useState(true)
    const spinnerStart = useRef<number>(Date.now())

    useEffect(() => {
        const elapsed = Date.now() - spinnerStart.current
        const wait = Math.max(0, MIN_SPINNER_MS - elapsed)
        setTimeout(() => setLoading(false), wait)
    }, [])

    // Visit helper
    const visit = useCallback(
        (params: Partial<{ search: string; page: number; types: string[]; statuses: string[]; roles: string[]; collegeProgram: string; othersRole: string; perPage: number; per_page: number }>, options: { preserve?: boolean } = {}) => {
            spinnerStart.current = Date.now()
            setLoading(true)
            router.visit(route('time-keeping.index'), {
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

    // Search handler
    const handleSearch = useCallback(
        (term: string) => {
            setSearchTerm(term)
            visit(
                {
                    search: term || undefined,
                    page: 1,
                    types: appliedFilters.types.length > 0 ? appliedFilters.types : undefined,
                    statuses: appliedFilters.statuses.length > 0 ? appliedFilters.statuses : undefined,
                    roles: appliedFilters.roles.length > 0 ? appliedFilters.roles : undefined,
                    collegeProgram: appliedFilters.collegeProgram || undefined,
                    perPage: pageSize,
                    per_page: pageSize,
                },
                { preserve: true },
            )
        },
        [visit, appliedFilters, pageSize],
    )

    // Filter apply
    const handleFilterChange = useCallback(
        (newFilters: FilterState & { collegeProgram?: string; othersRole?: string }) => {
            // The local `filters` state should immediately reflect the UI controls
            setFilters(newFilters)

            // Now, construct the filters that will actually be APPLIED and sent to the backend
            let applied = { ...newFilters }
            let rolesToSend = [...applied.roles]

            // If 'others' is selected and a specific 'othersRole' is chosen,
            // we replace 'others' with the specific role for the backend query.
            if (applied.roles.includes('others') && applied.othersRole) {
                rolesToSend = rolesToSend.filter((r) => r !== 'others')
                rolesToSend.push(applied.othersRole)
            }

            // Update the applied filters state. We create a version for the UI display
            // that keeps the specific role for the badge, but doesn't include 'others'.
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

    // Reset filters
    const resetFilters = useCallback(() => {
        const empty = { types: [], statuses: [], roles: [], collegeProgram: '', othersRole: '' }
        setFilters(empty)
        setAppliedFilters(empty)
        visit({ search: searchTerm || undefined, page: 1, perPage: pageSize, per_page: pageSize }, { preserve: true })
    }, [visit, searchTerm, pageSize])

    // Pagination
    const handlePage = useCallback(
        (page: number) => {
            let rolesToSend = [...appliedFilters.roles]
            // Re-apply the same logic for pagination requests
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
                    // othersRole is now part of the 'roles' array, no need to send separately
                    perPage: pageSize,
                    per_page: pageSize,
                },
                { preserve: true },
            )
        },
        [visit, searchTerm, appliedFilters, pageSize],
    )

    const crumbs: BreadcrumbItem[] = [
        {
            title: 'Time Keeping',
            href: '/time-keeping',
        },
    ]

    function capitalizeWords(str: string) {
        return str.replace(/\b\w/g, (c) => c.toUpperCase())
    }

    return (
        <AppLayout breadcrumbs={crumbs}>
            <Head title="Time Keeping" />
            <div className="flex h-full flex-col gap-4 overflow-hidden px-2 py-6 sm:px-4 md:px-8">
                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <div className="dark:bg-primary bg-primary/10 rounded-full border border-primary/20 p-3 dark:border-primary">
                        <Clock className="h-6 w-6 text-primary dark:text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Time Keeping</h1>
                        <p className="text-muted-foreground">View employee time keeping records.</p>
                    </div>
                </div>

                {/* SEARCH & CONTROLS */}
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        {/* Search Input */}
                        <div className="min-w-[200px] flex-1">
                            <EmployeeSearch initialSearch={searchTerm} onSearch={handleSearch} />
                        </div>
                        {/* Reset / Filter */}
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
                            <Button variant="secondary" type="button" onClick={() => setCalendarOpen(true)}>
                                <Calendar />
                                Calendar
                            </Button>
                            <Button variant="default" onClick={handleImportClick}>
                                <Import />
                                Import
                            </Button>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv,.xls,.xlsx" onChange={handleFileChange} />
                        </div>
                    </div>
                    {/* Category filter and Active Filters Preview in one line */}
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

                {/* TABLE & PAGINATION */}
                <div className="relative flex flex-1 flex-col">
                    <TableTimekeeping
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
                        onView={(emp) => setSelectedEmployee(emp)}
                        onBTR={(emp) => setSelectedBtrEmployee(emp)}
                    />
                </div>
            </div>
            {/* Floating Modal for Late/Early Departures */}
            {selectedEmployee && <TimeKeepingViewDialog employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />}
            {selectedBtrEmployee && <BTRDialog employee={selectedBtrEmployee} onClose={() => setSelectedBtrEmployee(null)} />}
            <CalendarViewDialog open={calendarOpen} onClose={() => setCalendarOpen(false)} />
        </AppLayout>
    )
}