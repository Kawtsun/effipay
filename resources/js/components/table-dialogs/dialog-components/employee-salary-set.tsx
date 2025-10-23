import React from "react";
import type { Employees } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Banknote, HandCoins, Wallet, ReceiptText, CheckCircle, Info, PhilippinePeso } from "lucide-react";

type Props = {
	employee: Employees;
};

// Fallback-safe currency formatter using Philippine Peso icon
function formatMoney(value: unknown): React.ReactNode {
	if (value === null || value === undefined) return "—";
	const num = typeof value === "string" ? parseFloat(value) : (value as number);
	if (Number.isNaN(num)) return "—";
	const amount = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	return (
		<span className="inline-flex items-center gap-1">
			<PhilippinePeso className="h-3.5 w-3.5" />
			{amount}
		</span>
	);
}

function FieldRow({ label, value, checked }: { label: string; value: React.ReactNode; checked?: boolean }) {
	return (
		<div className="flex items-center justify-between gap-4 py-1.5">
			<span className={`inline-flex items-center text-xs ${checked ? "font-semibold text-green-600" : "text-muted-foreground"}`}>
				{checked ? <CheckCircle className="h-4 w-4 mr-1" /> : null}
				{label}
			</span>
			<span className="text-sm font-medium tabular-nums">{value}</span>
		</div>
	);
}

function BoolRow({ label, tooltip }: { label: string; tooltip?: string }) {
	return (
		<div className="flex items-center justify-between gap-4 py-1.5">
			<div className="flex items-center gap-2">
				<span className="inline-flex items-center text-xs font-semibold text-green-600">
					<CheckCircle className="h-4 w-4 mr-1" /> {label}
				</span>
				{tooltip ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								aria-label={`${label} info`}
								className="text-muted-foreground"
							>
								<Info className="h-4 w-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent>
							<p>{tooltip}</p>
						</TooltipContent>
					</Tooltip>
				) : null}
			</div>
			<span className="text-sm font-medium tabular-nums"></span>
		</div>
	);
}

// Safely read an optional numeric field that may not exist on Employees
function readOptionalNumber(obj: unknown, key: string): number | undefined {
	if (!obj || typeof obj !== "object") return undefined;
	const raw = (obj as Record<string, unknown>)[key];
	if (raw === null || raw === undefined) return undefined;
	const num = typeof raw === "string" ? parseFloat(raw) : (typeof raw === "number" ? raw : undefined);
	if (num === undefined || Number.isNaN(num)) return undefined;
	return num;
}

export default function EmployeeSalarySet({ employee }: Props) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			{/* Compensation */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="font-semibold text-base leading-tight">Salary & Compensation</CardTitle>
					<CardDescription className="text-xs">Base pay and other earnings</CardDescription>
				</CardHeader>
				<CardContent className="space-y-1.5">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-muted/50">
							<Wallet className="h-3.5 w-3.5" />
						</span>
						<span>Compensation</span>
					</div>

					<div className="mt-1.5">
						<FieldRow label="Base Salary" value={formatMoney(employee.base_salary)} />
						{typeof employee.rate_per_day !== "undefined" && (
							<FieldRow label="Rate / Day" value={formatMoney(employee.rate_per_day)} />
						)}
						{typeof employee.rate_per_hour !== "undefined" && (
							<FieldRow label="Rate / Hour" value={formatMoney(employee.rate_per_hour)} />
						)}
						{typeof employee.college_rate !== "undefined" && (
							<FieldRow label="College Rate / Hour" value={formatMoney(employee.college_rate)} />
						)}
						<FieldRow label="Honorarium" value={formatMoney(employee.honorarium)} />
						{typeof employee.overtime_pay !== "undefined" && (
							<FieldRow label="Overtime Pay" value={formatMoney(employee.overtime_pay)} />
						)}
					</div>
				</CardContent>
			</Card>

			{/* Statutory Contributions */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="font-semibold text-base leading-tight">Statutory Contributions</CardTitle>
					<CardDescription className="text-xs">Government-mandated contributions</CardDescription>
				</CardHeader>
				<CardContent className="space-y-1.5">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-muted/50">
							<Banknote className="h-3.5 w-3.5" />
						</span>
						<span>Contributions</span>
					</div>

					<div className="mt-1.5">
						{/* Match create/edit: green check with info tooltip, no numeric value */}
						<BoolRow label="SSS Contribution" tooltip="SSS contribution will be calculated after running the payroll." />
						<BoolRow label="PhilHealth Contribution" tooltip="PhilHealth contribution will be calculated after running the payroll." />
						{(() => {
							const pagibig = readOptionalNumber(employee, "pag_ibig");
							return (
								<FieldRow
									label="Pag-IBIG"
									value={formatMoney(employee.pag_ibig)}
									checked={typeof pagibig !== "undefined" && pagibig > 0}
								/>
							);
						})()}
						{/* Required boolean */}
						<BoolRow label="Withholding Tax" tooltip="Withholding Tax contribution will be calculated after running the payroll." />
					</div>
				</CardContent>
			</Card>

			{/* Loans */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="font-semibold text-base leading-tight">Loans</CardTitle>
					<CardDescription className="text-xs">Active salary and emergency loans</CardDescription>
				</CardHeader>
				<CardContent className="space-y-1.5">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-muted/50">
							<HandCoins className="h-3.5 w-3.5" />
						</span>
						<span>Loans</span>
					</div>

					<div className="mt-1.5">
						{/* Some datasets use salary_loan; forms may store SSS Salary Loan */}
						{typeof employee.salary_loan !== "undefined" && (
							<FieldRow label="Salary Loan" value={formatMoney(employee.salary_loan)} />
						)}
						{typeof employee.calamity_loan !== "undefined" && (
							<FieldRow label="Calamity Loan" value={formatMoney(employee.calamity_loan)} />
						)}
						{typeof employee.multipurpose_loan !== "undefined" && (
							<FieldRow label="Multipurpose Loan" value={formatMoney(employee.multipurpose_loan)} />
						)}
					</div>
				</CardContent>
			</Card>

			{/* Other Deductions */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="font-semibold text-base leading-tight">Other Deductions</CardTitle>
					<CardDescription className="text-xs">Recurring non-statutory deductions</CardDescription>
				</CardHeader>
				<CardContent className="space-y-1.5">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-muted/50">
							<ReceiptText className="h-3.5 w-3.5" />
						</span>
						<span>Deductions</span>
					</div>

					<div className="mt-1.5">
						{/* Some records may track tuition; show if present */}
						{(() => {
							const tuition = readOptionalNumber(employee, "tuition");
							return typeof tuition !== "undefined" ? (
								<FieldRow label="Tuition" value={formatMoney(tuition)} />
							) : null;
						})()}
						{typeof employee.peraa_con !== "undefined" && (
							<FieldRow label="PERAA" value={formatMoney(employee.peraa_con)} />
						)}
						{typeof employee.china_bank !== "undefined" && (
							<FieldRow label="China Bank" value={formatMoney(employee.china_bank)} />
						)}
						{typeof employee.tea !== "undefined" && (
							<FieldRow label="TEA" value={formatMoney(employee.tea)} />
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

