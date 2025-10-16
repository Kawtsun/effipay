import * as React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Briefcase, Clock, ClipboardList, User } from 'lucide-react'

interface EmployeeType {
    role: string
    type: string
}

interface EmployeeTypesBadgesProps {
    employeeTypes: EmployeeType[]
}

const typeStyles: { [key: string]: { icon: React.ReactNode; className: string } } = {
    regular: {
        icon: <Briefcase size={12} />,
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    'full time': {
        icon: <Briefcase size={12} />,
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    'part time': {
        icon: <Clock size={12} />,
        className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    },
    provisionary: {
        icon: <ClipboardList size={12} />,
        className: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
    },
    default: {
        icon: <User size={12} />,
        className: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    },
}

const getTypeStyle = (type: string) => {
    const lowerType = type.toLowerCase()
    return typeStyles[lowerType] || typeStyles.default
}

const EmployeeTypeBadge: React.FC<{ employeeType: EmployeeType; className?: string }> = ({ employeeType, className }) => {
    const style = getTypeStyle(employeeType.type)
    return (
        <div
            className={cn(
                'inline-flex items-center gap-x-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
                style.className,
                className
            )}
        >
            {style.icon}
            <span className="capitalize">{employeeType.type}</span>
        </div>
    )
}

export function EmployeeTypesBadges({ employeeTypes }: EmployeeTypesBadgesProps) {
    if (!Array.isArray(employeeTypes) || employeeTypes.length === 0) {
        return <div className="px-4 py-2 text-muted-foreground">Not Assigned</div>
    }

    const mainType = employeeTypes[0]
    const additionalTypesCount = employeeTypes.length - 1

    const badgeContent = (
        <span className="inline-flex items-center gap-1.5">
            <EmployeeTypeBadge employeeType={mainType} />
            {additionalTypesCount > 0 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    +{additionalTypesCount}
                </div>
            )}
        </span>
    )

    if (employeeTypes.length <= 1) {
        return <div className="min-w-[160px] px-4 py-2">{badgeContent}</div>
    }

    return (
        <div className="min-w-[160px] px-4 py-2">
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
                                        <EmployeeTypeBadge employeeType={type} />
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