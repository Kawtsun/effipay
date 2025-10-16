/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Clock, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkDaysSelector, type WorkDayTime } from '@/components/work-days-selector';
import { motion, AnimatePresence } from 'framer-motion';
import CollegeProgramWork from '@/components/college-program-work';
import { COLLEGE_PROGRAMS } from '@/constants/college-programs';

// Minimal typing is intentionally omitted here to stay compatible with various useForm shapes.

interface WorkScheduleFormProps {
    form: any;
    /**
     * When true and role contains 'college' (case-insensitive), hide the default WorkDaysSelector
     * so the form only renders CollegeProgramWork for college roles.
     */
    hideDefaultWorkDaysSelectorForCollegeRole?: boolean;
}

export function WorkScheduleForm({ form, hideDefaultWorkDaysSelectorForCollegeRole = true }: WorkScheduleFormProps) {
    // THE FIX: Destructure clearErrors from the form hook
    const { data, setData, errors, clearErrors } = form;

    const [selectedIndex, setSelectedIndex] = React.useState(0);

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
                            {/* College program specific hours & days (via presentational component) */}
                            {selectedPrograms.length > 0 && (
                                <div className="mb-6">
                                    <CollegeProgramWork
                                        programs={COLLEGE_PROGRAMS}
                                        selected={selectedPrograms}
                                        hoursByProgram={data.college_work_hours_by_program || {}}
                                        onChangeHours={(code, hours) => {
                                            const next = { ...(data.college_work_hours_by_program || {}) } as Record<string, string>;
                                            next[code] = hours;
                                            setData('college_work_hours_by_program', next);
                                            const key = `college_work_hours_by_program.${code}`;
                                            if (errors[key as keyof typeof errors]) {
                                                clearErrors(key);
                                            }
                                        }}
                                        workDaysByProgram={data.college_work_days_by_program || {}}
                                        onChangeWorkDays={(code, days: WorkDayTime[]) => {
                                            const next = { ...(data.college_work_days_by_program || {}) } as Record<string, WorkDayTime[]>;
                                            next[code] = days;
                                            setData('college_work_days_by_program', next);
                                            const key = `college_work_days_by_program.${code}`;
                                            if (errors[key as keyof typeof errors]) {
                                                clearErrors(key);
                                            }
                                        }}
                                        errors={errors as Record<string, string>}
                                    />
                                </div>
                            )}
                            {/* Conditionally render the default WorkDaysSelector */}
                            {(!isCollegeRole || !hideDefaultWorkDaysSelectorForCollegeRole) && (
                                <>
                                    <WorkDaysSelector
                                        value={data.work_days || []}
                                        onChange={(days: WorkDayTime[]) => {
                                            setData('work_days', days);
                                            if (errors.work_days) {
                                                clearErrors('work_days');
                                            }
                                        }}
                                        selectedIndex={selectedIndex}
                                        onSelectIndex={setSelectedIndex}
                                    />
                                    <ErrorDisplay field="work_days" />
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}