import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { MonthRangePicker } from "../../ui/month-range-picker";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PhilippinePeso, CircleHelp, Banknote, BanknoteArrowDown, ReceiptText, MinusCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
	title?: string;
	className?: string;
    /** When true, shows loading skeletons for the whole card (e.g., initial load or month change). */
    isLoading?: boolean;

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
		base_salary?: number | null;
		college_rate?: number | null;
		honorarium?: number | null;
		/** Other adjustments applied to payroll (positive or negative) */
		adjustments?: number | null;
		sss?: number | null;
		philhealth?: number | null;
		pag_ibig?: number | null;
		withholding_tax?: number | null;
		peraa_con?: number | null;
		sss_salary_loan?: number | null;
		sss_calamity_loan?: number | null;
		pagibig_multi_loan?: number | null;
		pagibig_calamity_loan?: number | null;
		tuition?: number | null;
		china_bank?: number | null;
		tea?: number | null;
	} | null;
	monthlyPayrollData?: { payrolls: Array<{ id: number; payroll_date: string }> } | null;
	earnings?: {
		base_salary?: number | null;
		college_rate?: number | null;
		honorarium?: number | null;
		total_hours?: number | null;
		double_pay?: number | null;
		holiday_worked?: Array<{ date: string; type?: string; hours?: number; amount?: number }> | null;
	};
};

