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
import { ReportDataProvider } from "./dialog-components/report-data-provider";

type Props = {
    employee: Employees | null;
    onClose: () => void;
};

export default function ReportViewDialog({ employee, onClose }: Props) {
    return (
        <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
            {!!employee && (
                <ReportDataProvider employee={employee}>
                    {() => (
                        <DialogContent className="max-w-6xl h-[85vh] w-full px-8 py-6 z-[100] flex flex-col min-h-0 overflow-hidden">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">
                                    Report Details
                                </DialogTitle>
                            </DialogHeader>

                            {/* Sticky summary header */}
                            <EmployeeName employee={employee} />

                            {/* Scrollable content */}
                            <DialogScrollArea className="mt-4">
                                <div className="space-y-6">
                                    <GeneralInformation employee={employee} />
                                </div>
                            </DialogScrollArea>

                            <DialogFooter className="mt-6">
                                <Button onClick={onClose}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    )}
                </ReportDataProvider>
            )}
        </Dialog>
    );
}

