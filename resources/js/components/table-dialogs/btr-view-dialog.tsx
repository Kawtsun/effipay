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
import { BtrDataProvider } from "./dialog-components/btr-data-provider";
import { MonthRangePicker } from "../ui/month-range-picker";
import BTRTable from "./dialog-components/btr-table";

type Props = {
    employee: Employees | null;
    onClose: () => void;
};

export default function BTRViewDialog({ employee, onClose }: Props) {
    return (
        <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
            {!!employee && (
                <DialogContent className="max-w-6xl h-[85vh] w-full px-8 py-6 z-[100] flex flex-col min-h-0 overflow-hidden">
                    <BtrDataProvider employee={employee}>
                        {({ selectedMonth, setSelectedMonth, availableMonths, records, recordMap, observanceMap, leaveDatesMap, isLoading, formatTime12Hour }) => (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">
                                        Biometric Time Record Details
                                    </DialogTitle>
                                </DialogHeader>

                                {/* Sticky summary header */}
                                <EmployeeName employee={employee} />

                                {/* Scrollable content */}
                                <DialogScrollArea className="mt-4">
                                    <div className="space-y-8">
                                        <GeneralInformation employee={employee} />

                                        {/* BTR Table */}
                                        <div className="pt-2">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-semibold text-lg">Biometric Logs</h4>
                                                <MonthRangePicker
                                                    value={selectedMonth}
                                                    onValueChange={(m) => setSelectedMonth(m)}
                                                    placeholder="Select month"
                                                    className="w-56 min-w-0 px-2 py-1 text-sm"
                                                    availableMonths={availableMonths}
                                                />
                                            </div>
                                            <BTRTable
                                                selectedMonth={selectedMonth}
                                                records={records}
                                                recordMap={recordMap}
                                                observanceMap={observanceMap}
                                                leaveDatesMap={leaveDatesMap}
                                                isLoading={isLoading}
                                                formatTime12Hour={formatTime12Hour}
                                            />
                                        </div>
                                    </div>
                                </DialogScrollArea>

                                <DialogFooter className="mt-6">
                                    <Button onClick={onClose}>Close</Button>
                                </DialogFooter>
                            </>
                        )}
                    </BtrDataProvider>
                </DialogContent>
            )}
        </Dialog>
    );
}

