import * as React from 'react'
import {
    ColumnDef,
    getCoreRowModel,
    getSortedRowModel,
    PaginationState,
    SortingState,
    useReactTable,
} from '@tanstack/react-table'
import { Eye, Pencil, Trash, Shield, GraduationCap, Book, User, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, MoreHorizontal } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Employees } from '@/types'
import { Link } from '@inertiajs/react'
import { formatFullName } from '@/utils/formatFullName'

type TableEmployeeProps = {
    data: Employees[]
    loading?: boolean
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
    onView: (emp: Employees) => void
    onDelete: (emp: Employees) => void
    editHrefFor: (emp: Employees) => string
    activeRoles?: string[]
}

const MAX_ROWS = 10
const ROW_HEIGHT = 53

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
    const found = COLLEGE_PROGRAMS.find(p => p.value === acronym)
    return found ? found.label : acronym
}

function capitalizeWords(str: string) {
    return str.replace(/\b\w/g, c => c.toUpperCase())
}

export default function TableEmployee({
    data,
    loading = false,
    currentPage,
    totalPages,
    onPageChange,
    onPageSizeChange,
    onView,
    onDelete,
    editHrefFor,
    activeRoles = [],
}: TableEmployeeProps) {
    const density: 'comfortable' | 'compact' = 'compact'
    const stickyId = true

    const columns = React.useMemo<ColumnDef<Employees>[]>(() => [
        {
            accessorKey: 'id',
            header: ({ column }) => (
                <div className="px-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="data-[state=open]:bg-accent -ml-2 h-8 px-2"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        <span className="text-xs font-semibold uppercase tracking-wide">Employee ID</span>
                        {column.getIsSorted() === 'desc' ? (
                            <ArrowDown />
                        ) : column.getIsSorted() === 'asc' ? (
                            <ArrowUp />
                        ) : (
                            <ArrowUpDown />
                        )}
                    </Button>
                </div>
            ),
            cell: ({ row }) => (
                <div className="px-4 py-2">{row.original.id}</div>
            ),
            size: 120,
        },
        {
            id: 'name',
            accessorFn: (row) => formatFullName(row.last_name, row.first_name, row.middle_name).toLowerCase(),
            header: ({ column }) => (
                <div className="px-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="data-[state=open]:bg-accent -ml-2 h-8 px-2"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        <span className="text-xs font-semibold uppercase tracking-wide">Employee Name</span>
                        {column.getIsSorted() === 'desc' ? (
                            <ArrowDown />
                        ) : column.getIsSorted() === 'asc' ? (
                            <ArrowUp />
                        ) : (
                            <ArrowUpDown />
                        )}
                    </Button>
                </div>
            ),
            cell: ({ row }) => (
                <div className="px-4 py-2">{formatFullName(row.original.last_name, row.original.first_name, row.original.middle_name)}</div>
            ),
            size: 400,
        },
        {
            accessorKey: 'employee_type',
            header: ({ column }) => (
                <div className="px-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="data-[state=open]:bg-accent -ml-2 h-8 px-2"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        <span className="text-xs font-semibold uppercase tracking-wide">Employee Type</span>
                        {column.getIsSorted() === 'desc' ? (
                            <ArrowDown />
                        ) : column.getIsSorted() === 'asc' ? (
                            <ArrowUp />
                        ) : (
                            <ArrowUpDown />
                        )}
                    </Button>
                </div>
            ),
            cell: ({ row }) => (
                <div className="px-4 py-2">{row.original.employee_type}</div>
            ),
            size: 160,
        },
        {
            accessorKey: 'employee_status',
            header: ({ column }) => (
                <div className="px-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="data-[state=open]:bg-accent -ml-2 h-8 px-2"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        <span className="text-xs font-semibold uppercase tracking-wide">Employee Status</span>
                        {column.getIsSorted() === 'desc' ? (
                            <ArrowDown />
                        ) : column.getIsSorted() === 'asc' ? (
                            <ArrowUp />
                        ) : (
                            <ArrowUpDown />
                        )}
                    </Button>
                </div>
            ),
            cell: ({ row }) => (
                <div className="px-4 py-2">{row.original.employee_status}</div>
            ),
            size: 160,
        },
        {
            id: 'roles',
            enableSorting: false,
            header: () => (
                <div className="px-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="data-[state=open]:bg-accent -ml-2 h-8 px-2"
                        disabled
                    >
                        <span className="text-xs font-semibold uppercase tracking-wide">Roles</span>
                        <ArrowUpDown />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const emp = row.original
                if (!emp.roles) return null
                const rolesArr = emp.roles.split(',').map(r => r.trim()).filter(Boolean)
                const order = ['administrator', 'college instructor', 'basic education instructor']
                let displayRoles = rolesArr
                if (activeRoles.length > 0) {
                    const filtered = activeRoles.filter(r => rolesArr.includes(r))
                    const rest = rolesArr.filter(r => !filtered.includes(r))
                    displayRoles = [...filtered, ...rest]
                } else {
                    const ordered = order.filter(r => rolesArr.includes(r))
                    const custom = rolesArr.filter(r => !order.includes(r))
                    displayRoles = [...ordered, ...custom]
                }
                if (displayRoles.length === 0) return null
                const mainRole = displayRoles[0]
                const additionalRolesCount = displayRoles.length - 1
                let color: 'secondary' | 'info' | 'purple' | 'warning' = 'secondary'
                let icon: React.ReactNode = null
                if (mainRole === 'administrator') {
                    color = 'info'
                    icon = <Shield className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />
                } else if (mainRole === 'college instructor') {
                    color = 'purple'
                    icon = <GraduationCap className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />
                } else if (mainRole === 'basic education instructor') {
                    color = 'warning'
                    icon = <Book className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />
                } else {
                    color = 'purple'
                    icon = <User className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />
                }
                const tooltipContent = (
                    <div className="flex flex-wrap gap-2">
                        {displayRoles.map(role => {
                            let c: 'secondary' | 'info' | 'purple' | 'warning' = 'secondary'
                            let i: React.ReactNode = null
                            let e: React.ReactNode = null
                            if (role === 'administrator') {
                                c = 'info'
                                i = <Shield className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />
                            } else if (role === 'college instructor') {
                                c = 'purple'
                                i = <GraduationCap className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />
                                if (emp.college_program) {
                                    e = <span className="ml-1 text-xs font-semibold text-white">[{emp.college_program}] {getCollegeProgramLabel(emp.college_program)}</span>
                                }
                            } else if (role === 'basic education instructor') {
                                c = 'warning'
                                i = <Book className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />
                            } else {
                                c = 'purple'
                                i = <User className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />
                            }
                            return (
                                <Badge
                                    key={role}
                                    variant={c}
                                    className={cn('capitalize flex items-center', !order.includes(role) ? ' custom-role-badge' : '')}
                                >
                                    {i}{capitalizeWords(role)}{e}
                                </Badge>
                            )
                        })}
                    </div>
                )
                const badgeContent = (
                    <span className="inline-flex items-center gap-1">
                        <Badge
                            key={mainRole}
                            variant={color}
                            className={cn('capitalize flex items-center', !order.includes(mainRole) ? ' custom-role-badge' : '')}
                        >
                            {icon}{capitalizeWords(mainRole)}{mainRole === 'college instructor' && emp.college_program ? <span className="ml-1 text-xs font-semibold text-white">[{emp.college_program}]</span> : null}
                        </Badge>
                        {additionalRolesCount > 0 && (
                            <Badge variant="success" className="cursor-pointer">+{additionalRolesCount}</Badge>
                        )}
                    </span>
                )
                if (displayRoles.length === 1 && mainRole !== 'college instructor') {
                    return <div className="px-4 py-2 min-w-[160px]">{badgeContent}</div>
                }
                return (
                    <div className="px-4 py-2 min-w-[160px]">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
                                <TooltipContent side="top" className="max-w-lg px-4 py-3 whitespace-pre-line break-words">{tooltipContent}</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )
            },
            size: 350,
        },
        {
            id: 'actions',
            enableSorting: false,
            header: () => (
                <div className="text-right text-xs font-semibold uppercase tracking-wide px-4 py-2">Actions</div>
            ),
            cell: ({ row }) => {
                const emp = row.original
                return (
                    <div className="px-4 py-2 whitespace-nowrap text-right">
                        {/* Desktop actions */}
                        <div className="hidden md:flex justify-end items-center gap-2">
                            <Button variant="secondary" onClick={() => onView(emp)}>
                                <Eye />
                                View
                            </Button>
                            <Link href={editHrefFor(emp)} className={buttonVariants({ variant: 'default' })}>
                                <Pencil />
                                Edit
                            </Link>
                            <Button variant="destructive" onClick={() => onDelete(emp)}>
                                <Trash />
                                Delete
                            </Button>
                        </div>
                        {/* Mobile actions */}
                        <div className="md:hidden flex justify-end">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => onView(emp)}>
                                        View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={editHrefFor(emp)} className={buttonVariants({ variant: 'ghost' })}>Edit</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onDelete(emp)}>
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                )
            },
            size: 180,
        },
    ], [onView, onDelete, editHrefFor, activeRoles])

    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: Math.max(0, currentPage - 1),
        pageSize: MAX_ROWS,
    })
    const [sorting, setSorting] = React.useState<SortingState>([])

    React.useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: Math.max(0, currentPage - 1) }))
    }, [currentPage])

    // No local persistence for page size; always reset to default when page mounts

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onPaginationChange: setPagination,
        manualPagination: true,
        pageCount: totalPages,
        onSortingChange: setSorting,
        state: { pagination, sorting },
    })

    React.useEffect(() => {
        const nextPage = table.getState().pagination.pageIndex + 1
        if (nextPage !== currentPage) {
            onPageChange(nextPage)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table.getState().pagination.pageIndex])

    return (
        <div className="relative flex flex-1 flex-col">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 transition-opacity duration-300 dark:bg-black/70">
                    {/* Spinner is shown in parent; keep overlay only */}
                </div>
            )}

            {/* Toolbar removed per request */}

            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <Table className="select-none w-full min-w-[900px] text-sm" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id} className="bg-muted/50/80 backdrop-blur-sm sticky top-0 z-[1]">
                                {headerGroup.headers.map((header, idx) => (
                                    <TableHead key={header.id} className={cn('h-11 whitespace-nowrap text-muted-foreground/90', stickyId && idx === 0 ? 'sticky left-0 z-[2] bg-muted/50/80 backdrop-blur-sm' : '')} style={{ width: (header.getSize?.() as number) || undefined }}>
                                        {header.isPlaceholder ? null : (
                                            typeof header.column.columnDef.header === 'function'
                                                ? (header.column.columnDef.header as (ctx: { column: typeof header.column; table: typeof table }) => React.ReactNode)({ column: header.column, table })
                                                : header.column.columnDef.header
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-10" style={{ width: '100%' }}>
                                    No employees found
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {table.getRowModel().rows.map(row => (
                                    <TableRow key={row.id} className={cn(
                                        'transition-opacity duration-300 border-b last:border-0 hover:bg-muted/40',
                                        loading ? 'opacity-50' : 'opacity-100'
                                    )}>
                                        {row.getVisibleCells().map((cell, idx) => (
                                            <TableCell key={cell.id} className={cn(
                                                density === 'compact' ? 'py-1.5' : 'py-3',
                                                idx === 0 ? cn('pl-4', stickyId ? 'sticky left-0 z-[1] bg-inherit' : '') : ''
                                            )} style={{ width: (cell.column.getSize?.() as number) || undefined }}>
                                            {(cell.column.columnDef.cell as (ctx: { row: typeof row }) => React.ReactNode)({ row })}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}

                                {Array.from({ length: Math.max(0, MAX_ROWS - data.length) }).map((_, i) => (
                                    <TableRow key={`empty-${i}`}>
                                        <TableCell style={{ width: 120, height: ROW_HEIGHT }} />
                                        <TableCell style={{ width: 200, height: ROW_HEIGHT }} />
                                        <TableCell style={{ width: 160, height: ROW_HEIGHT }} />
                                        <TableCell style={{ width: 160, height: ROW_HEIGHT }} />
                                        <TableCell style={{ width: 240, height: ROW_HEIGHT }} />
                                        <TableCell style={{ width: 180, height: ROW_HEIGHT }} />
                                    </TableRow>
                                ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 flex min-h-[56px] items-center justify-between rounded-md border bg-card px-3 py-2 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <span>Rows per page</span>
                    <Select value={`${pagination.pageSize}`} onValueChange={(value) => {
                        const size = Number(value)
                        setPagination(p => ({ ...p, pageIndex: 0, pageSize: size }))
                        if (onPageSizeChange) onPageSizeChange(size)
                    }}>
                        <SelectTrigger className="h-8 w-[80px]">
                            <SelectValue placeholder={pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 25, 30, 40, 50].map(size => (
                                <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="hidden sm:inline">Page {currentPage} of {totalPages}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage <= 1}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage >= totalPages}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight />
                    </Button>
                </div>
            </div>
        </div>
    )
}


