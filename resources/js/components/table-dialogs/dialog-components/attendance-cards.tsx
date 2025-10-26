import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";
import { PhilippinePeso, Clock3, CircleHelp } from "lucide-react";
// Note: Summary badges are custom-styled divs to perfectly match skeleton sizing
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type MetricValue = number | null | undefined;

type Metrics = {
	tardiness?: MetricValue;
	undertime?: MetricValue;
	overtime?: MetricValue;
	absences?: MetricValue;
	// Provided by TimeKeepingDataProvider for month aggregate
	total_hours?: MetricValue;
	// Optional overtime breakdown and rates for computing peso values
	overtime_count_weekdays?: MetricValue;
	overtime_count_weekends?: MetricValue;
	rate_per_hour?: MetricValue;
	college_rate?: MetricValue;
};

type Props = {
	metrics: Metrics;
	/** When true, shows '-' for all values (e.g., no records this month). */
	isEmpty?: boolean;
	/** When true, shows loading skeletons for the whole card (e.g., initial load or month change). */
	isLoading?: boolean;
	/** Optional title for the wrapper card. */
	title?: string;
	className?: string;
	/** Optional explicit hourly rate (non-college). If omitted, falls back to metrics.rate_per_hour. */
	ratePerHour?: number;
	/** Optional explicit college hourly rate. If omitted, falls back to metrics.college_rate. */
	collegeRate?: number;
	/** Whether the current employee is a college instructor; controls which rate is used. */
	isCollegeInstructor?: boolean;
	/** Roles string to show in tooltip. */
	rolesText?: string | null;
};

function formatHours(val: MetricValue, isEmpty?: boolean): string {
	if (isEmpty) return "-";
	if (val === null || val === undefined || Number.isNaN(Number(val))) return "-";
	return `${Number(val).toFixed(2)} hr(s)`;
}

