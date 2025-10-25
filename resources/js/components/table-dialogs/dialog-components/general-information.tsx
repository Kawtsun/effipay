import React from "react";
import type { Employees } from "@/types";
import { EmployeeTypesList } from "./employee-types";
import EmployeeRolesList from "./employee-roles";
import { EmployeeScheduleBadges } from "@/components/employee-schedule-badges";
import type { WorkDayTime } from "@/components/employee-schedule-badges";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tags, BadgeCheck, UserCog, CalendarDays } from "lucide-react";

// reserved for future fields

type Props = {
	employee: Employees;
};

export default function GeneralInformation({ employee }: Props) {
	// Safely read optional schedule fields that may not be present on the Employees type
	const workDays: WorkDayTime[] = (
		(employee as unknown as { work_days?: WorkDayTime[] }).work_days ?? []
	);
	const collegeSchedules = (
		(employee as unknown as { college_schedules?: Array<{ day: string; hours_per_day: number; program_code?: string }>|Record<string, Array<{ day: string; hours_per_day: number; program_code?: string }>> }).college_schedules ?? []
	);
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="font-semibold text-base leading-tight">General Information</CardTitle>
				<CardDescription className="text-xs">Key employment details at a glance</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				{/* Row 1: Types + Status */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Types */}
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-muted/50">
								<Tags className="h-3.5 w-3.5 text-primary dark:text-primary-foreground" />
							</span>
							<span>Employee Types</span>
						</div>
						<div>
							{employee.employee_types ? (
								<EmployeeTypesList employeeTypes={employee.employee_types} compact />
							) : (
								<div className="text-xs text-muted-foreground">No employee types</div>
							)}
						</div>
					</div>

					{/* Status */}
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-muted/50">
								<BadgeCheck className="h-3.5 w-3.5 text-primary dark:text-primary-foreground" />
							</span>
							<span>Status</span>
						</div>
						<div className="flex items-center gap-2">
							<StatusBadge status={employee.employee_status} />
						</div>
					</div>
				</div>

				{/* Roles */}
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-muted/50">
							<UserCog className="h-3.5 w-3.5 text-primary dark:text-primary-foreground" />
						</span>
						<span>Roles</span>
					</div>
					<div>
						{employee.roles ? (
							<EmployeeRolesList roles={employee.roles} collegeProgram={employee.college_program} compact />
						) : (
							<div className="text-xs text-muted-foreground">No roles assigned</div>
						)}
					</div>
				</div>

				{/* Schedule */}
				<div className="space-y-2">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-muted/50">
							<CalendarDays className="h-3.5 w-3.5 text-primary dark:text-primary-foreground" />
						</span>
						<span>Schedule</span>
					</div>
					<div>
						<EmployeeScheduleBadges workDays={workDays} collegeSchedules={collegeSchedules} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

