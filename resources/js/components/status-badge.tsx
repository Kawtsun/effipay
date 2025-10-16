import * as React from 'react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
    status: string
    className?: string
}

const statusStyles: { [key: string]: string } = {
    active: 'text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900/50',
    'paid leave': 'text-yellow-800 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/50',
    'maternity leave': 'text-yellow-800 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/50',
    'sick leave': 'text-yellow-800 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/50',
    'study leave': 'text-yellow-800 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/50',
    default: 'text-slate-800 bg-slate-100 dark:text-slate-300 dark:bg-slate-700',
}

const getStatusStyle = (status: string): string => {
    return statusStyles[status.toLowerCase()] || statusStyles.default
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    if (!status) return null

    return (
        <div
            className={cn(
                'inline-flex items-center gap-x-2 rounded-full px-2.5 py-1 text-xs font-semibold',
                getStatusStyle(status),
                className
            )}
        >
            <div className="h-2 w-2 rounded-full bg-current" />
            <span className="capitalize">{status}</span>
        </div>
    )
}