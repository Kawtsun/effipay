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

type Props = {
	employee: Employees | null;
	onClose: () => void;
};

export default function EmployeeViewDialog({ employee, onClose }: Props) {
	return (
		<Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
			{!!employee && (
				<DialogContent className="max-w-6xl max-h-[90vh] w-full px-8 py-6 z-[100]">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold">
							Employee Details
						</DialogTitle>
					</DialogHeader>

                    <EmployeeName employee={employee} />

					{/* Scrollable content */}
					<DialogScrollArea>
						<GeneralInformation employee={employee} />
					</DialogScrollArea>

					<DialogFooter className="mt-6">
						<Button onClick={onClose}>Close</Button>
					</DialogFooter>
				</DialogContent>
			)}
		</Dialog>
	);
}

