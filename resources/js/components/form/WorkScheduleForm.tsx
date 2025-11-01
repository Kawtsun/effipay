/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Clock, AlertTriangle, Info, CalendarDays } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkDaysSelector, type WorkDayTime } from '@/components/work-days-selector';
import { motion, AnimatePresence } from 'framer-motion';
import CollegeProgramWork from '@/components/college-program-work';
import { COLLEGE_PROGRAMS } from '@/constants/college-programs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SummaryBadge } from '@/components/summary-badge';
import { Separator } from '@/components/ui/separator';
import { Clock as ClockIcon } from 'lucide-react';

// Minimal typing is intentionally omitted here to stay compatible with various useForm shapes.

interface WorkScheduleFormProps {
    form: any;
}

export function WorkScheduleForm({ form }: WorkScheduleFormProps) {
    // THE FIX: Destructure clearErrors from the form hook
    const { data, setData, errors, clearErrors } = form;

    const [selectedIndices, setSelectedIndices] = React.useState<Record<string, number>>({});

    const rolesArr = React.useMemo(
        () => (data.roles || '').split(',').map((r: string) => r.trim()).filter(Boolean),
        [data.roles]
    );
    // Case-insensitive detection: treat anything containing 'college' as a college role (e.g., 'College Instructor')
    const isCollegeRole = React.useMemo(
        () => (data.roles || '')
            .toLowerCase()
            .split(',')
            .map((r: string) => r.trim())
            .some((r: string) => r.includes('college')),
        [data.roles]
    );

    const isBasicEducationRole = React.useMemo(
        () => (data.roles || '')
            .toLowerCase()
            .split(',')
            .map((r: string) => r.trim())
            .some((r: string) => r.includes('basic education')),
        [data.roles]
    );

    const nonCollegeRoles = React.useMemo(
        () => rolesArr.filter((r: string) => !r.toLowerCase().includes('college')),
        [rolesArr]
    );

    // Group roles to control render order: Admin > College > Basic Edu > Others
    const adminRoles = React.useMemo(
        () => nonCollegeRoles.filter((r: string) => r.toLowerCase().includes('admin')),
        [nonCollegeRoles]
    );
    const basicEduRoles = React.useMemo(
        () => nonCollegeRoles.filter((r: string) => r.toLowerCase().includes('basic education')),
        [nonCollegeRoles]
    );
    const otherRoles = React.useMemo(
        () => nonCollegeRoles.filter((r: string) => !r.toLowerCase().includes('admin') && !r.toLowerCase().includes('basic education')),
        [nonCollegeRoles]
    );

    /* TEMP: Disable auto-clearing schedules on role/college changes for debugging
    // When roles change, proactively drop any work_days entries that belong to roles
    // which are no longer selected. This prevents old schedules (e.g., Administrator)
    // from being re-submitted after switching to another role (e.g., Basic Education).
    React.useEffect(() => {
        const selectedLower = new Set(rolesArr.map((r: string) => r.toLowerCase()));
        const wd = data.work_days as any;
        let changed = false;
        let nextWorkDays: any = wd;

        if (Array.isArray(wd)) {
            const filtered = wd.filter((d: any) => {
                const role = (d && d.role) ? String(d.role).toLowerCase() : '';
                if (!role) return true; // keep untagged
                return selectedLower.has(role);
            });
            if (filtered.length !== wd.length) {
                nextWorkDays = filtered;
                changed = true;
            }
        } else if (wd && typeof wd === 'object') {
            const nextObj: Record<string, any> = {};
            Object.keys(wd).forEach((role) => {
                if (selectedLower.has(role.toLowerCase())) {
                    nextObj[role] = wd[role];
                } else {
                    changed = true; // drop schedules of removed roles
                }
            });
            // Only set if keys differ in count or content changed
            if (changed) {
                nextWorkDays = nextObj;
            }
        }

        if (changed) {
            setData('work_days', nextWorkDays);
            if (typeof clearErrors === 'function') {
                clearErrors('work_days');
            }
        }

        // If College role was removed, clear college program days/hours
        if (!isCollegeRole) {
            const hadDays = data.college_work_days_by_program && Object.keys(data.college_work_days_by_program as any || {}).length > 0;
            const hadHours = data.college_work_hours_by_program && Object.keys(data.college_work_hours_by_program as any || {}).length > 0;
            if (hadDays) setData('college_work_days_by_program', {});
            if (hadHours) setData('college_work_hours_by_program', {});
            if (hadDays || hadHours) {
                if (typeof clearErrors === 'function') {
                    clearErrors(['college_work_days_by_program', 'college_work_hours_by_program']);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rolesArr.join(','), isCollegeRole]);
    */

    // Program list (canonical order) for per-program inputs
    // canonical program order via shared constant

    const selectedPrograms = React.useMemo(
        () =>
            (data.college_program || '')
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean),
        [data.college_program]
    );

    // This sub-component renders the correctly styled error message.
    const ErrorDisplay = ({ field }: { field: keyof typeof errors }) => {
        if (!errors[field]) return null;
        return (
            <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errors[field]}</AlertDescription>
            </Alert>
        );
    };

    const motionProps = {
        initial: { opacity: 0, height: 0, marginTop: 0 },
        animate: { opacity: 1, height: 'auto', marginTop: 0 },
        exit: { opacity: 0, height: 0, marginTop: 0 },
        transition: { duration: 0.3, ease: 'easeInOut' as const },
        className: 'overflow-hidden',
    };

    // College-specific inputs moved to CollegeWorkDaysForm component

    // Helpers: derive short summaries for accordion triggers
    const getRoleSummary = (role: string) => {
        const list = (data.work_days?.[role] || []) as WorkDayTime[];
        const daysCount = Array.isArray(list) ? list.length : 0;
        return daysCount > 0 ? `${daysCount} day${daysCount > 1 ? 's' : ''}/wk` : 'No days set';
    };

    const getCollegeSummary = () => {
        const programs = selectedPrograms.length;
        if (programs === 0) return 'No program set';
        // Try to show how many programs configured with hours
    const hoursByProgram = (data.college_work_hours_by_program || {}) as Record<string, string>;
    const configured = selectedPrograms.filter((p: string) => !!hoursByProgram[p]?.trim()).length;
        if (configured === 0) return `${programs} program${programs > 1 ? 's' : ''}`;
        return `${programs} program${programs > 1 ? 's' : ''} • ${configured} with hours`;
    };

    // Note: Overlap validation now happens on Save in the parent pages (create/edit).
    // The editor allows free changes; final validation is performed before submit.

    return (
        <Card className="w-full shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 dark:bg-primary p-2 rounded-full">
                        <Clock className="h-6 w-6 text-primary dark:text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle>Work Schedule</CardTitle>
                        <CardDescription>Define the employee's weekly work days and hours.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <AnimatePresence mode="wait">
                    {rolesArr.length === 0 ? (
                        <motion.div key="no-roles-alert" {...motionProps}>
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>Please select an employee role first to set their work schedule.</AlertDescription>
                            </Alert>
                        </motion.div>
                    ) : (
                        <motion.div key="work-schedule-fields" {...motionProps}>
                            {/* If college role but no program selected yet, show the same guidance alert */}
                            {isCollegeRole && selectedPrograms.length === 0 && (
                                <Alert className="mb-4">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        Please select a college program first to set their work schedule.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {isBasicEducationRole && !(data.basic_education_level && String(data.basic_education_level).trim()) && (
                                <Alert className="mb-4">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        Please select a basic education level first to set their work schedule.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <AnimatePresence>
                                {(nonCollegeRoles.length > 0 || selectedPrograms.length > 0) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        {/* Use single/collapsible to avoid layout conflicts between panels */}
                                        <Accordion type="single" collapsible className="w-full space-y-3">
                                            {/* 1) Administrator roles */}
                                            <AnimatePresence initial={false}>
                                                {adminRoles.map((role: string) => (
                                                    <motion.div
                                                        key={`role-item-${role}`}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <AccordionItem value={`role:${role}`} className="border rounded-md bg-muted/20 dark:bg-muted/10">
                                                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                                                <div className="flex w-full items-center justify-between gap-3 text-base">
                                                                    <span className="capitalize font-medium">{role} Schedule</span>
                                                                    <SummaryBadge icon={<CalendarDays size={12} />} className="mr-2">{getRoleSummary(role)}</SummaryBadge>
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="pt-4 px-3 pb-3">
                                                                <motion.div
                                                                    key={`content-${role}`}
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                                                >
                                                                    <WorkDaysSelector
                                                                        value={data.work_days?.[role] || []}
                                                                        onChange={(days: WorkDayTime[]) => {
                                                                            setData('work_days', {
                                                                                ...(data.work_days || {}),
                                                                                [role]: days,
                                                                            });
                                                                            if (errors[`work_days.${role}`]) {
                                                                                clearErrors(`work_days.${role}`);
                                                                            }
                                                                        }}
                                                                        selectedIndex={selectedIndices[role] || 0}
                                                                        onSelectIndex={idx =>
                                                                            setSelectedIndices(prev => ({
                                                                                ...prev,
                                                                                [role]: idx,
                                                                            }))
                                                                        }
                                                                    />
                                                                    <ErrorDisplay field={`work_days.${role}` as any} />
                                                                </motion.div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>

                                            {/* 2) College program specific hours & days */}
                                            {selectedPrograms.length > 0 && (
                                                <AccordionItem value="college_schedule" className="border rounded-md bg-muted/20 dark:bg-muted/10">
                                                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                                        <div className="flex w-full items-center justify-between gap-3 text-base">
                                                            <span className="font-medium">College Schedule</span>
                                                            <SummaryBadge icon={<CalendarDays size={12} />} className="mr-2">{getCollegeSummary()}</SummaryBadge>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pt-4 px-3 pb-3">
                                                        <motion.div
                                                            key="content-college"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ duration: 0.15, ease: 'easeOut' }}
                                                        >
                                                            <CollegeProgramWork
                                                                programs={COLLEGE_PROGRAMS}
                                                                selected={selectedPrograms}
                                                                hoursByProgram={data.college_work_hours_by_program || {}}
                                                                onChangeHours={(code, hours) => {
                                                                    const next = {
                                                                        ...(data.college_work_hours_by_program || {}),
                                                                    } as Record<string, string>;
                                                                    next[code] = hours;
                                                                    setData('college_work_hours_by_program', next);
                                                                    const key = `college_work_hours_by_program.${code}`;
                                                                    if (errors[key as keyof typeof errors]) {
                                                                        clearErrors(key);
                                                                    }
                                                                }}
                                                                workDaysByProgram={data.college_work_days_by_program || {}}
                                                                onChangeWorkDays={(code, days: WorkDayTime[]) => {
                                                                    const next = {
                                                                        ...(data.college_work_days_by_program || {}),
                                                                    } as Record<string, WorkDayTime[]>;
                                                                    next[code] = days;
                                                                    setData('college_work_days_by_program', next);
                                                                    const key = `college_work_days_by_program.${code}`;
                                                                    if (errors[key as keyof typeof errors]) {
                                                                        clearErrors(key);
                                                                    }

                                                                    /* TEMP: Disable auto-clearing college hours when program has no days
                                                                    // If no work days remain for this program, also clear its hours and related errors
                                                                    if (!days || days.length === 0) {
                                                                        const hoursMap = {
                                                                            ...(data.college_work_hours_by_program || {}),
                                                                        } as Record<string, string>;
                                                                        if ((hoursMap[code] ?? '') !== '') {
                                                                            hoursMap[code] = '';
                                                                            setData('college_work_hours_by_program', hoursMap);
                                                                        }
                                                                        const hoursKey = `college_work_hours_by_program.${code}`;
                                                                        if (errors[hoursKey as keyof typeof errors]) {
                                                                            clearErrors(hoursKey);
                                                                        }
                                                                    }
                                                                    */
                                                                }}
                                                                errors={errors as Record<string, string>}
                                                            />

                                                            {/* Overall College Hours Hint */}
                                                            <AnimatePresence initial={false}>
                                                                {(() => {
                                                                    const hoursByProgram = (data.college_work_hours_by_program || {}) as Record<string, string>;
                                                                    const rows = (selectedPrograms as string[])
                                                                        .map((code: string) => ({
                                                                            code,
                                                                            label: COLLEGE_PROGRAMS.find(p => p.value === code)?.label || code,
                                                                            hours: Number(hoursByProgram[code] || 0),
                                                                        }))
                                                                        .filter((r) => Number.isFinite(r.hours) && r.hours > 0);
                                                                    if (rows.length === 0) return null;
                                                                    const sum = rows.reduce((acc: number, r) => acc + r.hours, 0);
                                                                    return (
                                                                        <motion.div
                                                                            key="college-hours-hint"
                                                                            initial={{ opacity: 0, y: 8 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            exit={{ opacity: 0, y: 8 }}
                                                                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                                                                            className="mt-4 space-y-3"
                                                                        >
                                                                            <Separator />
                                                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                                                <div className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                                                                    <ClockIcon className="h-4 w-4" />
                                                                                    <span>
                                                                                        Total College Work Hours: <strong>{sum} hour{sum === 1 ? '' : 's'}</strong> per day
                                                                                    </span>
                                                                                </div>
                                                                                <ul className="mt-2 text-xs text-blue-700 dark:text-blue-300 list-disc pl-5 space-y-1">
                                                                                    {rows.map(r => (
                                                                                        <li key={r.code}>
                                                                                            {r.label} <span className="text-muted-foreground">({r.code})</span>: <strong>{r.hours} hour{r.hours === 1 ? '' : 's'}</strong>
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        </motion.div>
                                                                    );
                                                                })()}
                                                            </AnimatePresence>
                                                        </motion.div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            )}

                                            {/* 3) Basic Education roles (only if level selected) */}
                                            <AnimatePresence initial={false}>
                                                {basicEduRoles
                                                    .filter(() => !!(data.basic_education_level && String(data.basic_education_level).trim()))
                                                    .map((role: string) => (
                                                        <motion.div
                                                            key={`role-item-${role}`}
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                            className="overflow-hidden"
                                                        >
                                                            <AccordionItem value={`role:${role}`} className="border rounded-md bg-muted/20 dark:bg-muted/10">
                                                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                                                    <div className="flex w-full items-center justify-between gap-3 text-base">
                                                                        <div className="flex items-baseline gap-2">
                                                                            <span className="capitalize font-medium leading-tight">{role} Schedule</span>
                                                                            <span className="text-xs text-muted-foreground leading-none">({String(data.basic_education_level)})</span>
                                                                        </div>
                                                                        <SummaryBadge icon={<CalendarDays size={12} />} className="mr-2">{getRoleSummary(role)}</SummaryBadge>
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="pt-4 px-3 pb-3">
                                                                    <motion.div
                                                                        key={`content-${role}`}
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                                                    >
                                                                        <WorkDaysSelector
                                                                            value={data.work_days?.[role] || []}
                                                                            onChange={(days: WorkDayTime[]) => {
                                                                                setData('work_days', {
                                                                                    ...(data.work_days || {}),
                                                                                    [role]: days,
                                                                                });
                                                                                if (errors[`work_days.${role}`]) {
                                                                                    clearErrors(`work_days.${role}`);
                                                                                }
                                                                            }}
                                                                            selectedIndex={selectedIndices[role] || 0}
                                                                            onSelectIndex={idx =>
                                                                                setSelectedIndices(prev => ({
                                                                                    ...prev,
                                                                                    [role]: idx,
                                                                                }))
                                                                            }
                                                                        />
                                                                        <ErrorDisplay field={`work_days.${role}` as any} />
                                                                    </motion.div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        </motion.div>
                                                    ))}
                                            </AnimatePresence>

                                            {/* 4) Other roles */}
                                            <AnimatePresence initial={false}>
                                                {otherRoles.map((role: string) => (
                                                    <motion.div
                                                        key={`role-item-${role}`}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <AccordionItem value={`role:${role}`} className="border rounded-md bg-muted/20 dark:bg-muted/10">
                                                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                                                <div className="flex w-full items-center justify-between gap-3 text-base">
                                                                    <span className="capitalize font-medium">{role} Schedule</span>
                                                                    <SummaryBadge icon={<CalendarDays size={12} />} className="mr-2">{getRoleSummary(role)}</SummaryBadge>
                                                                </div>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="pt-4 px-3 pb-3">
                                                                <motion.div
                                                                    key={`content-${role}`}
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                                                >
                                                                    <WorkDaysSelector
                                                                        value={data.work_days?.[role] || []}
                                                                        onChange={(days: WorkDayTime[]) => {
                                                                            setData('work_days', {
                                                                                ...(data.work_days || {}),
                                                                                [role]: days,
                                                                            });
                                                                            if (errors[`work_days.${role}`]) {
                                                                                clearErrors(`work_days.${role}`);
                                                                            }
                                                                        }}
                                                                        selectedIndex={selectedIndices[role] || 0}
                                                                        onSelectIndex={idx =>
                                                                            setSelectedIndices(prev => ({
                                                                                ...prev,
                                                                                [role]: idx,
                                                                            }))
                                                                        }
                                                                    />
                                                                    <ErrorDisplay field={`work_days.${role}` as any} />
                                                                </motion.div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </Accordion>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}