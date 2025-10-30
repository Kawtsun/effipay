import * as React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type Variant = 'plain' | 'text'

interface StatusBadgeProps {
    status: string
    className?: string
    variant?: Variant // default: 'plain'; set to 'text' for text-only
}

export function StatusBadge({ status, className, variant = 'plain' }: StatusBadgeProps) {
    if (!status) return null

    if (variant === 'text') {
        return <span className={cn('text-xs capitalize', className)}>{status}</span>
    }

    // Use shadcn Badge with outline variant for consistent styling
    return (
        <Badge variant="outline" className={cn('capitalize', className)}>
            {status}
        </Badge>
    )
}