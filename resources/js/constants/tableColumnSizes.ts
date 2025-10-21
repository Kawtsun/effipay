export const COLUMN_SIZES = {
    id: 120,
    name: 400,
    employee_types: 200,
    employee_status: 180,
    roles: 250,
    actions: 160,
} as const

export type ColumnSizeKey = keyof typeof COLUMN_SIZES
