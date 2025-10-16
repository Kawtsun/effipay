/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Clock, AlertTriangle, Hourglass, Asterisk } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkDaysSelector, type WorkDayTime } from '@/components/work-days-selector';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

// Minimal typing is intentionally omitted here to stay compatible with various useForm shapes.

interface WorkScheduleFormProps {
    form: any;
}

export function WorkScheduleForm({ form }: WorkScheduleFormProps) {
    // THE FIX: Destructure clearErrors from the form hook
    const { data, setData, errors, clearErrors } = form;

    const [selectedIndex, setSelectedIndex] = React.useState(0);

    // Local list of college programs for labeling. Keep in sync with other components.
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

    const getCollegeProgramLabel = React.useCallback(
        (code: string) => COLLEGE_PROGRAMS.find((p) => p.value === code)?.label || code,
        [COLLEGE_PROGRAMS]
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

    // Check if the 'college instructor' role is selected
    const isCollegeInstructor = data.roles.includes('college instructor');

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
                <AnimatePresence>
                    {isCollegeInstructor && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                        >
                            {/* If multiple programs are selected, show one field per program. */}
                            {selectedPrograms.length > 0 ? (
                                <div className="p-1 mb-6 space-y-4">
                                    {COLLEGE_PROGRAMS.filter(p => selectedPrograms.includes(p.value)).map(({ value: code }) => {
                                        const fieldKey = `college_work_hours_by_program.${code}`;
                                        const value = data.college_work_hours_by_program?.[code] || '';
                                        return (
                                            <div key={code} className="">
                                                <Label htmlFor={`hours-${code}`} className="font-semibold flex items-center">
                                                    College Work Hours — {getCollegeProgramLabel(code)} <span className="ml-1 text-muted-foreground">({code})</span>
                                                    <Asterisk className="h-4 w-4 text-destructive ml-1" />
                                                </Label>
                                                <div className="relative mt-2">
                                                    <Hourglass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id={`hours-${code}`}
                                                        type="number"
                                                        min="0"
                                                        className="pl-10"
                                                        placeholder="e.g., 12"
                                                        value={value}
                                                        onChange={(e) => {
                                                            const next = { ...(data.college_work_hours_by_program || {}) };
                                                            next[code] = e.target.value;
                                                            setData('college_work_hours_by_program', next);
                                                            if (errors[fieldKey as keyof typeof errors]) {
                                                                clearErrors(fieldKey);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                {/* Try both flattened and nested error keys */}
                                                <ErrorDisplay field={fieldKey as keyof typeof errors} />
                                                <ErrorDisplay field={('college_work_hours_by_program' as keyof typeof errors)} />
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                // Fallback: single field when no program is selected yet
                                <div className="mb-6">
                                    <Label htmlFor="college_work_hours" className="font-semibold flex items-center">
                                        College Work Hours <Asterisk className="h-4 w-4 text-destructive ml-1" />
                                    </Label>
                                    <div className="relative mt-2">
                                        <Hourglass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="college_work_hours"
                                            type="number"
                                            className="pl-10"
                                            placeholder="e.g., 40"
                                            value={data.college_work_hours || ''}
                                            onChange={(e) => setData('college_work_hours', e.target.value)}
                                        />
                                    </div>
                                    <ErrorDisplay field="college_work_hours" />
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
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