function formatAmount(n?: number | null): string {
	if (n === null || n === undefined || !Number.isFinite(Number(n))) return "0.00";
	return `${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAmountPlain(n?: number | null): string {
	if (n === null || n === undefined || !Number.isFinite(Number(n))) return "0.00";
	return `${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function halfAmount(n?: number | null): string {
	if (n === null || n === undefined || !Number.isFinite(Number(n))) return "0.00";
	return `${Number(n / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Normalize hour strings like "-", "0", "1.5 hr(s)", "1,234.5" to a two-decimal label
function formatHoursLabel(s?: string | null): string {
	const raw = (s ?? "").toString().trim();
	if (!raw || raw === "-" || raw.toLowerCase() === "n/a") return "0.00 hr(s)";
	const match = raw.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
	const num = match ? Number(match[0]) : Number(raw);
	if (!Number.isFinite(num)) return "0.00 hr(s)";
	return `${num.toFixed(2)} hr(s)`;
}

export default function ReportCards({
	title = "Salary & Contributions",
	className,
	isLoading,
	selectedMonth,
	availableMonths,
	onMonthChange,
	getSummaryCardAmount,
	getSummaryCardHours,
	selectedPayroll,
	earnings,
}: Props) {
	const grossPay = selectedPayroll?.gross_pay ?? null;
	const totalDeductions = selectedPayroll?.total_deductions ?? null;
	const netPay = selectedPayroll?.net_pay ?? null;

	// Consistent layout and styles with AttendanceCards
	// Normalize values coming from provider (e.g., "₱ -", "-", "0", "1,234.50").
	// Always render a 2-decimal string and default to "0.00" when empty/invalid.
	const stripPeso = (s?: string | null) => {
		const raw = (s ?? "").toString();
		// remove leading peso and trim
		const cleaned = raw.replace(/^\s*[₱]\s*/u, "").trim();
		if (cleaned === "" || cleaned === "-" || cleaned.toLowerCase() === "n/a") {
			return "0.00";
		}
		const numeric = Number(cleaned.replace(/,/g, ""));
		if (!Number.isFinite(numeric)) return "0.00";
		return numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	};

	const PesoValue = ({ text }: { text?: string | null }) => (
		<span className="inline-flex items-center gap-1">
			<PhilippinePeso className="h-[1.1em] w-[1.1em]" />
			<span className="tabular-nums">{stripPeso(text)}</span>
		</span>
	);
	const cards = [
		{
			key: "tardiness",
			label: "Tardiness",
			value: <PesoValue text={getSummaryCardAmount("tardiness")} />,
			hoverValue: formatHoursLabel(getSummaryCardHours("tardiness")),
			bg: "bg-amber-50/80 dark:bg-amber-950/30",
			ring: "ring-1 ring-amber-200 dark:ring-amber-700/60",
			text: "text-amber-700 dark:text-amber-300",
			valueText: "text-amber-800 dark:text-amber-200",
		},
		{
			key: "undertime",
			label: "Undertime",
			value: <PesoValue text={getSummaryCardAmount("undertime")} />,
			hoverValue: formatHoursLabel(getSummaryCardHours("undertime")),
			bg: "bg-rose-50/80 dark:bg-rose-950/30",
			ring: "ring-1 ring-rose-200 dark:ring-rose-700/60",
			text: "text-rose-700 dark:text-rose-300",
			valueText: "text-rose-800 dark:text-rose-200",
		},
		{
			key: "overtime",
			label: "Overtime",
			value: <PesoValue text={getSummaryCardAmount("overtime")} />,
			hoverValue: formatHoursLabel(getSummaryCardHours("overtime")),
			bg: "bg-sky-50/80 dark:bg-sky-950/30",
			ring: "ring-1 ring-sky-200 dark:ring-sky-700/60",
			text: "text-sky-700 dark:text-sky-300",
			valueText: "text-sky-800 dark:text-sky-200",
		},
		{
			key: "absences",
			label: "Absences",
			value: <PesoValue text={getSummaryCardAmount("absences")} />,
			hoverValue: formatHoursLabel(getSummaryCardHours("absences")),
			bg: "bg-zinc-50/80 dark:bg-zinc-900/40",
			ring: "ring-1 ring-zinc-200 dark:ring-zinc-700/60",
			text: "text-zinc-600 dark:text-zinc-300",
			valueText: "text-zinc-900 dark:text-zinc-100",
		},
		{
			key: "gross_pay",
			label: "Gross Pay",
			value: <PesoValue text={formatAmount(grossPay)} />,
			// static on hover
			hoverValue: undefined,
			bg: "bg-zinc-50/80 dark:bg-zinc-900/40",
			ring: "ring-1 ring-zinc-200 dark:ring-zinc-700/60",
			text: "text-zinc-600 dark:text-zinc-300",
			valueText: "text-zinc-900 dark:text-zinc-100",
		},
		{
			key: "total_deductions",
			label: "Total Deductions",
			value: <PesoValue text={formatAmount(totalDeductions)} />,
			hoverValue: undefined,
			bg: "bg-amber-50/80 dark:bg-amber-950/30",
			ring: "ring-1 ring-amber-200 dark:ring-amber-700/60",
			text: "text-amber-700 dark:text-amber-300",
			valueText: "text-amber-800 dark:text-amber-200",
		},
		{
			key: "net_pay",
			label: "Net Pay",
			value: <PesoValue text={formatAmount(netPay)} />,
			hoverValue: undefined,
			bg: "bg-green-50/80 dark:bg-green-950/30",
			ring: "ring-1 ring-green-200 dark:ring-green-700/60",
			text: "text-green-700 dark:text-green-300",
			valueText: "text-green-800 dark:text-green-200",
		},
		{
			key: "per_payroll",
			label: "Per Payroll",
			value: <PesoValue text={halfAmount(netPay)} />,
			hoverValue: undefined,
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

	// Entrance animation container (match AttendanceCards)
	const containerVariants = {
		hidden: { opacity: 0, y: 6 },
		show: {
			opacity: 1,
			y: 0,
			transition: { staggerChildren: 0.08, delayChildren: 0.05, when: "beforeChildren" },
		},
	} as const;

	// Ensure first-paint skeleton to avoid flash before provider sets loading
	const [mounted, setMounted] = React.useState(false);
	React.useEffect(() => { setMounted(true); }, []);
	// Consumers can optionally drive loading by passing empty provider state on first load/month switch.
	// Additionally, if there are no available months for the MonthRangePicker, keep showing skeleton
	// to match the AttendanceCards UX in Timekeeping (avoid showing zeroed content without a month).
	const hasMonths = Array.isArray(availableMonths) && availableMonths.length > 0;
	// We infer loading conservatively: before mount, show skeleton; also when no months yet.
	const shouldSkeleton = Boolean(isLoading || !mounted || !hasMonths);

	// Match attendance-cards logic: no measured height lock or buffer

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

			<CardContent className="min-h-48">
				<div>
				<AnimatePresence mode="wait" initial={false}>
					{shouldSkeleton ? (
						// Skeleton state (match AttendanceCards sizing and spacing)
						<motion.div
							key="skeleton"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="space-y-4"
						>
							<div className="grid grid-cols-4 gap-6 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
								{cards.map((c) => (
									<div key={c.key} className="rounded-xl">
										<Card className={`transition-colors ${c.ring} ${c.bg}`}>
											<CardHeader className="pb-2">
												<Skeleton className="h-4 w-24" />
											</CardHeader>
											<CardContent>
												<div className={`relative text-2xl font-semibold ${c.valueText} h-8 leading-8 whitespace-nowrap tabular-nums`}>
													<div className="absolute inset-0 flex items-center">
														<Skeleton className="h-6" />
													</div>
												</div>
											</CardContent>
										</Card>
									</div>
								))}
							</div>

							{/* Skeleton for detailed breakdown: show a few placeholder rows per column */}
							<div className="mt-6 grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 max-[900px]:grid-cols-2 max-[700px]:grid-cols-1">
								{/* Earnings column skeleton */}
								<section>
										<Skeleton className="h-5 w-24 mb-2" />
									<div className="space-y-2">
											{Array.from({ length: 4 }).map((_, i) => (
											<div key={i} className="flex items-center justify-between">
													<Skeleton className="h-5 w-28" />
												<div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md w-[136px] bg-secondary/60">
													<Skeleton className="h-3.5 w-3.5 rounded-sm" />
													<Skeleton className="h-3 w-[84px]" />
												</div>
											</div>
										))}
									</div>
								</section>

								<Separator orientation="vertical" className="max-[900px]:hidden h-full" />

								{/* Contributions column skeleton */}
								<section>
										<Skeleton className="h-5 w-28 mb-2" />
									<div className="space-y-2">
										{Array.from({ length: 4 }).map((_, i) => (
											<div key={i} className="flex items-center justify-between">
												<Skeleton className="h-5 w-24" />
												<div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md w-[136px] bg-secondary/60">
													<Skeleton className="h-3.5 w-3.5 rounded-sm" />
													<Skeleton className="h-3 w-[84px]" />
												</div>
											</div>
										))}
									</div>
								</section>

								<Separator orientation="vertical" className="max-[900px]:hidden h-full" />

								{/* Loans column skeleton */}
								<section>
										<Skeleton className="h-5 w-16 mb-2" />
									<div className="space-y-2">
										{/* First: 4 loan rows */}
										{Array.from({ length: 4 }).map((_, i) => (
											<div key={`loan-${i}`} className="flex items-center justify-between">
												<Skeleton className="h-5 w-28" />
												<div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md w-[136px] bg-secondary/60">
													<Skeleton className="h-3.5 w-3.5 rounded-sm" />
													<Skeleton className="h-3 w-[84px]" />
												</div>
											</div>
										))}

										{/* Subsection header: Other Deductions */}
										<Skeleton className="h-5 w-32 mt-3 mb-2" />

										{/* Then: 3 other deduction rows */}
										{Array.from({ length: 3 }).map((_, i) => (
											<div key={`other-${i}`} className="flex items-center justify-between">
												<Skeleton className="h-5 w-24" />
												<div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md w-[136px] bg-secondary/60 pb-9">
													<Skeleton className="h-3.5 w-3.5 rounded-sm" />
													<Skeleton className="h-3 w-[84px]" />
												</div>
											</div>
										))}
									</div>
								</section>
							</div>
						</motion.div>
					) : (
						// Content state with entrance animation
						<motion.div key="content" variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
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
							{/* Detailed breakdown using compact label + badge rows */}
							<div className="mt-6 grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 max-[900px]:grid-cols-2 max-[700px]:grid-cols-1">
								{/* Earnings */}
								<section>
									<div className="mb-2 text-sm font-medium text-foreground inline-flex items-center gap-2 whitespace-nowrap">
										<Banknote className="h-5 w-5 text-primary dark:text-primary-foreground" />
										Earnings
									</div>
									<div className="space-y-2 text-sm">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">Base Salary</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmount(earnings?.base_salary ?? null)}</span>
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">Rate per Hour (College)</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(selectedPayroll?.college_rate ?? null)}</span>
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">Honorarium</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(earnings?.honorarium ?? null)}</span>
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">College/GSP</span>
											<div className="inline-flex items-center gap-2">
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															aria-label="View College/GSP calculation"
															className="inline-flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
														>
															<CircleHelp className="h-3.5 w-3.5" />
														</button>
													</TooltipTrigger>
													<TooltipContent>
														{(() => {
															const rate = Number(selectedPayroll?.college_rate ?? NaN);
															const hours = Number(earnings?.total_hours ?? NaN);
															if (!Number.isFinite(rate) || !Number.isFinite(hours) || rate <= 0 || hours <= 0) {
																return <span>No data yet</span>;
															}
															return (
																<div className="whitespace-pre-wrap">
																	₱{formatAmountPlain(rate)} × {hours.toFixed(2)} hr(s)
																	{" = "}
																	₱{formatAmountPlain(rate * hours)}
																</div>
															);
														})()}
													</TooltipContent>
												</Tooltip>
												<Badge variant="outline" className="gap-1">
													<PhilippinePeso className="h-3.5 w-3.5" />
													<span className="font-medium tabular-nums">
														{(() => {
															const rate = Number(selectedPayroll?.college_rate ?? NaN);
															const hours = Number(earnings?.total_hours ?? NaN);
															if (!Number.isFinite(rate) || !Number.isFinite(hours) || rate <= 0 || hours <= 0) return "0.00";
															return formatAmountPlain(rate * hours);
														})()}
													</span>
												</Badge>
											</div>
											{/* close flex container */}
										</div>
										{/* Double Pay row (after College/GSP) with details popup; icon placed left of value */}
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">Double Pay</span>
											<div className="inline-flex items-center gap-2">
												<Tooltip>
													<TooltipTrigger asChild>
														<button
															type="button"
															aria-label="View Double Pay details"
															className="inline-flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
														>
															<CircleHelp className="h-3.5 w-3.5" />
														</button>
													</TooltipTrigger>
													<TooltipContent>
														{(() => {
															const list = earnings?.holiday_worked ?? null;
															if (!list || list.length === 0) return <span>No data yet</span>;
															return (
																<div className="whitespace-pre-wrap">
																	{list.map((h, idx) => {
																		const d = typeof h.date === 'string' ? new Date(h.date) : null;
																		const dateStr = d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : String(h.date ?? '');
																		// Hide internal marker "automated-holiday"; keep any other provided type
																		const typeRaw = (h.type || '').toString();
																		const typeStr = typeRaw === 'automated-holiday' ? '' : typeRaw.replace('-', ' ');
																		const hoursStr = typeof h.hours === 'number' ? `${h.hours.toFixed(2)}h` : '';
																		const amtStr = typeof h.amount === 'number' ? `₱${Number(h.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '';
																		return <div key={idx}>{dateStr} {typeStr ? `(${typeStr})` : ''} {hoursStr ? `• ${hoursStr}` : ''} {amtStr ? `= ${amtStr}` : ''}</div>;
																	})}
																</div>
															);
														})()}
													</TooltipContent>
												</Tooltip>
												<Badge variant="outline" className="gap-1">
													<PhilippinePeso className="h-3.5 w-3.5" />
													<span className="font-medium tabular-nums">{formatAmountPlain(earnings?.double_pay ?? null)}</span>
												</Badge>
											</div>
										</div>
										{/* Adjustments row (conditionally rendered) */}
										{(() => {
											const adj = Number(selectedPayroll?.adjustments ?? NaN);
											if (!Number.isFinite(adj) || adj === 0) return null;
											return (
												<div className="flex items-center justify-between">
													<span className="text-muted-foreground whitespace-nowrap">Adjustments</span>
													<Badge variant="outline" className="gap-1">
														<PhilippinePeso className="h-3.5 w-3.5" />
														<span className="font-medium tabular-nums">{formatAmountPlain(adj)}</span>
													</Badge>
												</div>
											);
										})()}
										{/* close space-y wrapper */}
									</div>
								</section>

								{/* Vertical separator (hidden on <=900px) */}
								<Separator orientation="vertical" className="max-[900px]:hidden h-full" />

								{/* Contributions */}
								<section>
									<div className="mb-2 text-sm font-medium text-foreground inline-flex items-center gap-2 whitespace-nowrap">
										<BanknoteArrowDown className="h-5 w-5 text-primary dark:text-primary-foreground"/>
										Contribution
									</div>
									<div className="space-y-2 text-sm">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">SSS</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(selectedPayroll?.sss ?? null)}</span>
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">PhilHealth</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(selectedPayroll?.philhealth ?? null)}</span>
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">Pag-IBIG</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(selectedPayroll?.pag_ibig ?? null)}</span>
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">Withholding Tax</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(selectedPayroll?.withholding_tax ?? null)}</span>
											</Badge>
										</div>
									</div>
								</section>

								{/* Vertical separator (hidden on <=900px) */}
								<Separator orientation="vertical" className="max-[900px]:hidden h-full" />

								{/* Loans + Other Deductions */}
								<section>
									<div className="mb-2 text-sm font-medium text-foreground inline-flex items-center gap-2 whitespace-nowrap">
										<ReceiptText className="h-5 w-5 text-primary dark:text-primary-foreground"/>
										Loan
									</div>
									<div className="space-y-2 text-sm">
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">SSS Salary Loan</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(selectedPayroll?.sss_salary_loan ?? null)}</span>
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">SSS Calamity Loan</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(selectedPayroll?.sss_calamity_loan ?? null)}</span>
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">Pag-IBIG Multi-purpose Loan</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(selectedPayroll?.pagibig_multi_loan ?? null)}</span>
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">Pag-IBIG Calamity Loan</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(selectedPayroll?.pagibig_calamity_loan ?? null)}</span>
											</Badge>
										</div>


										{/* Subsection: Other Deductions */}
										<div className="mt-3 mb-2 text-sm font-medium text-foreground inline-flex items-center gap-2 whitespace-nowrap">
											<MinusCircle className="h-5 w-5 text-primary dark:text-primary-foreground"/>
											Other Deductions
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">Tuition</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(selectedPayroll?.tuition ?? null)}</span>
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">China Bank</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(selectedPayroll?.china_bank ?? null)}</span>
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-muted-foreground whitespace-nowrap">TEA</span>
											<Badge variant="outline" className="gap-1">
												<PhilippinePeso className="h-3.5 w-3.5" />
												<span className="font-medium tabular-nums">{formatAmountPlain(selectedPayroll?.tea ?? null)}</span>
											</Badge>
										</div>
									</div>
								</section>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
				</div>
			</CardContent>
		</Card>
	);
}

