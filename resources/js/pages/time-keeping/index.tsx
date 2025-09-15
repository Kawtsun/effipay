type FilterState = { types: string[]; statuses: string[]; roles: string[] };
const MIN_SPINNER_MS = 400;
import EmployeeFilter from '@/components/employee-filter';
// @ts-ignore
import Encoding from 'encoding-japanese';
import EmployeePagination from '@/components/employee-pagination';
import EmployeeSearch from '@/components/employee-search';
import TimeKeepingViewDialog from '@/components/timekeeping-view-dialog';
import BTRDialog from '@/components/btr-dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { BreadcrumbItem, Employees } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Users, Shield, GraduationCap, Book, Eye, Import, Fingerprint, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import Papa from 'papaparse';
// @ts-ignore
import * as XLSX from 'xlsx';

export default function TimeKeeping() {
    const [selectedEmployee, setSelectedEmployee] = useState<Employees | null>(null);
    const [selectedBtrEmployee, setSelectedBtrEmployee] = useState<Employees | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_ROWS = 10;
    const ROW_HEIGHT = 53; // px

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        const validExtensions = ['.csv', '.xls', '.xlsx'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
            toast.error('Invalid file type. Only CSV or Excel files are accepted.');
            return;
        }

    let rows: Record<string, unknown>[] = [];
    const importToast = toast.loading('Importing file...');
    // Show loading toast for at least 1.5s before verifying file
    setTimeout(() => {
        if (ext === '.csv') {
            file.arrayBuffer().then(buffer => {
                // Use encoding.js to auto-detect and convert encoding to UTF-8
                const uint8Array = new Uint8Array(buffer);
                const detected = Encoding.detect(uint8Array);
                const text = Encoding.convert(uint8Array, {
                    to: 'UNICODE',
                    from: detected,
                    type: 'string'
                });
                // Strip BOM if present
                let cleanText = text;
                if (cleanText.charCodeAt(0) === 0xFEFF) {
                    cleanText = cleanText.slice(1);
                }
                console.log('Raw CSV text:', cleanText);
                const result = Papa.parse(cleanText, {
                    header: true,
                    skipEmptyLines: true,
                    transform: (value: string) => value ? value.normalize('NFC') : value,
                    error: (err: Error) => {
                        console.error('PapaParse error:', err);
                    }
                });
                console.log('Parsed rows:', result.data);
                // Log and filter out empty/malformed rows
                const validRows = (result.data as Record<string, unknown>[]).filter((row) => row && Object.values(row).some(v => v !== null && v !== undefined && v !== ''));
                if (validRows.length !== (result.data as Record<string, unknown>[]).length) {
                    toast.warning(`Some rows were skipped due to parsing errors. Imported ${validRows.length} of ${(result.data as Record<string, unknown>[]).length} rows.`, { duration: 5000, id: `skipped-${Date.now()}` });
                }
                rows = validRows;
                // Add another delay before removing loading toast and showing result
                setTimeout(() => {
                    sendImport(rows, file.name, importToast);
                }, 1000);
            });
        } else {
            file.arrayBuffer().then(data => {
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                rows = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
                setTimeout(() => {
                    sendImport(rows, file.name, importToast);
                }, 1000);
            });
        }
    }, 1500);
        function sendImport(rows: Record<string, unknown>[], fileName: string, toastId: string | number) {
            fetch('/time-keeping/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ records: rows }),
            })
                .then(async response => {
                    // Dismiss loading toast first, then show result toast
                    toast.dismiss(typeof toastId === 'number' ? undefined : toastId);
                    if (response.ok) {
                        toast.success(`Successfully imported: ${fileName}`, { id: `success-${Date.now()}`, duration: 6000 });
                        router.reload({ only: ['employees', 'currentPage', 'totalPages', 'search', 'filters'] });
                    } else {
                        let errorMsg = 'Import failed.';
                        try {
                            const errorData = await response.json();
                            if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                                errorMsg = errorData.errors.join('\n');
                            }
                        } catch (err) {
                            // Could not parse error JSON
                            console.error('Error parsing import error response:', err);
                        }
                        toast.error(errorMsg, { duration: 6000 });
                    }
                })
                .catch((err) => {
                    toast.error('Import failed.');
                    toast.dismiss(typeof toastId === 'number' ? undefined : toastId);
                    console.error('Import failed:', err);
                });
        }
    };

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
            { value: 'CG', label: 'Career Guidance or Computer Graphics' },
            { value: 'BSPT', label: 'Bachelor of Science in Physical Therapy' },
            { value: 'GSP', label: 'GSIS Scholarship' },
            { value: 'MBA', label: 'Master of Business Administration' },
        ];
        const found = COLLEGE_PROGRAMS.find(p => p.value === acronym);
        return found ? found.label : acronym;
    }
    const page = usePage();
    const {
        employees = [],
        currentPage = 1,
        totalPages = 1,
        search: initialSearch = '',
        filters: initialFiltersRaw = { types: [], statuses: [], roles: [] },
    } = page.props as {
        employees?: Employees[];
        currentPage?: number;
        totalPages?: number;
        search?: string;
        filters?: FilterState;
    };

    const initialFilters = initialFiltersRaw || { types: [], statuses: [], roles: [] };
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const toArray = (val: unknown) => Array.isArray(val) ? val : val ? [val] : [];
    const [filters, setFilters] = useState<FilterState>({
        ...initialFilters,
        roles: toArray(initialFilters.roles),
    });
    const [appliedFilters, setAppliedFilters] = useState<FilterState>({
        ...initialFilters,
        roles: toArray(initialFilters.roles),
    });
    const [loading, setLoading] = useState(false);
    const spinnerStart = useRef<number>(0);

    // Visit helper
    const visit = useCallback((params: Partial<{ search: string; page: number; types: string[]; statuses: string[]; roles: string[] }>, options: { preserve?: boolean } = {}) => {
        spinnerStart.current = Date.now();
        setLoading(true);
        router.visit(route('time-keeping.index'), {
            method: 'get',
            data: params,
            preserveState: options.preserve ?? false,
            preserveScroll: true,
            only: ['employees', 'currentPage', 'totalPages', 'search', 'filters'],
            onFinish: () => {
                const elapsed = Date.now() - spinnerStart.current;
                const wait = Math.max(0, MIN_SPINNER_MS - elapsed);
                setTimeout(() => setLoading(false), wait);
            },
        });
    }, []);

    // Search handler
    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
        visit({
            search: term || undefined,
            page: 1,
            types: appliedFilters.types.length ? appliedFilters.types : undefined,
            statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
            roles: appliedFilters.roles.length ? appliedFilters.roles : undefined,
        }, { preserve: true });
    }, [visit, appliedFilters]);

    // Filter apply
    const handleFilterChange = useCallback((newFilters: FilterState) => {
        setFilters(newFilters);
        setAppliedFilters(newFilters);
        visit({
            search: searchTerm || undefined,
            page: 1,
            types: newFilters.types.length ? newFilters.types : undefined,
            statuses: newFilters.statuses.length ? newFilters.statuses : undefined,
            roles: newFilters.roles.length ? newFilters.roles : undefined,
        }, { preserve: true });
    }, [visit, searchTerm]);

    // Reset filters
    const resetFilters = useCallback(() => {
        const empty = { types: [], statuses: [], roles: [] };
        setFilters(empty);
        setAppliedFilters(empty);
        visit({ search: searchTerm || undefined, page: 1 }, { preserve: true });
    }, [visit, searchTerm]);

    // Pagination
    const handlePage = useCallback((page: number) => {
        visit({
            search: searchTerm || undefined,
            page,
            types: appliedFilters.types.length ? appliedFilters.types : undefined,
            statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
            roles: appliedFilters.roles.length ? appliedFilters.roles : undefined,
        }, { preserve: true });
    }, [visit, searchTerm, appliedFilters]);

    const crumbs: BreadcrumbItem[] = [
        {
            title: 'Time Keeping',
            href: '/time-keeping',
        },
    ];

    function capitalizeWords(str: string) {
        return str.replace(/\b\w/g, c => c.toUpperCase());
    }

    return (
        <AppLayout breadcrumbs={crumbs}>
            <Head title="Time Keeping" />
            <div className="flex h-full flex-col gap-4 overflow-hidden py-6 px-2 sm:px-4 md:px-8">
                {/* HEADER */}
                <div className="flex-none">
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                        <Users className="h-6 w-6 text-primary" />
                        Time Keeping
                    </h1>
                    <p className="text-sm text-muted-foreground">View employee time keeping records.</p>
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
                                onChange={newFilters => handleFilterChange({ ...filters, ...newFilters })}
                            />
                            <Button variant="default" onClick={handleImportClick}>
                                <Import />
                                Import
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".csv,.xls,.xlsx"
                                onChange={handleFileChange}
                            />
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
                                    <TableHead style={{ width: 400 }} className='text-xs font-semibold uppercase tracking-wide text-left px-4 py-2'>Employee Name</TableHead>
                                    <TableHead style={{ width: 160 }} className='text-xs font-semibold uppercase tracking-wide text-left px-4 py-2'>Employee Type</TableHead>
                                    <TableHead style={{ width: 160 }} className='text-xs font-semibold uppercase  tracking-wide text-left px-4 py-2'>Employee Status</TableHead>
                                    <TableHead style={{ width: 350 }} className="text-xs font-semibold uppercase  tracking-wide text-left px-4 py-2">Roles</TableHead>
                                    <TableHead style={{ width: 180 }} className='text-right text-xs font-semibold uppercase  tracking-wide px-4 py-2'>Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground" style={{ width: '100%' }}>
                                            No employees found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {employees.map((emp: Employees) => (
                                            <TableRow
                                                key={emp.id}
                                                className="transition-opacity duration-300"
                                            >
                                                <TableCell style={{ width: 120 }} className="px-4 py-2">{emp.id}</TableCell>
                                                <TableCell style={{ width: 400 }} className="px-4 py-2">{`${emp.last_name}, ${emp.first_name} ${emp.middle_name}`.toLocaleUpperCase('en-US')}</TableCell>
                                                <TableCell style={{ width: 160 }} className="px-4 py-2">{emp.employee_type}</TableCell>
                                                <TableCell style={{ width: 160 }} className="px-4 py-2">{emp.employee_status}</TableCell>
                                                <TableCell style={{ width: 350 }} className="px-4 py-2 min-w-[160px]">
                                                    {(() => {
                                                        if (!emp.roles) return '';
                                                        const rolesArr = emp.roles.split(',').map((r: string) => r.trim()).filter(Boolean);
                                                        const order = ['administrator', 'college instructor', 'basic education instructor'];
                                                        let displayRoles = rolesArr;
                                                        if (appliedFilters.roles.length > 0) {
                                                            const filtered = appliedFilters.roles.filter(r => rolesArr.includes(r));
                                                            const rest = rolesArr.filter((r: string) => !filtered.includes(r));
                                                            displayRoles = [...filtered, ...rest];
                                                        } else {
                                                            displayRoles = order.filter(r => rolesArr.includes(r));
                                                        }
                                                        if (displayRoles.length === 0) return '';
                                                        const mainRole = displayRoles[0];
                                                        const additionalRolesCount = displayRoles.length - 1;
                                                        let color: 'secondary' | 'info' | 'purple' | 'warning' = 'secondary';
                                                        let icon = null;
                                                        if (mainRole === 'administrator') {
                                                            color = 'info';
                                                            icon = <Shield className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                                                        } else if (mainRole === 'college instructor') {
                                                            color = 'purple';
                                                            icon = <GraduationCap className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                                                        } else if (mainRole === 'basic education instructor') {
                                                            color = 'warning';
                                                            icon = <Book className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
                                                        }
                                                        // Tooltip: all roles as badges, with full program name for college instructor
                                                        const tooltipContent = (
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
                                                                            e = <span className="ml-1 text-xs font-semibold text-white">[{emp.college_program}] {getCollegeProgramLabel(emp.college_program)}</span>;
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
                                                        );
                                                        // Main badge: show acronym for college instructor, +N for additional roles
                                                        const badgeContent = (
                                                            <span className="inline-flex items-center gap-1">
                                                                <Badge key={mainRole} variant={color} className="capitalize flex items-center">
                                                                    {icon}{capitalizeWords(mainRole)}{mainRole === 'college instructor' && emp.college_program ? <span className="ml-1 text-xs font-semibold text-white">[{emp.college_program}]</span> : null}
                                                                </Badge>
                                                                {additionalRolesCount > 0 && (
                                                                    <Badge variant="success" className="cursor-pointer">+{additionalRolesCount}</Badge>
                                                                )}
                                                            </span>
                                                        );
                                                        // Tooltip logic
                                                        // Only one role and not college instructor: no tooltip
                                                        if (displayRoles.length === 1 && mainRole !== 'college instructor') {
                                                            return badgeContent;
                                                        }
                                                        // Otherwise, show tooltip (for college instructor or multiple roles)
                                                        return (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
                                                                    <TooltipContent side="top" className="max-w-lg px-4 py-3 whitespace-pre-line break-words">{tooltipContent}</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell style={{ width: 180 }} className="px-4 py-2 whitespace-nowrap text-right">
                                                    <div className='flex justify-end items-center gap-2'>
                                                        <Button variant="secondary" onClick={() => { setSelectedEmployee(emp); }}>
                                                            <Eye />
                                                            View
                                                        </Button>
                                                        <Button onClick={() => setSelectedBtrEmployee(emp)}>
                                                            <Fingerprint />
                                                            BTR
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

                    <div className="mt-4 flex min-h-[56px] justify-center">
                        <EmployeePagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePage} />
                    </div>
                </div>
            </div>
            {/* Floating Modal for Late/Early Departures */}
            {selectedEmployee && (
                <TimeKeepingViewDialog
                    employee={selectedEmployee}
                    onClose={() => setSelectedEmployee(null)}
                />
            )}
            {selectedBtrEmployee && (
                <BTRDialog
                    employee={selectedBtrEmployee}
                    onClose={() => setSelectedBtrEmployee(null)}
                />
            )}
        </AppLayout>
    );
}
