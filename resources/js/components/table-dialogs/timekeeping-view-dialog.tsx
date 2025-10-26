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
import { MonthRangePicker } from "../ui/month-range-picker";
import AttendanceCards from "./dialog-components/attendance-cards";

type Props = {
    employee: Employees | null;
    onClose: () => void;
};

export default function EmployeeViewDialog({ employee, onClose }: Props) {
    return (
        <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
            {!!employee && (
                <DialogContent className="max-w-6xl h-[85vh] w-full px-8 py-6 z-[100] flex flex-col min-h-0 overflow-hidden">
                    <TimeKeepingDataProvider employee={employee}>
                        {({ selectedMonth, availableMonths, handleMonthChange, records, computed, isLoading }) => (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">
                                        Employee Details
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
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-semibold text-lg">Time Keeping Data</h4>
                                                <MonthRangePicker
                                                    value={selectedMonth}
                                                    onValueChange={handleMonthChange}
                                                    placeholder="Select month"
                                                    className="w-56 min-w-0 px-2 py-1 text-sm"
                                                    availableMonths={availableMonths}
                                                />
                                            </div>
                                            <AttendanceCards
                                                metrics={{
                                                    tardiness: computed?.tardiness,
                                                    undertime: computed?.undertime,
                                                    overtime: computed?.overtime,
                                                    absences: computed?.absences,
                                                    total_hours: computed?.total_hours,
                                                    overtime_count_weekdays: computed?.overtime_count_weekdays,
                                                    overtime_count_weekends: computed?.overtime_count_weekends,
                                                    rate_per_hour: computed?.rate_per_hour,
                                                    college_rate: computed?.college_rate,
                                                }}
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

