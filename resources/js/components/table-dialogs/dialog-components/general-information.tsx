import React from "react";
import type { Employees } from "@/types";
import { EmployeeTypesList } from "./employee-types";
import EmployeeRolesList from "./employee-roles";
import { EmployeeScheduleBadges } from "@/components/employee-schedule-badges";
import type { WorkDayTime } from "@/components/employee-schedule-badges";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
			<CardHeader className="pb-2">
				<CardTitle className="text-lg font-semibold leading-6 truncate">General Information</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				{/* Compact 4-up grid with subtle separators on lg+ */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 lg:[&>div:nth-child(n+2)]:border-l lg:[&>div:nth-child(n+2)]:border-border/50 lg:[&>div:nth-child(n+2)]:pl-6">
					{/* Types */}
					<div className="min-w-0">
						<div className="grid grid-cols-[auto,auto,1fr] items-center gap-2 text-xs">
							<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 dark:bg-primary border border-primary/20">
								<Tags className="h-3 w-3 text-primary dark:text-primary-foreground" />
							</span>
							<span className="shrink-0 text-muted-foreground font-medium">Employee Type</span>
							<div className="min-w-0 truncate">
								{employee.employee_types ? (
									<EmployeeTypesList employeeTypes={employee.employee_types} compact />
								) : (
									<span className="text-muted-foreground">None</span>
								)}
							</div>
						</div>
					</div>

					{/* Status */}
					<div className="min-w-0">
						<div className="grid grid-cols-[auto,auto,1fr] items-center gap-2 text-xs">
							<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 dark:bg-primary border border-primary/20">
								<BadgeCheck className="h-3 w-3 text-primary dark:text-primary-foreground" />
							</span>
							<span className="shrink-0 text-muted-foreground font-medium">Employee Status</span>
							<div className="min-w-0 truncate">
								<StatusBadge status={employee.employee_status} />
							</div>
						</div>
					</div>

					{/* Roles */}
					<div className="min-w-0">
						<div className="grid grid-cols-[auto,auto,1fr] items-start gap-2 text-xs">
							<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 dark:bg-primary border border-primary/20">
								<UserCog className="h-3 w-3 text-primary dark:text-primary-foreground" />
							</span>
							<span className="shrink-0 text-muted-foreground font-medium">Employee Role</span>
							<div className="min-w-0 whitespace-normal break-words pr-1 [&_*]:whitespace-normal [&_*]:break-words [&_*]:flex-wrap [&_*]:min-w-0">
								{employee.roles ? (
									<EmployeeRolesList roles={employee.roles} collegeProgram={employee.college_program} compact />
								) : (
									<span className="text-muted-foreground">None</span>
								)}
							</div>
						</div>
					</div>

					{/* Schedule */}
					<div className="min-w-0">
							<div className="grid grid-cols-[auto,auto,1fr] items-start gap-2 text-xs">
							<span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 dark:bg-primary border border-primary/20">
								<CalendarDays className="h-3 w-3 text-primary dark:text-primary-foreground" />
							</span>
							<span className="shrink-0 text-muted-foreground font-medium">Employee Schedule</span>
								<div className="min-w-0 whitespace-normal break-words pr-1 [&_*]:whitespace-normal [&_*]:break-words [&_*]:flex-wrap [&_*]:min-w-0">
									{/* Ensure badges don’t get cut off and can wrap to multiple lines */}
									<div className="w-full max-w-full flex flex-wrap gap-2 items-start">
										<EmployeeScheduleBadges workDays={workDays} collegeSchedules={collegeSchedules} />
									</div>
								</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

