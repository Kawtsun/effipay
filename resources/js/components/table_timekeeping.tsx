import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Employees } from '@/types';
import { formatFullName } from '@/utils/formatFullName';
import { ColumnDef, getCoreRowModel, getSortedRowModel, PaginationState, SortingState, useReactTable } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Fingerprint } from 'lucide-react';
import * as React from 'react';
import { EmployeeTypesBadges } from './employee-types-badges';
import { RolesTableBadge } from './roles-table-badge';
import { StatusBadge } from './status-badge';

type TableTimekeepingProps = {
    data: Employees[];
    loading?: boolean;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onView: (emp: Employees) => void;
    onBTR: (emp: Employees) => void;
    activeRoles?: string[];
};

const DEFAULT_ROWS = 10;
const ROW_HEIGHT = 53;

export default function TableTimekeeping({
    data,
    loading = false,
    currentPage,
    totalPages,
    onPageChange,
    onPageSizeChange,
    onView,
    onBTR,
    activeRoles = [],
}: TableTimekeepingProps) {
    const density: 'comfortable' | 'compact' = 'compact';
    const stickyId = true;

    const columns = React.useMemo<ColumnDef<Employees>[]>(
        () => [
            {
                accessorKey: 'id',
                header: ({ column }) => (
                    <div className="px-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-2 h-8 px-2 data-[state=open]:bg-accent"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            <span className="text-xs font-semibold tracking-wide uppercase">Employee ID</span>
                            {column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="ml-2 h-4 w-4" />
                            ) : column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                            ) : (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
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
                        <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-2 h-8 px-2 data-[state=open]:bg-accent"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            <span className="text-xs font-semibold tracking-wide uppercase">Employee Name</span>
                            {column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="ml-2 h-4 w-4" />
                            ) : column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                            ) : (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
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
                id: 'employee_types',
                accessorFn: (row) => row.employee_types,
                header: () => <div className="px-4 text-xs font-semibold tracking-wide uppercase">Employee Type</div>,
                cell: ({ row }) => <EmployeeTypesBadges employeeTypes={row.original.employee_types} />,
                size: 200,
                enableSorting: false,
            },
            {
                accessorKey: 'employee_status',
                header: ({ column }) => (
                    <div className="px-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-2 h-8 px-2 data-[state=open]:bg-accent"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            <span className="text-xs font-semibold tracking-wide uppercase">Status</span>
                            {column.getIsSorted() === 'desc' ? (
                                <ArrowDown className="ml-2 h-4 w-4" />
                            ) : column.getIsSorted() === 'asc' ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                            ) : (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            )}
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
                header: () => <div className="px-4 text-xs font-semibold tracking-wide uppercase">Roles</div>,
                cell: ({ row }) => {
                    const roles = row.original.roles
                        ? row.original.roles
                              .split(',')
                              .map((r) => r.trim())
                              .filter(Boolean)
                        : [];
                    return <RolesTableBadge roles={roles} />;
                },
                size: 250,
                enableSorting: false,
            },
            {
                id: 'actions',
                enableSorting: false,
                header: () => <div className="px-4 py-2 text-right text-xs font-semibold tracking-wide uppercase">Actions</div>,
                cell: ({ row }) => {
                    const emp = row.original;
                    return (
                        <div className="px-4 py-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="secondary" onClick={() => onView(emp)}>
                                    <Eye />
                                    View
                                </Button>
                                <Button onClick={() => onBTR(emp)}>
                                    <Fingerprint />
                                    BTR
                                </Button>
                            </div>
                        </div>
                    );
                },
                size: 180,
            },
        ],
        [onView, onBTR, activeRoles],
    );

    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: Math.max(0, currentPage - 1),
        pageSize: DEFAULT_ROWS,
    });
    const [sorting, setSorting] = React.useState<SortingState>([]);

    React.useEffect(() => {
        setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, currentPage - 1) }));
    }, [currentPage]);

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
    });

    React.useEffect(() => {
        const nextPage = table.getState().pagination.pageIndex + 1;
        if (nextPage !== currentPage) {
            onPageChange(nextPage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table.getState().pagination.pageIndex]);

    return (
        <div className="relative flex flex-1 flex-col">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 transition-opacity duration-300 dark:bg-black/70" />
            )}

            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <Table className="w-full min-w-[900px] text-sm select-none" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-muted/50/80 sticky top-0 z-[1] backdrop-blur-sm">
                                {headerGroup.headers.map((header, idx) => (
                                    <TableHead
                                        key={header.id}
                                        className={cn(
                                            'h-11 whitespace-nowrap text-muted-foreground/90',
                                            stickyId && idx === 0 ? 'bg-muted/50/80 sticky left-0 z-[2] backdrop-blur-sm' : '',
                                        )}
                                        style={{ width: (header.getSize?.() as number) || undefined }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : typeof header.column.columnDef.header === 'function'
                                              ? (
                                                    header.column.columnDef.header as (ctx: {
                                                        column: typeof header.column;
                                                        table: typeof table;
                                                    }) => React.ReactNode
                                                )({ column: header.column, table })
                                              : header.column.columnDef.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground" style={{ width: '100%' }}>
                                    No employees found
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className={cn(
                                            'border-b transition-opacity duration-300 last:border-0 hover:bg-muted/40',
                                            loading ? 'opacity-50' : 'opacity-100',
                                        )}
                                    >
                                        {row.getVisibleCells().map((cell, idx) => (
                                            <TableCell
                                                key={cell.id}
                                                className={cn(
                                                    density === 'compact' ? 'py-1.5' : 'py-3',
                                                    idx === 0 ? cn('pl-4', stickyId ? 'sticky left-0 z-[1] bg-inherit' : '') : '',
                                                )}
                                                style={{ width: (cell.column.getSize?.() as number) || undefined }}
                                            >
                                                {(cell.column.columnDef.cell as (ctx: { row: typeof row }) => React.ReactNode)({ row })}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}

                                {Array.from({ length: Math.max(0, DEFAULT_ROWS - data.length) }).map((_, i) => (
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
                    <Select
                        value={`${pagination.pageSize}`}
                        onValueChange={(value) => {
                            const size = Number(value);
                            setPagination((p) => ({ ...p, pageIndex: 0, pageSize: size }));
                            if (onPageSizeChange) onPageSizeChange(size);
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
    );
}
