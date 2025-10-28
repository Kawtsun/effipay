import React from "react";
import type { Employees } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Banknote, HandCoins, Wallet, ReceiptText, CheckCircle, Info, PhilippinePeso, BanknoteArrowDown, CircleMinus } from "lucide-react";

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

function BoolRow({ label, tooltip, value }: { label: string; tooltip?: string; value?: boolean }) {
	return (
		<div className="flex items-center justify-between gap-4 py-1.5">
			<div className="flex items-center gap-2">
				<span className={`inline-flex items-center text-xs ${value ? "font-semibold text-green-600" : "text-muted-foreground"}`}>
					{value ? <CheckCircle className="h-4 w-4 mr-1" /> : null} {label}
				</span>
				{tooltip ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								aria-label={`${label} info`}
								className="text-muted-foreground"
								// Prevent initial auto-focus from Dialog focusing this control (which would open the tooltip)
								tabIndex={-1}
								onFocus={(e) => e.currentTarget.blur()}
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
				<CardHeader>
					<CardTitle className="font-semibold text-base leading-tight">Earnings</CardTitle>
					<CardDescription className="text-xs">Employee salary earnings</CardDescription>
				</CardHeader>
				<CardContent className="space-y-1.5">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 dark:bg-primary border border-primary/20">
							<Banknote className="h-4 w-4 text-primary dark:text-primary-foreground" />
						</span>
						<span>Earnings</span>
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
				<CardHeader>
					<CardTitle className="font-semibold text-base leading-tight">Contributions</CardTitle>
					<CardDescription className="text-xs">Government-mandated contributions</CardDescription>
				</CardHeader>
				<CardContent className="space-y-1.5">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 dark:bg-primary border border-primary/20">
							<BanknoteArrowDown className="h-4 w-4 text-primary dark:text-primary-foreground" />
						</span>
						<span>Contributions</span>
					</div>

					<div className="mt-1.5">
						{/* Show boolean/tinyint flags from DB */}
						<BoolRow label="SSS Contribution" value={!!employee.sss} tooltip="SSS contribution will be calculated after running the payroll." />
						<BoolRow label="PhilHealth Contribution" value={!!employee.philhealth} tooltip="PhilHealth contribution will be calculated after running the payroll." />
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
						{/* Withholding tax is boolean now (tinyint) */}
						<BoolRow label="Withholding Tax" value={!!employee.withholding_tax} tooltip="Withholding Tax contribution will be calculated after running the payroll." />
					</div>
				</CardContent>
			</Card>

			{/* Loans */}
			<Card>
				<CardHeader>
					<CardTitle className="font-semibold text-base leading-tight">Loans</CardTitle>
					<CardDescription className="text-xs">Active salary and emergency loans</CardDescription>
				</CardHeader>
				<CardContent className="space-y-1.5">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 dark:bg-primary border border-primary/20">
							<ReceiptText className="h-4 w-4 text-primary dark:text-primary-foreground" />
						</span>
						<span>Loans</span>
					</div>

					<div className="mt-1.5">
						{(() => {
							const val = readOptionalNumber(employee, "sss_salary_loan");
							return (
								<FieldRow
									label="SSS Salary Loan"
									value={formatMoney(employee.sss_salary_loan)}
									checked={typeof val !== "undefined" && val > 0}
								/>
							);
						})()}

						{(() => {
							const val = readOptionalNumber(employee, "sss_calamity_loan");
							return (
								<FieldRow
									label="SSS Calamity Loan"
									value={formatMoney(employee.sss_calamity_loan)}
									checked={typeof val !== "undefined" && val > 0}
								/>
							);
						})()}

						{(() => {
							const val = readOptionalNumber(employee, "pagibig_multi_loan");
							return (
								<FieldRow
									label="Pagibig Multi Loan"
									value={formatMoney(employee.pagibig_multi_loan)}
									checked={typeof val !== "undefined" && val > 0}
								/>
							);
						})()}

						{(() => {
							const val = readOptionalNumber(employee, "pagibig_calamity_loan");
							return (
								<FieldRow
									label="Pagibig Calamity Loan"
									value={formatMoney(employee.pagibig_calamity_loan)}
									checked={typeof val !== "undefined" && val > 0}
								/>
							);
						})()}
					</div>
				</CardContent>
			</Card>

			{/* Other Deductions */}
			<Card>
				<CardHeader>
					<CardTitle className="font-semibold text-base leading-tight">Other Deductions</CardTitle>
					<CardDescription className="text-xs">Recurring non-statutory deductions</CardDescription>
				</CardHeader>
				<CardContent className="space-y-1.5">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 dark:bg-primary border border-primary/20">
							<CircleMinus className="h-4 w-4 text-primary dark:text-primary-foreground" />
						</span>
						<span>Deductions</span>
					</div>

					<div className="mt-1.5">

						{(() => {
							const val = readOptionalNumber(employee, "tuition");
							return (
								<FieldRow
									label="Tuition"
									value={formatMoney(employee.tuition)}
									checked={typeof val !== "undefined" && val > 0}
								/>
							);
						})()}
						{(() => {
							const val = readOptionalNumber(employee, "china_bank");
							return (
								<FieldRow
									label="China Bank"
									value={formatMoney(employee.china_bank)}
									checked={typeof val !== "undefined" && val > 0}
								/>
							);
						})()}
						{(() => {
							const val = readOptionalNumber(employee, "tea");
							return (
								<FieldRow
									label="TEA"
									value={formatMoney(employee.tea)}
									checked={typeof val !== "undefined" && val > 0}
								/>
							);
						})()}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

