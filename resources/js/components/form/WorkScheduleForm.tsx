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

    const nonCollegeRoles = React.useMemo(
        () => rolesArr.filter((r: string) => !r.toLowerCase().includes('college')),
        [rolesArr]
    );

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
                                            {/* College program specific hours & days */}
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
                                                                }}
                                                                errors={errors as Record<string, string>}
                                                            />
                                                        </motion.div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            )}

                                            {/* Conditionally render the default WorkDaysSelector */}
                                            {nonCollegeRoles.map((role: string) => (
                                                <AccordionItem value={`role:${role}`} key={role} className="border rounded-md bg-muted/20 dark:bg-muted/10">
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
                                            ))}
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