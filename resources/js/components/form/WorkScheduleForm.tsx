/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkDaysSelector, type WorkDayTime } from '@/components/work-days-selector';
import {} from 'framer-motion';
import CollegeProgramWork from '@/components/college-program-work';

// Minimal typing is intentionally omitted here to stay compatible with various useForm shapes.

interface WorkScheduleFormProps {
    form: any;
}

export function WorkScheduleForm({ form }: WorkScheduleFormProps) {
    // THE FIX: Destructure clearErrors from the form hook
    const { data, setData, errors, clearErrors } = form;

    const [selectedIndex, setSelectedIndex] = React.useState(0);

    // Program list (canonical order) for per-program inputs
    const COLLEGE_PROGRAMS = React.useMemo(
        () => [
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
        ],
        []
    );

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
                <AlertDescription>
                    {errors[field]}
                </AlertDescription>
            </Alert>
        );
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
                <WorkDaysSelector
                    value={data.work_days || []}
                    // THE FIX: When days are changed, also clear the validation error.
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
            </CardContent>
        </Card>
    );
}