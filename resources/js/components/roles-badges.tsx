import { Employees } from "@/types";
import { Badge } from "./ui/badge";
import { Shield, GraduationCap, Book } from "lucide-react";

const COLLEGE_PROGRAMS = [
  { value: 'BSBA', label: 'Bachelor of Science in Business Administration' },
  { value: 'BSA', label: 'Bachelor of Science in Accountancy' },
  { value: 'COELA', label: 'College of Education and Liberal Arts' },
  { value: 'BSCRIM', label: 'Bachelor of Science in Criminology' },
  { value: 'BSCS', label: 'Bachelor of Science in Computer Science' },
  { value: 'JD', label: 'Juris Doctor' },
  { value: 'BSN', label: 'Bachelor of Science in Nursing' },
  { value: 'RLE', label: 'Related Learning Experience' },
  { value: 'CG', label: 'Career Guidance or Computer Graphics' },
  { value: 'BSPT', label: 'Bachelor of Science in Physical Therapy' },
  { value: 'GSP', label: 'Graduate Studies Programs' },
  { value: 'MBA', label: 'Master of Business Administration' },
];

export function getCollegeProgramLabel(acronym: string) {
  const found = COLLEGE_PROGRAMS.find((p) => p.value === acronym);
  return found ? found.label : acronym;
}

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
    rolesArr = order.filter((r) => rolesArr.includes(r));
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
        }
        return (
          <Badge key={role} variant={color} className="capitalize flex items-center">
            {icon}
            {role.replace(/\b\w/g, (c) => c.toUpperCase())}
            {extra}
          </Badge>
        );
      })}
    </div>
  );
}
