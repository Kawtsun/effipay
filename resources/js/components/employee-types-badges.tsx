import * as React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
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

// Use shadcn Badge outline to match global badge styling
const EmployeeTypeBadge: React.FC<{ employeeType: EmployeeType; className?: string; variant?: Variant }> = ({ employeeType, className, variant = 'plain' }) => {
    if (variant === 'text') {
        return (
            <span className={cn('text-xs capitalize text-slate-600 dark:text-slate-300 truncate max-w-full', className)} title={employeeType.type}>
                {employeeType.type}
            </span>
        )
    }

    return (
        <Badge
            variant="outline"
            className={cn('max-w-full truncate capitalize', className)}
            title={employeeType.type}
        >
            {employeeType.type}
        </Badge>
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
                variant === 'text' ? (
                    <span className={cn('text-[10px] font-bold text-slate-500 dark:text-slate-400')}>+{additionalTypesCount}</span>
                ) : (
                    <Badge
                        variant="outline"
                        className="h-6 min-w-6 w-6 px-0 justify-center text-[10px] font-bold"
                    >
                        +{additionalTypesCount}
                    </Badge>
                )
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