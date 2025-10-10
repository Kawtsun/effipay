import * as React from 'react';
import { type UseFormReturn } from '@inertiajs/react';
import { Clock } from 'lucide-react';
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
    const { data, setData, errors } = form;
    
    const [selectedIndex, setSelectedIndex] = React.useState(0);

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
                    // **THE SAFEGUARD: Ensure the value is always an array.**
                    value={data.work_days || []}
                    onChange={(days: WorkDayTime[]) => setData('work_days', days)}
                    selectedIndex={selectedIndex}
                    onSelectIndex={setSelectedIndex}
                />
                {errors.work_days && <p className="text-sm text-red-600 mt-2">{errors.work_days}</p>}
            </CardContent>
        </Card>
    );
}