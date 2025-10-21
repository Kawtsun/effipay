import * as React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface EmployeeType {
    role: string
    type: string
}

type Variant = 'plain' | 'text'

interface EmployeeTypesBadgesProps {
    employeeTypes: EmployeeType[]
    variant?: Variant // default: 'plain' (subdued look); set to 'text' for text-only
    compact?: boolean // when true, remove outer padding/min-width for tight table rows
}

// Removed per-type style mapping to keep a subdued, consistent look

const EmployeeTypeBadge: React.FC<{ employeeType: EmployeeType; className?: string; variant?: Variant }> = ({ employeeType, className, variant = 'plain' }) => {
    if (variant === 'text') {
        return (
            <span className={cn('text-xs capitalize text-slate-600 dark:text-slate-300 truncate max-w-full', className)} title={employeeType.type}>
                {employeeType.type}
            </span>
        )
    }

    // Subdued, neutral badge (no per-type colors or icons)
    return (
        <div
            className={cn(
                'inline-flex max-w-full items-center gap-x-1.5 whitespace-nowrap overflow-hidden rounded-full border px-2.5 py-1 text-xs font-medium',
                'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700',
                className
            )}
            title={employeeType.type}
        >
            <span className="capitalize truncate">{employeeType.type}</span>
        </div>
    )
}

export function EmployeeTypesBadges({ employeeTypes, variant = 'plain', compact = false }: EmployeeTypesBadgesProps) {
    if (!Array.isArray(employeeTypes) || employeeTypes.length === 0) {
        // Keep this low emphasis as well
        return <div className="px-4 py-2 text-muted-foreground">Not Assigned</div>
    }

    const mainType = employeeTypes[0]
    const additionalTypesCount = employeeTypes.length - 1

    const badgeContent = (
        <span className="inline-flex items-center gap-1.5">
            <EmployeeTypeBadge employeeType={mainType} variant={variant} />
            {additionalTypesCount > 0 && (
                <div className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                    variant === 'text'
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700'
                )}>
                    +{additionalTypesCount}
                </div>
            )}
        </span>
    )

    if (employeeTypes.length <= 1) {
        return <div className={cn(compact ? 'px-0 py-0 min-w-0' : 'min-w-[160px] px-4 py-2')}>{badgeContent}</div>
    }

    return (
        <div className={cn(compact ? 'px-0 py-0 min-w-0' : 'min-w-[160px] px-4 py-2')}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>{badgeContent}</div>
                    </TooltipTrigger>
                    <TooltipContent
                        side="top"
                        className="max-w-md rounded-xl border bg-card/80 p-3 text-card-foreground shadow-lg backdrop-blur-lg"
                    >
                        <div className="flex flex-col items-start gap-2">
                            <p className="mb-1 text-sm font-semibold">All Employee Types</p>
                            {employeeTypes.map((type, index) => {
                                return (
                                    <div key={index} className="flex items-center gap-2">
                                        <EmployeeTypeBadge employeeType={type} variant={variant} />
                                        <span className="text-xs capitalize text-muted-foreground">{type.role}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}