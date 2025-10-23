import React from "react";

type EmployeeType = { role?: string; type: string };

export type EmployeeTypesListProps = {
    employeeTypes?: unknown; // array of {role,type} or string (comma-separated)
    text?: string | null; // alternative input if types provided as text
    className?: string;
    compact?: boolean;
};

function isEmployeeTypeLike(x: unknown): x is { type: unknown; role?: unknown } {
    return typeof x === "object" && x !== null && "type" in (x as Record<string, unknown>);
}

function normalizeTypes(input?: unknown, text?: string | null): EmployeeType[] {
    if (Array.isArray(input)) {
        const out: EmployeeType[] = [];
        for (const it of input) {
            if (isEmployeeTypeLike(it)) {
                const rawType = it.type;
                const t = typeof rawType === "string" ? rawType.trim() : String(rawType ?? "").trim();
                if (!t) continue;
                const roleVal = isEmployeeTypeLike(it) && "role" in it ? (it as { role?: unknown }).role : undefined;
                const role = typeof roleVal === "string" ? roleVal : roleVal != null ? String(roleVal) : undefined;
                out.push({ type: t, role });
            }
        }
        return out;
    }
    const base = typeof text === "string" ? text : typeof input === "string" ? (input as string) : "";
    if (!base) return [];
    return base
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((t) => ({ type: t }));
}

function TypeBadge({ type }: { type: EmployeeType }) {
    return (
        <div
            className={
                "inline-flex max-w-full items-center gap-x-1.5 whitespace-nowrap overflow-hidden rounded-full border px-2.5 py-1 text-xs font-medium " +
                "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700"
            }
            title={type.type}
        >
            <span className="capitalize truncate">{type.type}</span>
        </div>
    );
}

export function EmployeeTypesList({ employeeTypes, text, className = "", compact = false }: EmployeeTypesListProps) {
    const types = React.useMemo(() => normalizeTypes(employeeTypes, text), [employeeTypes, text]);
    if (!types.length) {
        return <div className={compact ? "px-0 py-0" : "px-4 py-2"}><span className="text-muted-foreground text-sm">Not Assigned</span></div>;
    }
    const showRole = types.length > 1;
    return (
        <div className={(compact ? "px-0 py-0 " : "px-4 py-2 ") + (className || "") }>
            <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-3'}`}>
                {types.map((t, idx) => (
                    <div key={`${t.type}-${idx}`} className="flex items-center gap-2">
                        <TypeBadge type={t} />
                        {showRole && t.role && (
                            <span className="text-xs capitalize text-muted-foreground">{t.role}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EmployeeTypesList;
