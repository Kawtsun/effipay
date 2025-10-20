import * as React from 'react'
import { ColumnDef, getCoreRowModel, getSortedRowModel, PaginationState, SortingState, useReactTable } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Fingerprint, MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { EmployeeTypesBadges } from './employee-types-badges'
import { RolesTableBadge } from './roles-table-badge'
import { StatusBadge } from './status-badge'
import { cn } from '@/lib/utils'
import { Employees } from '@/types'
import { formatFullName } from '@/utils/formatFullName'
import { COLUMN_SIZES } from '@/constants/tableColumnSizes'

type TableTimekeepingProps = {
    data: Employees[]
    loading?: boolean
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
    onView: (emp: Employees) => void
    onBTR: (emp: Employees) => void
}

const MAX_ROWS = 10
const ROW_HEIGHT = 53 // 53px height for each row

export default function TableTimekeeping({
    data,
    loading = false,
    currentPage,
    totalPages,
    onPageChange,
    onPageSizeChange,
    onView,
    onBTR,
}: TableTimekeepingProps) {
    const density: 'comfortable' | 'compact' = 'compact'
    const stickyId = true
    const [isAnimating, setIsAnimating] = React.useState(false)

    type EmpType = { role: string; type: string }

    const normalizeEmployeeTypes = React.useCallback((raw: unknown): EmpType[] => {
        const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
        const extractType = (value: unknown): string | null => {
            if (typeof value === 'string') {
                const t = value.trim()
                return t.length ? t : null
            }
            if (isObject(value)) {
                const t = (value as Record<string, unknown>).type
                const et = (value as Record<string, unknown>).employee_type
                if (typeof t === 'string' && t.trim().length) return t.trim()
                if (typeof et === 'string' && et.trim().length) return et.trim()
            }
            return null
        }
        const extractRole = (value: unknown): string => (isObject(value) && typeof (value as Record<string, unknown>).role === 'string' && ((value as Record<string, unknown>).role as string).trim().length ? ((value as Record<string, unknown>).role as string).trim() : 'Employee')
        if (Array.isArray(raw)) {
            return (raw as unknown[])
                .map((item) => {
                    const type = extractType(item)
                    if (!type) return null
                    const role = extractRole(item)
                    return { type, role }
                })
                .filter((v): v is EmpType => v !== null)
        }
        const t = extractType(raw)
        return t ? [{ type: t, role: 'Employee' }] : []
    }, [])

    function ActionsMenu({ emp, onView, onBTR, menuActiveRef }: { emp: Employees; onView: (e: Employees) => void; onBTR: (e: Employees) => void; menuActiveRef: React.MutableRefObject<boolean> }) {
        const [open, setOpen] = React.useState(false)
        const handleOpenChange = (next: boolean) => {
            menuActiveRef.current = next
            setOpen(next)
        }
        return (
            <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                        aria-label="Actions"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault()
                            menuActiveRef.current = true
                            setOpen(false)
                            setTimeout(() => {
                                onView(emp)
                                menuActiveRef.current = false
                            }, 0)
                        }}
                    >
                        <Eye className="mr-2 h-4 w-4" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault()
                            menuActiveRef.current = true
                            setOpen(false)
                            setTimeout(() => {
                                onBTR(emp)
                                menuActiveRef.current = false
                            }, 0)
                        }}
                    >
                        <Fingerprint className="mr-2 h-4 w-4" /> Record
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    React.useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setIsAnimating(true), 100) // Small delay to trigger animation
            return () => clearTimeout(timer)
        } else {
            setIsAnimating(false)
        }
    }, [loading])

    const menuActiveRef = React.useRef(false)

    const columns = React.useMemo<ColumnDef<Employees>[]>(
        () => [
            {
                accessorKey: 'id',
                header: ({ column }) => (
                    <div className="px-2">
                        <Button variant="ghost" size="sm" className="data-[state=open]:bg-accent -ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                            <span className="text-xs font-semibold uppercase tracking-wide">Employee ID</span>
                            {column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-4 w-4" /> : column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}
                        </Button>
                    </div>
                ),
                cell: ({ row }) => <div className="px-4 py-2">{row.original.id}</div>,
                size: COLUMN_SIZES.id,
            },
            {
                id: 'name',
                accessorFn: (row) => formatFullName(row.last_name, row.first_name, row.middle_name).toLowerCase(),
                header: ({ column }) => (
                    <div className="px-2">
                        <Button variant="ghost" size="sm" className="data-[state=open]:bg-accent -ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                            <span className="text-xs font-semibold uppercase tracking-wide">Employee Name</span>
                            {column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-4 w-4" /> : column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}
                        </Button>
                    </div>
                ),
                cell: ({ row }) => <div className="px-4 py-2 font-medium text-foreground">{formatFullName(row.original.last_name, row.original.first_name, row.original.middle_name)}</div>,
                size: COLUMN_SIZES.name,
            },
            {
                id: 'employee_types',
                accessorFn: (row) => row.employee_types,
                header: () => <div className="px-4 text-xs font-semibold uppercase tracking-wide">Employee Type</div>,
                cell: ({ row }) => {
                    const raw = row.original.employee_types as unknown
                    const normalized = Array.isArray(raw) ? normalizeEmployeeTypes(raw) : normalizeEmployeeTypes(typeof raw === 'string' ? raw.split(',') : raw)
                    return <EmployeeTypesBadges employeeTypes={normalized} />
                },
                size: COLUMN_SIZES.employee_types,
                enableSorting: false,
            },
            {
                accessorKey: 'employee_status',
                header: ({ column }) => (
                    <div className="px-2">
                        <Button variant="ghost" size="sm" className="data-[state=open]:bg-accent -ml-2 h-8 px-2" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                            <span className="text-xs font-semibold uppercase tracking-wide">Status</span>
                            {column.getIsSorted() === 'desc' ? <ArrowDown className="ml-2 h-4 w-4" /> : column.getIsSorted() === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />}
                        </Button>
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="px-4 py-2">
                        <StatusBadge status={row.original.employee_status} />
                    </div>
                ),
                size: COLUMN_SIZES.employee_status,
            },
            {
                id: 'roles',
                accessorFn: (row) => row.roles,
                header: () => <div className="px-4 text-xs font-semibold uppercase tracking-wide">Roles</div>,
                cell: ({ row }) => {
                    const roles = row.original.roles ? row.original.roles.split(',').map((r) => r.trim()).filter(Boolean) : []
                    return <RolesTableBadge roles={roles} college_program={row.original.college_program} />
                },
                size: COLUMN_SIZES.roles,
                enableSorting: false,
            },
            {
                id: 'actions',
                enableSorting: false,
                header: () => <div className="px-4 py-2 text-right text-xs font-semibold tracking-wide uppercase">Actions</div>,
                cell: ({ row }) => {
                    const emp = row.original
                    return (
                        <div className="whitespace-nowrap px-4 py-2 text-right">
                            <ActionsMenu emp={emp} onView={onView} onBTR={onBTR} menuActiveRef={menuActiveRef} />
                        </div>
                    )
                },
                size: COLUMN_SIZES.actions,
            },
        ],
    [onView, onBTR, normalizeEmployeeTypes],
    )

    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: Math.max(0, currentPage - 1),
        pageSize: MAX_ROWS,
    })
    const [sorting, setSorting] = React.useState<SortingState>([])

    React.useEffect(() => {
        setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, currentPage - 1) }))
    }, [currentPage])

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

    // Do not emit page changes from local pagination; parent owns currentPage

    return (
        <div className="flex flex-1 flex-col">
            <div className="relative overflow-hidden rounded-lg border bg-card shadow-sm">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-black/70">
                        <Spinner className="h-10 w-10 animate-spin-slow text-primary" />
                    </div>
                )}
                <Table className="w-full min-w-[900px] select-none text-sm" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="sticky top-0 z-[1] bg-muted/50/80 backdrop-blur-sm">
                                {headerGroup.headers.map((header, idx) => (
                                    <TableHead
                                        key={header.id}
                                        className={cn('h-11 whitespace-nowrap text-muted-foreground/90', stickyId && idx === 0 ? 'sticky left-0 z-[2] bg-muted/50/80 backdrop-blur-sm' : '')}
                                        style={{ width: header.getSize() || undefined }}
                                    >
                                        {header.isPlaceholder ? null : typeof header.column.columnDef.header === 'function' ? header.column.columnDef.header(header.getContext()) : header.column.columnDef.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: pagination.pageSize }).map((_, i) => (
                                <TableRow key={`skeleton-${i}`} style={{ height: ROW_HEIGHT }}>
                                    {columns.map((col) => (
                                        <TableCell key={col.id ?? `col-${i}`} style={{ width: col.size }}>
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : data.length === 0 ? (
                            <>
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground" style={{ height: ROW_HEIGHT }}>
                                        No employees found
                                    </TableCell>
                                </TableRow>
                                {Array.from({ length: Math.max(0, pagination.pageSize - 1) }).map((_, i) => (
                                    <TableRow key={`empty-${i}`} style={{ height: ROW_HEIGHT }}>
                                        {columns.map((col) => (
                                            <TableCell key={col.id ?? `col-${i}`} />
                                        ))}
                                    </TableRow>
                                ))}
                            </>
                        ) : (
                            <>
                                {table.getRowModel().rows.map((row, index) => (
                                    <TableRow
                                        key={row.id}
                                        className={cn('transition-opacity duration-300 cursor-pointer hover:bg-muted/40', isAnimating ? 'opacity-100' : 'opacity-0')}
                                        style={{ transitionDelay: `${index * 30}ms` }}
                                        tabIndex={0}
                                        onClick={() => {
                                            if (menuActiveRef.current) return
                                            onView(row.original)
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                if (menuActiveRef.current) return
                                                onView(row.original)
                                            }
                                        }}
                                    >
                                        {row.getVisibleCells().map((cell, idx) => (
                                            <TableCell
                                                key={cell.id}
                                                className={cn(density === 'compact' ? 'py-1.5' : 'py-3', idx === 0 ? cn('pl-4', stickyId ? 'sticky left-0 z-[1] bg-inherit' : '') : '')}
                                                style={{ width: cell.column.getSize() || undefined }}
                                            >
                                                {typeof cell.column.columnDef.cell === 'function' ? cell.column.columnDef.cell(cell.getContext()) : cell.column.columnDef.cell}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                {Array.from({ length: Math.max(0, pagination.pageSize - data.length) }).map((_, i) => (
                                    <TableRow key={`empty-${i}`} style={{ height: ROW_HEIGHT }}>
                                        {columns.map((col) => (
                                            <TableCell key={col.id ?? `col-${i}`} />
                                        ))}
                                    </TableRow>
                                ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 flex min-h-[56px] items-center justify-between rounded-md border bg-card px-3 py-2 text-sm">
                <div className="flex-1 text-sm text-muted-foreground">
                    {data.length} row(s) loaded.
                </div>

                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Rows per page</p>
                        <Select
                            value={`${pagination.pageSize}`}
                            onValueChange={(value) => {
                                const size = Number(value)
                                setPagination((p) => ({ ...p, pageIndex: 0, pageSize: size }))
                                if (onPageSizeChange) onPageSizeChange(size)
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 25, 30, 40, 50].map((size) => (
                                    <SelectItem key={size} value={`${size}`}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Page {currentPage} of {totalPages}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="icon" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => onPageChange(1)} disabled={currentPage <= 1 || loading}>
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 p-0" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1 || loading}>
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 p-0" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages || loading}>
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => onPageChange(totalPages)} disabled={currentPage >= totalPages || loading}>
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}