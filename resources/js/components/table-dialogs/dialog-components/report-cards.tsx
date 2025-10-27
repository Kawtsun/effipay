import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { MonthRangePicker } from "../../ui/month-range-picker";

type Props = {
	title?: string;
	className?: string;

	// Month controls (same UX pattern as BTR/Timekeeping dialogs)
	selectedMonth: string;
	availableMonths: string[];
	onMonthChange: (month: string) => void;

	// From ReportDataProvider
	getSummaryCardAmount: (type: "tardiness" | "undertime" | "overtime" | "absences") => string;
	getSummaryCardHours: (type: "tardiness" | "undertime" | "overtime" | "absences") => string;
	selectedPayroll: {
		gross_pay?: number | null;
		total_deductions?: number | null;
		net_pay?: number | null;
	} | null;
	monthlyPayrollData?: { payrolls: Array<{ id: number; payroll_date: string }> } | null;
};

function formatAmount(n?: number | null): string {
	if (n === null || n === undefined || !Number.isFinite(Number(n))) return "-";
	return `₱${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function halfAmount(n?: number | null): string {
	if (n === null || n === undefined || !Number.isFinite(Number(n))) return "-";
	return `₱${Number(n / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReportCards({
	title = "Salary & Contributions",
	className,
	selectedMonth,
	availableMonths,
	onMonthChange,
	getSummaryCardAmount,
	getSummaryCardHours,
	selectedPayroll,
}: Props) {
	const grossPay = selectedPayroll?.gross_pay ?? null;
	const totalDeductions = selectedPayroll?.total_deductions ?? null;
	const netPay = selectedPayroll?.net_pay ?? null;

	// Consistent layout and styles with AttendanceCards
	const cards = [
		{
			key: "tardiness",
			label: "Tardiness",
			value: getSummaryCardAmount("tardiness"),
			hoverValue: getSummaryCardHours("tardiness"),
			bg: "bg-amber-50/80 dark:bg-amber-950/30",
			ring: "ring-1 ring-amber-200 dark:ring-amber-700/60",
			text: "text-amber-700 dark:text-amber-300",
			valueText: "text-amber-800 dark:text-amber-200",
		},
		{
			key: "undertime",
			label: "Undertime",
			value: getSummaryCardAmount("undertime"),
			hoverValue: getSummaryCardHours("undertime"),
			bg: "bg-rose-50/80 dark:bg-rose-950/30",
			ring: "ring-1 ring-rose-200 dark:ring-rose-700/60",
			text: "text-rose-700 dark:text-rose-300",
			valueText: "text-rose-800 dark:text-rose-200",
		},
		{
			key: "overtime",
			label: "Overtime",
			value: getSummaryCardAmount("overtime"),
			hoverValue: getSummaryCardHours("overtime"),
			bg: "bg-sky-50/80 dark:bg-sky-950/30",
			ring: "ring-1 ring-sky-200 dark:ring-sky-700/60",
			text: "text-sky-700 dark:text-sky-300",
			valueText: "text-sky-800 dark:text-sky-200",
		},
		{
			key: "absences",
			label: "Absences",
			value: getSummaryCardAmount("absences"),
			hoverValue: getSummaryCardHours("absences"),
			bg: "bg-zinc-50/80 dark:bg-zinc-900/40",
			ring: "ring-1 ring-zinc-200 dark:ring-zinc-700/60",
			text: "text-zinc-600 dark:text-zinc-300",
			valueText: "text-zinc-900 dark:text-zinc-100",
		},
		{
			key: "gross_pay",
			label: "Gross Pay",
			value: formatAmount(grossPay),
			hoverValue: formatAmount(grossPay),
			bg: "bg-zinc-50/80 dark:bg-zinc-900/40",
			ring: "ring-1 ring-zinc-200 dark:ring-zinc-700/60",
			text: "text-zinc-600 dark:text-zinc-300",
			valueText: "text-zinc-900 dark:text-zinc-100",
		},
		{
			key: "total_deductions",
			label: "Total Deductions",
			value: formatAmount(totalDeductions),
			hoverValue: formatAmount(totalDeductions),
			bg: "bg-amber-50/80 dark:bg-amber-950/30",
			ring: "ring-1 ring-amber-200 dark:ring-amber-700/60",
			text: "text-amber-700 dark:text-amber-300",
			valueText: "text-amber-800 dark:text-amber-200",
		},
		{
			key: "net_pay",
			label: "Net Pay",
			value: formatAmount(netPay),
			hoverValue: formatAmount(netPay),
			bg: "bg-green-50/80 dark:bg-green-950/30",
			ring: "ring-1 ring-green-200 dark:ring-green-700/60",
			text: "text-green-700 dark:text-green-300",
			valueText: "text-green-800 dark:text-green-200",
		},
		{
			key: "per_payroll",
			label: "Per Payroll",
			value: halfAmount(netPay),
			hoverValue: halfAmount(netPay),
			// use the same sky palette as overtime for visual grouping
			bg: "bg-sky-50/80 dark:bg-sky-950/30",
			ring: "ring-1 ring-sky-200 dark:ring-sky-700/60",
			text: "text-sky-700 dark:text-sky-300",
			valueText: "text-sky-800 dark:text-sky-200",
		},
	] as const;

	// Hover and animation variants (borrowed to match AttendanceCards feel)
	const [hoveredKey, setHoveredKey] = React.useState<string | null>(null);
	const cardHover = {
		initial: { y: 0, scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" },
		hover: {
			y: -4,
			scale: 1.02,
			boxShadow: "0 12px 22px rgba(0,0,0,0.12)",
			transition: { duration: 0.15 },
		},
	};
	const itemVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } } as const;
	const cardVariants = { ...cardHover, ...itemVariants } as const;
	const valueVariants = { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0, transition: { duration: 0.16 } }, exit: { opacity: 0, y: -4, transition: { duration: 0.12 } } } as const;
	return (
		<Card className={className}>
			<CardHeader className="pb-4">
				<div className="flex items-center justify-between gap-4">
					<CardTitle className="text-lg font-semibold leading-6 truncate">
						{title}
					</CardTitle>
					<div className="shrink-0">
						<MonthRangePicker
							value={selectedMonth}
							onValueChange={onMonthChange}
							placeholder="Select month"
							className="w-56 min-w-0 px-2 py-1 text-sm"
							availableMonths={availableMonths}
						/>
					</div>
				</div>
			</CardHeader>

			<CardContent>
				<div className="grid grid-cols-4 gap-6 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
					{cards.map((c) => (
						<motion.div
							key={c.key}
							variants={cardVariants}
							layout
							whileHover="hover"
							onHoverStart={() => setHoveredKey(c.key)}
							onHoverEnd={() => setHoveredKey((k) => (k === c.key ? null : k))}
							className="rounded-xl"
						>
							<Card className={`transition-colors ${c.ring} ${c.bg}`}>
								<CardHeader className="pb-2">
									<div className={`text-sm font-medium ${c.text}`}>{c.label}</div>
								</CardHeader>
								<CardContent>
									<div className={`relative text-2xl font-semibold ${c.valueText} h-8 leading-8 whitespace-nowrap tabular-nums`}>
										<AnimatePresence mode="wait" initial={false}>
											{hoveredKey === c.key && c.hoverValue !== undefined ? (
												<motion.span key="hover" variants={valueVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex items-center">
													{c.hoverValue}
												</motion.span>
											) : (
												<motion.span key="value" variants={valueVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 flex items-center">
													{c.value}
												</motion.span>
											)}
										</AnimatePresence>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>


			</CardContent>
		</Card>
	);
}

