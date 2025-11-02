import React from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Employees } from "@/types";
import { EmployeeName } from "./dialog-components/employee-name";
import GeneralInformation from "./dialog-components/general-information";
import DialogScrollArea from "@/components/dialog-scroll-area";
import { TimeKeepingDataProvider } from "./dialog-components/timekeeping-data-provider";
import AttendanceCards from "./dialog-components/attendance-cards";

type Props = {
    employee: Employees | null;
    onClose: () => void;
};

export default function TimekeepingViewDialog({ employee, onClose }: Props) {
    return (
        <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
            {!!employee && (
                <DialogContent className="max-w-6xl h-[85vh] w-full px-8 py-6 z-[100] flex flex-col min-h-0 overflow-hidden">
                    <TimeKeepingDataProvider employee={employee}>
                        {({ selectedMonth, availableMonths, handleMonthChange, records, computed, isLoading }) => (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">
                                        Timekeeping Details
                                    </DialogTitle>
                                </DialogHeader>

                                {/* Sticky summary header */}
                                <EmployeeName employee={employee} />

                                {/* Scrollable content */}
                                <DialogScrollArea className="mt-4">
                                    <div className="space-y-8">
                                        <GeneralInformation employee={employee} />

                                        {/* Time Keeping Data */}
                                        <div className="pt-2">
                                            <AttendanceCards
                                                metrics={{
                                                    tardiness: computed?.tardiness,
                                                    undertime: computed?.undertime,
                                                    overtime: computed?.overtime,
                                                    absences: computed?.absences,
                                                    total_hours: computed?.total_hours,
                                                    college_paid_hours: (computed as any)?.college_paid_hours,
                                                    overtime_count_weekdays: computed?.overtime_count_weekdays,
                                                    overtime_count_weekends: computed?.overtime_count_weekends,
                                                    rate_per_hour: computed?.rate_per_hour,
                                                    college_rate: computed?.college_rate,
                                                    salary_rate: (computed as any)?.salary_rate,
                                                }}
                                                selectedMonth={selectedMonth}
                                                availableMonths={availableMonths}
                                                onMonthChange={handleMonthChange}
                                                ratePerHour={computed?.rate_per_hour}
                                                collegeRate={computed?.college_rate}
                                                isCollegeInstructor={String(employee.roles || '').toLowerCase().includes('college instructor')}
                                                rolesText={employee.roles as unknown as string}
                                                isEmpty={(records?.length ?? 0) === 0}
                                                isLoading={isLoading}
                                            />
                                        </div>
                                    </div>
                                </DialogScrollArea>

                                <DialogFooter className="mt-6">
                                    <Button onClick={onClose}>Close</Button>
                                </DialogFooter>
                            </>
                        )}
                    </TimeKeepingDataProvider>
                </DialogContent>
            )}
        </Dialog>
    );
}