export default function AttendanceCards({ metrics, isEmpty, isLoading, title = "Attendance", className, ratePerHour, collegeRate, isCollegeInstructor, rolesText }: Props) {
		function formatAmount(val: number): string {
			return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		}

		const Money = ({ amount }: { amount: number }) => (
			<span className="inline-flex items-center gap-1">
				<PhilippinePeso className="h-[1.1em] w-[1.1em]" />
				{formatAmount(amount)}
			</span>
		);

		const [hoveredKey, setHoveredKey] = React.useState<string | null>(null);

		const rolesTooltip = React.useMemo(() => {
			const r = (rolesText ?? '').toString();
			if (!r) return null;
			// Normalize delimiters to line breaks for nicer display
			return r
				.split(/[,\n]+/)
				.map((s) => s.trim())
				.filter(Boolean);
		}, [rolesText]);

		const rolesTooltipText = React.useMemo(() => {
			if (!rolesTooltip || rolesTooltip.length === 0) return null;
			const toTitleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
			return rolesTooltip.map(toTitleCase).join(", ");
		}, [rolesTooltip]);

		const hourlyRate = React.useMemo(() => {
			const isCollege = typeof isCollegeInstructor === 'boolean' ? isCollegeInstructor : undefined;
			// Prefer explicit props; fallback to metrics
			const rateFromMetrics = Number(metrics.rate_per_hour ?? NaN);
			const rateFromProp = typeof ratePerHour === 'number' ? ratePerHour : NaN;
			const rateNonCollegeOrGeneral = Number.isFinite(rateFromProp) ? rateFromProp : rateFromMetrics;
			const rateCollegeLocalProp = typeof collegeRate === 'number' ? collegeRate : NaN;
			const rateCollegeLocalMetric = Number(metrics.college_rate ?? NaN);
			const rateCollegeResolved = Number.isFinite(rateCollegeLocalProp) ? rateCollegeLocalProp : rateCollegeLocalMetric;

			// If explicitly college, use college rate when valid; otherwise fall back to general rate_per_hour
			if (isCollege === true) {
				if (Number.isFinite(rateCollegeResolved) && rateCollegeResolved > 0) return rateCollegeResolved;
				return Number.isFinite(rateNonCollegeOrGeneral) ? rateNonCollegeOrGeneral : 0;
			}
			// If explicitly non-college, use general/non-college rate
			if (isCollege === false) {
				return Number.isFinite(rateNonCollegeOrGeneral) ? rateNonCollegeOrGeneral : 0;
			}
			// Unknown role: prefer a positive college rate if available, else general rate
			if (Number.isFinite(rateCollegeResolved) && rateCollegeResolved > 0) return rateCollegeResolved;
			return Number.isFinite(rateNonCollegeOrGeneral) ? rateNonCollegeOrGeneral : 0;
		}, [isCollegeInstructor, ratePerHour, collegeRate, metrics.rate_per_hour, metrics.college_rate]);

    const overtimeWeekdays = Number(metrics.overtime_count_weekdays ?? NaN);
    const overtimeWeekends = Number(metrics.overtime_count_weekends ?? NaN);

		const cards = [
		{
			key: "tardiness",
			label: "Tardiness",
			value: formatHours(metrics.tardiness, isEmpty),
			// When hovered, show peso equivalent if possible
			money: (() => {
				const hrs = Number(metrics.tardiness ?? NaN);
				if (isEmpty || !Number.isFinite(hrs) || !Number.isFinite(hourlyRate) || hourlyRate <= 0) return "-";
				return <Money amount={hrs * hourlyRate} />;
			})(),
				// Warmer amber tones with higher contrast + balanced dark mode
				bg: "bg-amber-50/80 dark:bg-amber-950/30",
				ring: "ring-1 ring-amber-200 dark:ring-amber-700/60",
				text: "text-amber-700 dark:text-amber-300",
				valueText: "text-amber-800 dark:text-amber-200",
		},
		{
			key: "undertime",
			label: "Undertime",
			value: formatHours(metrics.undertime, isEmpty),
			money: (() => {
				const hrs = Number(metrics.undertime ?? NaN);
				if (isEmpty || !Number.isFinite(hrs) || !Number.isFinite(hourlyRate) || hourlyRate <= 0) return "-";
				return <Money amount={hrs * hourlyRate} />;
			})(),
				// Softer rose palette: readable on both themes
				bg: "bg-rose-50/80 dark:bg-rose-950/30",
				ring: "ring-1 ring-rose-200 dark:ring-rose-700/60",
				text: "text-rose-700 dark:text-rose-300",
				valueText: "text-rose-800 dark:text-rose-200",
		},
		{
			key: "overtime",
			label: "Overtime",
			value: formatHours(metrics.overtime, isEmpty),
			money: (() => {
				if (isEmpty || !Number.isFinite(hourlyRate) || hourlyRate <= 0) return "-";
				if (!Number.isFinite(overtimeWeekdays) || !Number.isFinite(overtimeWeekends)) return "-";
				const weekdayPay = hourlyRate * 0.25 * (overtimeWeekdays || 0);
				const weekendPay = hourlyRate * 0.30 * (overtimeWeekends || 0);
				return <Money amount={weekdayPay + weekendPay} />;
			})(),
				// Cooler sky tones for positive-ish emphasis
				bg: "bg-sky-50/80 dark:bg-sky-950/30",
				ring: "ring-1 ring-sky-200 dark:ring-sky-700/60",
				text: "text-sky-700 dark:text-sky-300",
				valueText: "text-sky-800 dark:text-sky-200",
		},
		{
			key: "absences",
			label: "Absences",
			value: formatHours(metrics.absences, isEmpty),
			money: (() => {
				const hrs = Number(metrics.absences ?? NaN);
				if (isEmpty || !Number.isFinite(hrs) || !Number.isFinite(hourlyRate) || hourlyRate <= 0) return "-";
				return <Money amount={hrs * hourlyRate} />;
			})(),
				// Neutral variant with strong dark support
				bg: "bg-zinc-50/80 dark:bg-zinc-900/40",
				ring: "ring-1 ring-zinc-200 dark:ring-zinc-700/60",
				text: "text-zinc-600 dark:text-zinc-300",
				valueText: "text-zinc-900 dark:text-zinc-100",
		},
	];

	// Motion variants for subtle lift/scale and content crossfade
	const cardHover = {
		initial: { y: 0, scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" },
		hover: {
			y: -4,
			scale: 1.02,
			boxShadow: "0 12px 22px rgba(0,0,0,0.12)",
			transition: { duration: 0.15 },
		},
	};

	const valueVariants = {
		initial: { opacity: 0, y: 4 },
		animate: { opacity: 1, y: 0, transition: { duration: 0.16 } },
		exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
	};

	// Entrance animation for content after skeleton
	const containerVariants = {
		hidden: { opacity: 0, y: 6 },
		show: {
			opacity: 1, y: 0,
			transition: { staggerChildren: 0.08, delayChildren: 0.05, when: "beforeChildren" },
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 8 },
		show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
	};

	// Combine hover and entrance variants for cards
	const cardVariants = { ...cardHover, ...itemVariants } as const;

	// Header (title) entrance after skeleton
	const headerVariants = {
		hidden: { opacity: 0, y: 4 },
		show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
	} as const;

	// Ensure skeleton shows on first paint to avoid flash of content before parent toggles loading
	const [mounted, setMounted] = React.useState(false);
	React.useEffect(() => { setMounted(true); }, []);
	const shouldSkeleton = Boolean(isLoading || !mounted);

	return (
		<Card className={className}>
			<CardHeader className="pb-4">
				<AnimatePresence mode="wait" initial={false}>
					{shouldSkeleton ? (
						<motion.div key="header-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-6 w-32">
							<Skeleton className="h-6 w-full" />
						</motion.div>
					) : (
						<motion.div key="header-title" variants={headerVariants} initial="hidden" animate="show" exit="hidden" className="h-6 w-32 overflow-hidden">
							<CardTitle className="text-lg font-semibold leading-6 truncate">{title}</CardTitle>
						</motion.div>
					)}
				</AnimatePresence>
			</CardHeader>
			<CardContent className="min-h-48">
				<AnimatePresence mode="wait" initial={false}>
					{shouldSkeleton ? (
						// Skeleton state (match layout to avoid jumps)
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
												<div className={`relative text-2xl font-semibold ${c.valueText} h-8 leading-8 whitespace-nowrap tabular-nums w-[140px] overflow-hidden`}>
													<div className="absolute inset-0 flex items-center">
														<Skeleton className="h-6" />
													</div>
												</div>
											</CardContent>
										</Card>
									</div>
								))}
							</div>

							<div className="mt-4 text-sm text-muted-foreground flex items-center gap-6 flex-wrap">
								<div className="flex items-center gap-1">
									<div className="inline-flex items-center w-[120px]">
										<Skeleton className="h-4 w-full" />
									</div>
									<div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md w-[112px] bg-secondary/60">
										<Skeleton className="h-3.5 w-3.5 rounded-sm" />
										<Skeleton className="h-3 w-[64px]" />
									</div>
								</div>
								<div className="flex items-center gap-1">
									<div className="inline-flex items-center w-[168px]">
										<Skeleton className="h-4 w-full" />
									</div>
									<div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md w-[136px] bg-secondary/60">
										<Skeleton className="h-3.5 w-3.5 rounded-sm" />
										<Skeleton className="h-3 w-[84px]" />
									</div>
								</div>
							</div>
						</motion.div>
					) : (
						// Content state
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
														{hoveredKey === c.key ? (
															<motion.span
																key="money"
																variants={valueVariants}
																initial="initial"
																animate="animate"
																exit="exit"
																className="absolute inset-0 flex items-center"
															>
																{c.money}
															</motion.span>
														) : (
															<motion.span
																key="value"
																variants={valueVariants}
																initial="initial"
																animate="animate"
																exit="exit"
																className="absolute inset-0 flex items-center"
															>
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

							{/* Total hours summary */}
							<motion.div className="mt-4 text-sm text-muted-foreground flex items-center gap-6 flex-wrap" variants={itemVariants} layout>
								{/* Rate per hour */}
								<div className="flex items-center gap-1">
									<span className="inline-flex items-center gap-1 w-[120px] leading-6">Rate per hour:
										{rolesTooltip && rolesTooltip.length > 0 && (
											<Tooltip>
												<TooltipTrigger asChild>
													<button type="button" aria-label="View roles used for this rate" className="inline-flex items-center text-muted-foreground hover:text-foreground focus:outline-none">
														<CircleHelp className="h-3.5 w-3.5" />
													</button>
												</TooltipTrigger>
												<TooltipContent>
													<div className="max-w-xs whitespace-pre-wrap">{rolesTooltipText}</div>
												</TooltipContent>
											</Tooltip>
										)}
									</span>
									<div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md w-[112px] bg-secondary/60">
										<PhilippinePeso className="h-3.5 w-3.5" />
										<span className="font-medium tabular-nums text-foreground/90">
											{!Number.isFinite(hourlyRate) || hourlyRate <= 0 ? "-" : formatAmount(hourlyRate)}
										</span>
									</div>
								</div>

								{/* Total hours */}
								<div className="flex items-center gap-1">
									<span className="inline-flex items-center w-[168px] leading-6">Total hours this month:</span>
									<div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md w-[136px] bg-secondary/60">
										<Clock3 className="h-3.5 w-3.5" />
										<span className="font-medium tabular-nums text-foreground/90">{formatHours(metrics.total_hours, isEmpty)}</span>
									</div>
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</CardContent>
		</Card>
	);
}

