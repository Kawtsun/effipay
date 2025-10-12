import * as React from 'react'
import { ColumnDef, getCoreRowModel, getSortedRowModel, PaginationState, SortingState, useReactTable } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { Link } from '@inertiajs/react'

import { Button, buttonVariants } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { EmployeeTypesBadges } from '@/components/employee-types-badges'
import { RolesTableBadge } from '@/components/roles-table-badge'
import { StatusBadge } from '@/components/status-badge'
import { cn } from '@/lib/utils'
import { formatFullName } from '@/utils/formatFullName'
import { Employees } from '@/types'

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
}

const MAX_ROWS = 10
const ROW_HEIGHT = 53 // 53px height for each row

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
}: TableEmployeeProps) {
    const density: 'comfortable' | 'compact' = 'compact'
    const stickyId = true
    const [isAnimating, setIsAnimating] = React.useState(false)

    React.useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => setIsAnimating(true), 100) // Small delay to trigger animation
            return () => clearTimeout(timer)
        } else {
            setIsAnimating(false)
        }
    }, [loading])

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
                size: 120,
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
                size: 400,
            },
            {
                id: 'employee_types',
                accessorFn: (row) => row.employee_types,
                header: () => <div className="px-4 text-xs font-semibold uppercase tracking-wide">Employee Type</div>,
                cell: ({ row }) => <EmployeeTypesBadges employeeTypes={row.original.employee_types} />,
                size: 200,
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
                size: 180,
            },
            {
                id: 'roles',
                accessorFn: (row) => row.roles,
                header: () => <div className="px-4 text-xs font-semibold uppercase tracking-wide">Roles</div>,
                cell: ({ row }) => {
                    const roles = row.original.roles ? row.original.roles.split(',').map((r) => r.trim()).filter(Boolean) : []
                    return <RolesTableBadge roles={roles} />
                },
                size: 250,
                enableSorting: false,
            },
            {
                id: 'actions',
                enableSorting: false,
                header: () => <div className="text-right text-xs font-semibold uppercase tracking-wide px-4">Actions</div>,
                cell: ({ row }) => {
                    const emp = row.original
                    return (
                        <div className="px-4 py-2 whitespace-nowrap text-right">
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
                            <div className="md:hidden flex justify-end">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onView(emp)}>View</DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={editHrefFor(emp)}>Edit</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onDelete(emp)} className="text-destructive">
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    )
                },
                size: 220,
            },
        ],
        [onView, onDelete, editHrefFor],
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

    React.useEffect(() => {
        const nextPage = table.getState().pagination.pageIndex + 1
        if (nextPage !== currentPage) {
            onPageChange(nextPage)
        }
    }, [table.getState().pagination.pageIndex])

    return (
        <div className="flex flex-1 flex-col">
            <div className="overflow-hidden rounded-lg border bg-card shadow-sm relative">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-black/70">
                        <Spinner className="h-10 w-10 text-primary animate-spin-slow" />
                    </div>
                )}
                <Table className="select-none w-full min-w-[900px] text-sm" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-muted/50/80 backdrop-blur-sm sticky top-0 z-[1]">
                                {headerGroup.headers.map((header, idx) => (
                                    <TableHead key={header.id} className={cn('h-11 whitespace-nowrap text-muted-foreground/90', stickyId && idx === 0 ? 'sticky left-0 z-[2] bg-muted/50/80 backdrop-blur-sm' : '')} style={{ width: header.getSize() || undefined }}>
                                        {header.isPlaceholder ? null : typeof header.column.columnDef.header === 'function' ? header.column.columnDef.header(header.getContext()) : header.column.columnDef.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: MAX_ROWS }).map((_, i) => (
                                <TableRow key={`skeleton-${i}`} style={{ height: ROW_HEIGHT }}>
                                    {columns.map((col) => (
                                        <TableCell key={col.id} style={{ width: col.size }}>
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : data.length === 0 ? (
                            <>
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-10" style={{ height: ROW_HEIGHT }}>
                                        No employees found
                                    </TableCell>
                                </TableRow>
                                {Array.from({ length: MAX_ROWS - 1 }).map((_, i) => (
                                    <TableRow key={`empty-${i}`} style={{ height: ROW_HEIGHT }}>
                                        {columns.map((col) => (
                                            <TableCell key={col.id} />
                                        ))}
                                    </TableRow>
                                ))}
                            </>
                        ) : (
                            <>
                                {table.getRowModel().rows.map((row, index) => (
                                    <TableRow
                                        key={row.id}
                                        className={cn('transition-opacity duration-300', isAnimating ? 'opacity-100' : 'opacity-0')}
                                        style={{ transitionDelay: `${index * 30}ms` }}
                                    >
                                        {row.getVisibleCells().map((cell, idx) => (
                                            <TableCell key={cell.id} className={cn(density === 'compact' ? 'py-1.5' : 'py-3', idx === 0 ? cn('pl-4', stickyId ? 'sticky left-0 z-[1] bg-inherit' : '') : '')} style={{ width: cell.column.getSize() || undefined }}>
                                                {typeof cell.column.columnDef.cell === 'function' ? cell.column.columnDef.cell(cell.getContext()) : cell.column.columnDef.cell}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                {Array.from({ length: Math.max(0, MAX_ROWS - data.length) }).map((_, i) => (
                                    <TableRow key={`empty-${i}`} style={{ height: ROW_HEIGHT }}>
                                        {columns.map((col) => (
                                            <TableCell key={col.id} />
                                        ))}
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
                    <Select
                        value={`${pagination.pageSize}`}
                        onValueChange={(value) => {
                            const size = Number(value)
                            setPagination((p) => ({ ...p, pageIndex: 0, pageSize: size }))
                            if (onPageSizeChange) onPageSizeChange(size)
                        }}
                    >
                        <SelectTrigger className="h-8 w-[80px]">
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
                    <span className="hidden sm:inline">
                        Page {currentPage} of {totalPages}
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" className="hidden size-8 lg:flex" onClick={() => onPageChange(1)} disabled={currentPage <= 1 || loading}>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1 || loading}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-8" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages || loading}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="hidden size-8 lg:flex" onClick={() => onPageChange(totalPages)} disabled={currentPage >= totalPages || loading}>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}