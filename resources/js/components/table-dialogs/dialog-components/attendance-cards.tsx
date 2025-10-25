import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { PhilippinePeso } from "lucide-react";

type MetricValue = number | null | undefined;

type Metrics = {
	tardiness?: MetricValue;
	undertime?: MetricValue;
	overtime?: MetricValue;
	absences?: MetricValue;
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
	/** Optional title for the wrapper card. */
	title?: string;
	className?: string;
	/** Optional explicit hourly rate (non-college). If omitted, falls back to metrics.rate_per_hour. */
	ratePerHour?: number;
	/** Optional explicit college hourly rate. If omitted, falls back to metrics.college_rate. */
	collegeRate?: number;
	/** Whether the current employee is a college instructor; controls which rate is used. */
	isCollegeInstructor?: boolean;
};

function formatHours(val: MetricValue, isEmpty?: boolean): string {
	if (isEmpty) return "-";
	if (val === null || val === undefined || Number.isNaN(Number(val))) return "-";
	return `${Number(val).toFixed(2)} hr(s)`;
}

export default function AttendanceCards({ metrics, isEmpty, title = "Attendance", className, ratePerHour, collegeRate, isCollegeInstructor }: Props) {
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

		const hourlyRate = React.useMemo(() => {
			const isCollege = typeof isCollegeInstructor === 'boolean' ? isCollegeInstructor : undefined;
			const rateNonCollege = typeof ratePerHour === 'number' ? ratePerHour : Number(metrics.rate_per_hour ?? NaN);
			const rateCollegeLocal = typeof collegeRate === 'number' ? collegeRate : Number(metrics.college_rate ?? NaN);
			if (isCollege === true) return Number.isFinite(rateCollegeLocal) ? rateCollegeLocal : 0;
			if (isCollege === false) return Number.isFinite(rateNonCollege) ? rateNonCollege : 0;
			if (Number.isFinite(rateCollegeLocal) && (rateCollegeLocal as number) > 0) return rateCollegeLocal as number;
			return Number.isFinite(rateNonCollege) ? (rateNonCollege as number) : 0;
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
		animate: { opacity: 1, y: 0, transition: { duration: 0.12 } },
		exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
	};

	return (
		<Card className={className}>
			<CardHeader className="pb-4">
				<CardTitle className="text-lg font-semibold">{title}</CardTitle>
			</CardHeader>
			<CardContent>
					<div className="grid grid-cols-4 gap-6 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
						{cards.map((c) => (
							<motion.div
								key={c.key}
								initial="initial"
								whileHover="hover"
								variants={cardHover}
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
			</CardContent>
		</Card>
	);
}

