import { Button } from '@/components/ui/button';
import { Check, CheckCircle, XCircle } from 'lucide-react';
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TimePicker } from '@/components/ui/time-picker';

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


export type WorkDayTime = {
    day: string;
    work_start_time: string;
    work_end_time: string;
};

export type WorkDaysSelectorProps = {
    value: WorkDayTime[];
    onChange: (days: WorkDayTime[]) => void;
    selectedIndex: number;
    onSelectIndex: (idx: number) => void;
};
export function WorkDaysSelector({ value, onChange, selectedIndex, onSelectIndex }: WorkDaysSelectorProps) {
    // Helper to get default times
    const defaultStart = '08:00';
    const defaultEnd = '16:00';

    const isSelected = (key: string) => value.some(d => d.day === key);
    const allWeekdays = WEEKDAYS.map(d => d.key);
    const allWeekends = WEEKENDS.map(d => d.key);
    const allDays = [...allWeekdays, ...allWeekends];

    const areAllWeekdays = allWeekdays.every(k => isSelected(k));
    const areAllWeekends = allWeekends.every(k => isSelected(k));
    const areAllDays = allDays.every(k => isSelected(k));

    // Add or remove a day
    const toggleDay = (key: string) => {
        if (isSelected(key)) {
            onChange(value.filter(d => d.day !== key));
        } else {
            onChange([
                ...value,
                { day: key, work_start_time: defaultStart, work_end_time: defaultEnd },
            ]);
        }
    };
    // Toggle all days
    const handleAll = () => {
        if (areAllDays) {
            onChange([]);
        } else {
            onChange(allDays.map(day => {
                const found = value.find(d => d.day === day);
                return found || { day, work_start_time: defaultStart, work_end_time: defaultEnd };
            }));
        }
    };
    // Toggle all weekdays
    const handleWeekdays = () => {
        if (areAllWeekdays) {
            onChange(value.filter(d => !allWeekdays.includes(d.day)));
        } else {
            const weekends = value.filter(d => allWeekends.includes(d.day));
            const weekdays = allWeekdays.map(day => {
                const found = value.find(d => d.day === day);
                return found || { day, work_start_time: defaultStart, work_end_time: defaultEnd };
            });
            onChange([...weekdays, ...weekends]);
        }
    };
    // Toggle all weekends
    const handleWeekends = () => {
        if (areAllWeekends) {
            onChange(value.filter(d => !allWeekends.includes(d.day)));
        } else {
            const weekdays = value.filter(d => allWeekdays.includes(d.day));
            const weekends = allWeekends.map(day => {
                const found = value.find(d => d.day === day);
                return found || { day, work_start_time: defaultStart, work_end_time: defaultEnd };
            });
            onChange([...weekdays, ...weekends]);
        }
    };
    const clearAll = () => onChange([]);

    // Navigation helpers and time setter for selected day
    const hasDays = value.length > 0;
    const currentDay = hasDays ? value[selectedIndex] : undefined;
    const goPrev = () => {
        if (!hasDays) return;
        onSelectIndex((selectedIndex - 1 + value.length) % value.length);
    };
    const goNext = () => {
        if (!hasDays) return;
        onSelectIndex((selectedIndex + 1) % value.length);
    };
    const setTime = (field: 'work_start_time' | 'work_end_time', time: string) => {
        if (!currentDay) return;
        onChange(value.map((d, i) => i === selectedIndex ? { ...d, [field]: time } : d));
    };

    const formatTime12Hour = (time: string) => {
        if (!time) return '';
        const [h, m] = time.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm">Work Days</span>
                <Button type='button' size="icon" variant="ghost" onClick={handleAll} title="Select all" className='rounded-full w-8 h-8'>
                    <CheckCircle className='w-5 h-5 text-green-600' />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={clearAll} title="Clear all" className='rounded-full w-8 h-8'>
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
                        {WEEKDAYS.map(day => {
                            const selected = value.some(d => d.day === day.key);
                            return (
                                <Button
                                    key={day.key}
                                    type="button"
                                    size="icon"
                                    variant={selected ? 'default' : 'outline'}
                                    onClick={() => toggleDay(day.key)}
                                    title={day.label}
                                >
                                    <span className="text-xs">{day.label}</span>
                                </Button>
                            );
                        })}
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
                        {WEEKENDS.map(day => {
                            const selected = value.some(d => d.day === day.key);
                            return (
                                <Button
                                    key={day.key}
                                    type="button"
                                    size="icon"
                                    variant={selected ? 'default' : 'outline'}
                                    onClick={() => toggleDay(day.key)}
                                    title={day.label}
                                >
                                    <span className="text-xs">{day.label}</span>
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* Single time picker for selected day */}
            <div className="flex flex-col gap-2 mt-4">
                <AnimatePresence initial={false}>
                    {hasDays && (
                        <motion.div
                            key="workdays-nav"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 16 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                            <div className="flex items-center gap-2">
                                <Button type="button" size="sm" variant="outline" onClick={goPrev}>&lt;</Button>
                                <span className="text-xs font-semibold w-16 text-center">{currentDay ? currentDay.day.toUpperCase() : ''}</span>
                                <Button type="button" size="sm" variant="outline" onClick={goNext}>&gt;</Button>
                                <span className="ml-4 text-xs">Start</span>
                                <div className="w-36">
                                    <TimePicker
                                        value={currentDay && currentDay.work_start_time ? currentDay.work_start_time : ''}
                                        onChange={val => setTime('work_start_time', val)}
                                        label={undefined}
                                        placeholder="Select start time"
                                    />
                                </div>
                                <span className="ml-2 text-xs">End</span>
                                <div className="w-36">
                                    <TimePicker
                                        value={currentDay && currentDay.work_end_time ? currentDay.work_end_time : ''}
                                        onChange={val => setTime('work_end_time', val)}
                                        label={undefined}
                                        placeholder="Select end time"
                                    />
                                </div>
                            </div>
                            {/* Work hours hint for current day */}
                            <AnimatePresence initial={false}>
                                {currentDay && currentDay.work_start_time && currentDay.work_end_time && (
                                    <motion.div
                                        key="workdays-hint"
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                                        className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mt-2"
                                    >
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            {(() => {
                                                const [startHour, startMinute] = currentDay.work_start_time.split(':').map(Number);
                                                const [endHour, endMinute] = currentDay.work_end_time.split(':').map(Number);
                                                const startMinutes = startHour * 60 + startMinute;
                                                const endMinutes = endHour * 60 + endMinute;
                                                let actualWorkMinutes = endMinutes - startMinutes;
                                                if (actualWorkMinutes <= 0) actualWorkMinutes += 24 * 60;
                                                // --- NEW DEFINITIVE BREAK LOGIC (Overlap and Cap) ---
                                                const totalScheduledMinutes = actualWorkMinutes; // Rename for clarity

                                                // FIXED BREAK WINDOW
                                                const fixedBreakStartMinutes = 12 * 60; // 720 minutes (12:00 PM)
                                                const fixedBreakEndMinutes = 13 * 60;   // 780 minutes (1:00 PM)
                                                const mandatedDeduction = 60;          // 1 hour

                                                // --- STEP 1: Calculate Overlap (Non-Work Time) ---
                                                // This calculates the duration the employee is actually scheduled *during* the fixed 12 PM - 1 PM window.
                                                const overlapStartMinutes = Math.max(startMinutes, fixedBreakStartMinutes);
                                                const overlapEndMinutes = Math.min(endMinutes, fixedBreakEndMinutes);
                                                const overlapMinutes = Math.max(0, overlapEndMinutes - overlapStartMinutes); // This time is never counted as work.

                                                // --- STEP 2: Determine Final Deduction Amount (The Break Rule) ---
                                                let finalDeductionMinutes;
                                                let messageMinutes; // The minutes to show in the span message

                                                if (endMinutes > fixedBreakEndMinutes) {
                                                    // Rule Triggered: Full 1-hour break is mandated for net hours calculation.
                                                    finalDeductionMinutes = mandatedDeduction;
                                                    messageMinutes = mandatedDeduction; // Report 1 hour deduction in the message
                                                } else {
                                                    // Rule Not Triggered: Deduction equals the scheduled overlap.
                                                    finalDeductionMinutes = overlapMinutes;
                                                    messageMinutes = overlapMinutes; // Report the exact overlap time in the message
                                                }

                                                // --- STEP 3: Calculate Net Working Minutes (Payroll) ---
                                                const totalMinutes = Math.max(0, totalScheduledMinutes - finalDeductionMinutes);

                                                // --- Step 4: Prepare Reactive Output Strings (Using messageMinutes) ---
                                                const hours = Math.floor(totalMinutes / 60);
                                                const minutes = totalMinutes % 60;
                                                const durationText = minutes === 0 ? `${hours} hours` : `${hours} hours and ${minutes} minutes`;

                                                const breakHours = Math.floor(messageMinutes / 60);
                                                const breakMins = messageMinutes % 60;

                                                // Build the readable time string (e.g., "1 hour" or "45 minutes")
                                                let deductionAmount = '';
                                                const hPart = breakHours > 0 ? `${breakHours} hour${breakHours > 1 ? 's' : ''}` : '';
                                                const mPart = breakMins > 0 ? `${breakMins} minute${breakMins > 1 ? 's' : ''}` : '';
                                                const separator = hPart && mPart ? ' and ' : '';
                                                deductionAmount = `${hPart}${separator}${mPart}`;

                                                // --- UPDATED SPAN MESSAGE GENERATION LOGIC ---
                                                let breakText;

                                                if (messageMinutes === 0) {
                                                    breakText = 'No break time deduction.';
                                                }
                                                // Condition 1: If the reported time is less than 60 minutes (1-59 min), it's overlap.
                                                else if (messageMinutes < mandatedDeduction) {
                                                    breakText = `Your schedule is overlapping with the break time for ${deductionAmount}.`;
                                                }
                                                // Condition 2: If the reported time is 60 minutes or more (the full mandate).
                                                else {
                                                    // This handles 60 minutes, 1 hour 15 minutes, etc. (though 60 min is the practical max here).
                                                    breakText = `A mandatory break of ${deductionAmount} is deducted from your total work hours.`;
                                                }

                                                return (
                                                    <>
                                                        📅 Schedule: {formatTime12Hour(currentDay.work_start_time)} - {formatTime12Hour(currentDay.work_end_time)} (Total Work Hours: {durationText})<br />
                                                        Break Time: 12:00PM - 1:00PM<br />
                                                        <span className="text-xs text-blue-600 dark:text-blue-400">*{breakText}</span>
                                                    </>
                                                );
                                            })()}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
