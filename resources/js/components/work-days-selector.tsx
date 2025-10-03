import { Button } from '@/components/ui/button';
import { Check, CheckCircle, XCircle } from 'lucide-react';
import React from 'react';

const WEEKDAYS = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
];
const WEEKENDS = [
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
];

export type WorkDaysSelectorProps = {
    value: string[];
    onChange: (days: string[]) => void;
};

export default function WorkDaysSelector({ value, onChange }: WorkDaysSelectorProps) {
    const isSelected = (key: string) => value.includes(key);
    const allWeekdays = WEEKDAYS.map(d => d.key);
    const allWeekends = WEEKENDS.map(d => d.key);
    const allDays = [...allWeekdays, ...allWeekends];

    const areAllWeekdays = allWeekdays.every(k => value.includes(k));
    const areAllWeekends = allWeekends.every(k => value.includes(k));
    const areAllDays = allDays.every(k => value.includes(k));

    const toggleDay = (key: string) => {
        if (isSelected(key)) {
            onChange(value.filter(d => d !== key));
        } else {
            onChange([...value, key]);
        }
    };
    // Toggle all days
    const handleAll = () => {
        if (areAllDays) {
            onChange([]);
        } else {
            onChange(allDays);
        }
    };
    // Toggle all weekdays
    const handleWeekdays = () => {
        if (areAllWeekdays) {
            onChange(value.filter(d => !allWeekdays.includes(d)));
        } else {
            onChange([...allWeekdays, ...value.filter(d => allWeekends.includes(d))]);
        }
    };
    // Toggle all weekends
    const handleWeekends = () => {
        if (areAllWeekends) {
            onChange(value.filter(d => !allWeekends.includes(d)));
        } else {
            onChange([...allWeekends, ...value.filter(d => allWeekdays.includes(d))]);
        }
    };
    const clearAll = () => onChange([]);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">Work Days</span>
                {/* <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleAll}
                >
                    <CheckCircle className="w-5 h-5 text-green-600" />
                </Button> */}

                <Button type='button' size="icon" variant="ghost" onClick={handleAll} title="Select all">
                    <CheckCircle className='w-5 h-5 text-green-600' />
                </Button>

                <Button type="button" size="icon" variant="ghost" onClick={clearAll} title="Clear all">
                    <XCircle className="w-5 h-5 text-red-500" />
                </Button>
            </div>
            <div className="flex gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-medium">Weekdays</span>
                        <Button
                            type="button"
                            size="sm"
                            variant={areAllWeekdays ? 'default' : 'outline'}
                            onClick={handleWeekdays}
                            className="px-2 py-0 text-xs ml-1"
                        >
                            All
                        </Button>
                    </div>
                    <div className="flex gap-1">
                        {WEEKDAYS.map(day => (
                            <Button
                                key={day.key}
                                type="button"
                                size="icon"
                                variant={isSelected(day.key) ? 'default' : 'outline'}
                                onClick={() => toggleDay(day.key)}
                                title={day.label}
                            >
                                <span className="text-xs">{day.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-medium">Weekends</span>
                        <Button
                            type="button"
                            size="sm"
                            variant={areAllWeekends ? 'default' : 'outline'}
                            onClick={handleWeekends}
                            className="px-2 py-0 text-xs ml-1"
                        >
                            All
                        </Button>
                    </div>
                    <div className="flex gap-1">
                        {WEEKENDS.map(day => (
                            <Button
                                key={day.key}
                                type="button"
                                size="icon"
                                variant={isSelected(day.key) ? 'default' : 'outline'}
                                onClick={() => toggleDay(day.key)}
                                title={day.label}
                            >
                                <span className="text-xs">{day.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
