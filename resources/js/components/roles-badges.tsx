import { Employees } from "@/types";
import { Badge } from "./ui/badge";
import { Shield, GraduationCap, Book, User } from "lucide-react";
import { getCollegeProgramLabel } from '@/constants/college-programs';

export function RolesBadges({ roles, activeRoles, employee }: { roles: string; activeRoles?: string[]; employee: Employees }) {
  if (!roles) return null;
  let rolesArr = roles.split(",").map((r) => r.trim()).filter(Boolean);
  const order = ["administrator", "college instructor", "basic education instructor"];
  const activeRolesArr = activeRoles || [];
  if (activeRolesArr.length > 0) {
    const filtered = activeRolesArr.filter((r) => rolesArr.includes(r));
    const rest = rolesArr.filter((r) => !filtered.includes(r));
    rolesArr = [...filtered, ...rest];
  } else {
    // Show standard roles in order, then custom roles
    const ordered = order.filter((r) => rolesArr.includes(r));
    const custom = rolesArr.filter((r) => !order.includes(r));
    rolesArr = [...ordered, ...custom];
  }
  return (
    <div className="flex flex-wrap gap-2 max-w-lg px-4 py-2 break-words whitespace-pre-line">
      {rolesArr.map((role) => {
        let color: "secondary" | "info" | "purple" | "warning" = "secondary";
        let icon = null;
        let extra = null;
        if (role === "administrator") {
          color = "info";
          icon = <Shield className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
        } else if (role === "college instructor") {
          color = "purple";
          icon = <GraduationCap className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
          if (employee && employee.college_program) {
            extra = (
              <span className="ml-1 text-xs font-semibold text-white">
                [{employee.college_program}] {getCollegeProgramLabel(employee.college_program)}
              </span>
            );
          }
        } else if (role === "basic education instructor") {
          color = "warning";
          icon = <Book className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
        } else {
          color = "purple";
          icon = <User className="w-3.5 h-3.5 mr-1 inline-block align-text-bottom" />;
        }
        return (
          <Badge key={role} variant={color} className={`capitalize flex items-center${!order.includes(role) ? ' custom-role-badge' : ''}`}>
            {icon}
            {role.replace(/\b\w/g, (c) => c.toUpperCase())}
            {extra}
          </Badge>
        );
      })}
    </div>
  );
}
