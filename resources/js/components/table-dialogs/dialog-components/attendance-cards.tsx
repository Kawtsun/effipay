import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MetricValue = number | null | undefined;

type Metrics = {
	tardiness?: MetricValue;
	undertime?: MetricValue;
	overtime?: MetricValue;
	absences?: MetricValue;
};

type Props = {
	metrics: Metrics;
	/** When true, shows '-' for all values (e.g., no records this month). */
	isEmpty?: boolean;
	/** Optional title for the wrapper card. */
	title?: string;
	className?: string;
};

function formatHours(val: MetricValue, isEmpty?: boolean): string {
	if (isEmpty) return "-";
	if (val === null || val === undefined || Number.isNaN(Number(val))) return "-";
	return `${Number(val).toFixed(2)} hr(s)`;
}

export default function AttendanceCards({ metrics, isEmpty, title = "Attendance", className }: Props) {
		const cards = [
		{
			key: "tardiness",
			label: "Tardiness",
			value: formatHours(metrics.tardiness, isEmpty),
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
				// Neutral variant with strong dark support
				bg: "bg-zinc-50/80 dark:bg-zinc-900/40",
				ring: "ring-1 ring-zinc-200 dark:ring-zinc-700/60",
				text: "text-zinc-600 dark:text-zinc-300",
				valueText: "text-zinc-900 dark:text-zinc-100",
		},
	];

	return (
		<Card className={className}>
			<CardHeader className="pb-4">
				<CardTitle className="text-lg font-semibold">{title}</CardTitle>
			</CardHeader>
			<CardContent>
						<div className="grid grid-cols-4 gap-6 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
							{cards.map((c) => (
								<Card key={c.key} className={`transition-colors ${c.ring} ${c.bg}`}>
							<CardHeader className="pb-2">
								<div className={`text-sm font-medium ${c.text}`}>{c.label}</div>
							</CardHeader>
							<CardContent>
								<div className={`text-2xl font-semibold ${c.valueText}`}>{c.value}</div>
							</CardContent>
						</Card>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

