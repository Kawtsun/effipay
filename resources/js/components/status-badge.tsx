import * as React from 'react'
import { cn } from '@/lib/utils'

type Variant = 'plain' | 'text'

interface StatusBadgeProps {
    status: string
    className?: string
    variant?: Variant // default: 'plain'; set to 'text' for text-only
}

// Use a single subdued style for all statuses to minimize visual weight
const baseSubduedClass =
    'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700'

export function StatusBadge({ status, className, variant = 'plain' }: StatusBadgeProps) {
    if (!status) return null

    if (variant === 'text') {
        return <span className={cn('text-xs capitalize text-slate-600 dark:text-slate-300', className)}>{status}</span>
    }

    return (
        <div className={cn(baseSubduedClass, className)}>
            <span className="capitalize">{status}</span>
        </div>
    )
}