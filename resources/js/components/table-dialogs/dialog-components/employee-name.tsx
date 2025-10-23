import React from "react";
import { formatFullName } from "@/utils/formatFullName";
import type { Employees } from "@/types";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "span";

export type EmployeeNameProps = {
    employee: Pick<Employees, "id" | "last_name" | "first_name" | "middle_name">;
    as?: HeadingTag;
    className?: string;
    showId?: boolean;
};

export function EmployeeName({ employee, as = "h3", className = "text-xl font-extrabold", showId = true }: EmployeeNameProps) {
    const text = `${showId ? `#${employee.id} - ` : ""}${formatFullName(employee.last_name, employee.first_name, employee.middle_name)}`;
    return React.createElement(as, { className }, text);
}
