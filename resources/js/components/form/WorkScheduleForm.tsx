import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkDaysSelector, type WorkDayTime } from '@/components/work-days-selector';

// Define a type for the form data this component will handle
type EmployeeFormData = {
    work_days: WorkDayTime[];
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

    return (
        <Card className="w-full border-gray-200 shadow-sm">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Work Schedule</CardTitle>
                        <CardDescription>Define the employee's weekly work days and hours.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
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