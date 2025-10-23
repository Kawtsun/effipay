import React from "react";
import type { Employees } from "@/types";
import { EmployeeTypesList } from "./employee-types";
import EmployeeRolesList from "./employee-roles";
import { EmployeeScheduleBadges } from "@/components/employee-schedule-badges";
import { StatusBadge } from "@/components/status-badge";

// reserved for future fields

type Props = {
	employee: Employees;
};

export default function GeneralInformation({ employee }: Props) {
	return (
		<div className="space-y-3">
			<h4 className="font-semibold text-base border-b pb-2">General Information</h4>

			{/* Compact, aligned layout: Types + Status row; Roles row; Schedule row */}
			<div className="grid grid-cols-12 gap-4">
				{/* Types */}
				<div className="col-span-12 md:col-span-6">
					<div className="text-xs text-muted-foreground mb-1">Employee Types</div>
					<EmployeeTypesList employeeTypes={employee.employee_types} compact />
				</div>
				{/* Status */}
				<div className="col-span-12 md:col-span-6">
					<div className="text-xs text-muted-foreground mb-1">Status</div>
					<div className="flex items-center gap-2">
						<StatusBadge status={employee.employee_status} />
					</div>
				</div>
				{/* Roles */}
				<div className="col-span-12">
					<div className="text-xs text-muted-foreground mb-1">Roles</div>
					<EmployeeRolesList roles={employee.roles} collegeProgram={employee.college_program} compact />
				</div>
				{/* Schedule */}
				<div className="col-span-12">
					<div className="text-xs text-muted-foreground mb-1">Schedule</div>
					<EmployeeScheduleBadges workDays={employee.work_days || []} />
				</div>
			</div>
		</div>
	);
}

