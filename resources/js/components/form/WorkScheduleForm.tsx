import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { Clock, AlertTriangle, Hourglass } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkDaysSelector, type WorkDayTime } from '@/components/work-days-selector';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

// Define a type for the form data this component will handle
type EmployeeFormData = {
    work_days: WorkDayTime[];
    roles: string;
    college_work_hours?: string;
    [key: string]: any;
};

interface WorkScheduleFormProps {
    form: UseFormReturn<EmployeeFormData>;
}

export function WorkScheduleForm({ form }: WorkScheduleFormProps) {
    // THE FIX: Destructure clearErrors from the form hook
    const { data, setData, errors, clearErrors } = form;

    const [selectedIndex, setSelectedIndex] = React.useState(0);

    // This sub-component renders the correctly styled error message.
    const ErrorDisplay = ({ field }: { field: keyof typeof errors }) => {
        if (!errors[field]) return null;
        return (
            <div className="mt-2 flex items-center rounded-lg border border-destructive/50 bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="ml-2 text-xs font-medium">{errors[field]}</p>
            </div>
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
                            <div className="mb-6">
                                <Label htmlFor="college_work_hours" className="font-semibold">
                                    College Work Hours
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