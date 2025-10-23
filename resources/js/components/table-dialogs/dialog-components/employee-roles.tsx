import React from "react";
import { Shield, GraduationCap, Book, User } from 'lucide-react';
import { COLLEGE_PROGRAMS } from "@/constants/college-programs";

function getProgramLabel(value: string): string {
    const found = COLLEGE_PROGRAMS.find(p => p.value === value);
    return found ? found.label : value;
}

export type EmployeeRolesListProps = {
    roles?: string | string[] | null;
    collegeProgram?: string | null;
    className?: string;
    compact?: boolean;
};

function normalizeRoles(roles?: string | string[] | null): string[] {
    if (!roles) return [];
    if (Array.isArray(roles)) return roles.map((r) => String(r).trim()).filter(Boolean);
    return roles
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
}

function RoleBadge({ label }: { label: string }) {
    const lower = label.toLowerCase();
    const style =
        lower.includes('administrator')
            ? { icon: <Shield size={12} />, className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300' }
            : lower.includes('college instructor')
                ? { icon: <GraduationCap size={12} />, className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' }
                : lower.includes('basic education instructor')
                    ? { icon: <Book size={12} />, className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' }
                    : { icon: <User size={12} />, className: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' };
    return (
        <div
            className={
                "inline-flex max-w-full items-center gap-x-1.5 whitespace-nowrap overflow-hidden rounded-full px-2.5 py-1 text-xs font-semibold " +
                style.className
            }
            title={label}
        >
            {style.icon}
            <span className="capitalize">{label}</span>
        </div>
    );
}

export default function EmployeeRolesList({ roles, collegeProgram, className = "", compact = false }: EmployeeRolesListProps) {
    const all = React.useMemo(() => normalizeRoles(roles), [roles]);
    if (!all.length) {
        return <div className={compact ? "px-0 py-0" : "px-4 py-2"}><span className="text-muted-foreground text-sm">Not Assigned</span></div>;
    }

    // If "college instructor" role exists and collegeProgram provided, append acronyms in brackets
    const programs = typeof collegeProgram === "string" && collegeProgram
        ? collegeProgram.split(",").map((p) => p.trim()).filter(Boolean)
        : [];

    const items = all.map((r) => {
        if (r.toLowerCase() === "college instructor" && programs.length) {
            const badgeLabel = `${r} [${programs.join(", ")}]`;
            const detailItems = programs.map((p) => ({ code: p, label: getProgramLabel(p) }));
            return { badgeLabel, detailItems } as const;
        }
        return { badgeLabel: r } as const;
    });

    return (
        <div className={(compact ? "px-0 py-0 " : "px-4 py-2 ") + (className || "") }>
            <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-1.5'}`}>
                {items.map((item, idx) => (
                    <div key={`${item.badgeLabel}-${idx}`} className="flex items-center flex-wrap gap-x-2 gap-y-1">
                        <RoleBadge label={item.badgeLabel} />
                        {"detailItems" in item && item.detailItems && item.detailItems.length > 0 && (
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground min-w-0">
                                {item.detailItems.map((d, i) => (
                                    <React.Fragment key={d.code}>
                                        {i > 0 && <span className="opacity-60">•</span>}
                                        <span className="break-words">{d.code}: {d.label}</span>
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
