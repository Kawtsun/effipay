import * as React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Shield, GraduationCap, Book, User } from 'lucide-react'
import { COLLEGE_PROGRAMS } from '@/constants/college-programs'

interface RoleBadgeProps {
    role: string
    className?: string
    program?: string
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

const getProgramLabel = (programValue?: string) => {
    if (!programValue) return ''
    const program = COLLEGE_PROGRAMS.find((p) => p.value === programValue)
    return program ? program.label : ''
}


const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className, program }) => {
    const style = roleStyles[role.toLowerCase()] || roleStyles.default
    return (
        <div
            className={cn(
                'inline-flex items-center gap-x-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
                style.className,
                className
            )}
        >
            {style.icon}
            <span className="capitalize">{role}</span>
            {program && <span className="font-bold">[{program}]</span>}
        </div>
    )
}

interface RolesTableBadgeProps {
    roles: string[]
    college_program?: string
}

export function RolesTableBadge({ roles, college_program }: RolesTableBadgeProps) {
    if (!roles || roles.length === 0) {
        return <div className="px-4 py-2 text-muted-foreground">Not Assigned</div>
    }

    const order = ['administrator', 'college instructor', 'basic education instructor']
    const sortedRoles = [...roles].sort((a, b) => {
        const indexA = order.indexOf(a.toLowerCase())
        const indexB = order.indexOf(b.toLowerCase())
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return a.localeCompare(b)
    })

    const mainRole = sortedRoles[0]
    const additionalRolesCount = sortedRoles.length - 1
    const isMainRoleCollegeInstructor = mainRole.toLowerCase() === 'college instructor'

    const programs = college_program ? college_program.split(',').map(p => p.trim()) : [];
    let displayProgram = college_program;
    if (isMainRoleCollegeInstructor && programs.length > 1) {
        displayProgram = `${programs[0]},...`;
    }

    const badgeContent = (
        <span className="inline-flex items-center gap-1.5">
            <RoleBadge role={mainRole} program={isMainRoleCollegeInstructor ? displayProgram : undefined} />
            {additionalRolesCount > 0 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    +{additionalRolesCount}
                </div>
            )}
        </span>
    )

    const hasMultipleRoles = sortedRoles.length > 1
    const hasSingleCollegeInstructorRole = sortedRoles.length === 1 && isMainRoleCollegeInstructor && !!college_program

    if (!hasMultipleRoles && !hasSingleCollegeInstructorRole) {
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
                            <p className="mb-1 text-sm font-semibold">{hasMultipleRoles ? 'All Roles' : 'Role Details'}</p>
                            {sortedRoles.map((role) => {
                                const isCollegeInstructor = role.toLowerCase() === 'college instructor';
                                const programsForRole = isCollegeInstructor ? (college_program || '').split(',').map(p => p.trim()).filter(Boolean) : [];
                                const programLabels = programsForRole.map(p => getProgramLabel(p));

                                if (isCollegeInstructor && programsForRole.length > 0) {
                                    return (
                                        <div key={role} className="flex flex-col items-start gap-2">
                                            <RoleBadge role={role} program={programsForRole.join(', ')} />
                                            <div className="pl-4 mt-1 space-y-1">
                                                {programsForRole.map((prog, index) => (
                                                    <div key={prog} className="text-xs text-muted-foreground">
                                                        <span className="font-semibold">{prog}:</span> {programLabels[index]}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={role} className="flex items-center gap-2">
                                        <RoleBadge role={role} />
                                    </div>
                                );
                            })}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}