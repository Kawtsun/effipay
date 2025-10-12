import * as React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Shield, GraduationCap, Book, User } from 'lucide-react'

const COLLEGE_PROGRAMS = [
    { value: 'BSBA', label: 'Bachelor of Science in Business Administration' },
    { value: 'BSA', label: 'Bachelor of Science in Accountancy' },
    { value: 'COELA', label: 'College of Education and Liberal Arts' },
    { value: 'BSCRIM', label: 'Bachelor of Science in Criminology' },
    { value: 'BSCS', label: 'Bachelor of Science in Computer Science' },
    { value: 'JD', label: 'Juris Doctor' },
    { value: 'BSN', label: 'Bachelor of Science in Nursing' },
    { value: 'RLE', label: 'Related Learning Experience' },
    { value: 'CG', label: 'Career Guidance' },
    { value: 'BSPT', label: 'Bachelor of Science in Physical Therapy' },
    { value: 'GSP', label: 'Graduate Studies Programs' },
    { value: 'MBA', label: 'Master of Business Administration' },
]

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

    const badgeContent = (
        <span className="inline-flex items-center gap-1.5">
            <RoleBadge role={mainRole} program={isMainRoleCollegeInstructor ? college_program : undefined} />
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
                                const isCollegeInstructor = role.toLowerCase() === 'college instructor'
                                const programForRole = isCollegeInstructor ? college_program : undefined
                                const programLabel = getProgramLabel(programForRole)

                                return (
                                    <div key={role} className="flex items-center gap-2">
                                        <RoleBadge role={role} program={programForRole} />
                                        {programLabel && <span className="text-xs text-muted-foreground ">{programLabel}</span>}
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