import * as React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Shield, GraduationCap, Book, User } from 'lucide-react'

interface RoleBadgeProps {
    role: string
    className?: string
}

const roleStyles: { [key: string]: { icon: React.ReactNode; className: string } } = {
    administrator: {
        icon: <Shield size={12} />,
        className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
    },
    'college instructor': {
        icon: <GraduationCap size={12} />,
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    },
    'basic education instructor': {
        icon: <Book size={12} />,
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    },
    default: {
        icon: <User size={12} />,
        className: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    },
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
    const style = roleStyles[role.toLowerCase()] || roleStyles.default
    return (
        <div
            className={cn(
                'inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                style.className,
                className
            )}
        >
            {style.icon}
            <span className="capitalize">{role}</span>
        </div>
    )
}

interface RolesTableBadgeProps {
    roles: string[]
}

export function RolesTableBadge({ roles }: RolesTableBadgeProps) {
    if (!roles || roles.length === 0) {
        return <div className="px-4 py-2 text-muted-foreground">Not Assigned</div>
    }

    const order = ['administrator', 'college instructor', 'basic education instructor']
    const sortedRoles = [...roles].sort((a, b) => {
        const indexA = order.indexOf(a)
        const indexB = order.indexOf(b)
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return a.localeCompare(b)
    })

    const mainRole = sortedRoles[0]
    const additionalRolesCount = sortedRoles.length - 1

    const badgeContent = (
        <span className="inline-flex items-center gap-1.5">
            <RoleBadge role={mainRole} />
            {additionalRolesCount > 0 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    +{additionalRolesCount}
                </div>
            )}
        </span>
    )

    if (sortedRoles.length <= 1) {
        return <div className="px-4 py-2 min-w-[160px]">{badgeContent}</div>
    }

    return (
        <div className="px-4 py-2 min-w-[160px]">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>{badgeContent}</div>
                    </TooltipTrigger>
                    <TooltipContent
                        side="top"
                        className="max-w-md rounded-xl border bg-card/80 p-3 text-card-foreground shadow-lg backdrop-blur-lg"
                    >
                        <div className="flex flex-col items-start gap-1.5">
                            <p className="mb-1 text-sm font-semibold">All Roles</p>
                            {sortedRoles.map((role) => (
                                <RoleBadge key={role} role={role} />
                            ))}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}