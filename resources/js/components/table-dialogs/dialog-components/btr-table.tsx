import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "framer-motion";
import type { TimeRecord } from "./btr-data-provider";

type Observance = { type?: string; label?: string; start_time?: string; is_automated?: boolean };

type Props = {
	selectedMonth: string;
	records: TimeRecord[];
	recordMap: Record<string, TimeRecord>;
	observanceMap: Record<string, Observance>;
	leaveDatesMap: Record<string, string>;
	isLoading: boolean;
	formatTime12Hour: (t?: string) => string;
	wrapInCard?: boolean;
};

function toTitleCase(s: string) {
	return s
		.replace(/[-_]+/g, " ")
		.toLowerCase()
		.replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function DayOfWeek({ dateStr }: { dateStr: string }) {
	const d = new Date(`${dateStr}T00:00:00`);
	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	return <span>{days[d.getDay()]}</span>;
}

export default function BTRTable({ selectedMonth, records, recordMap, observanceMap, leaveDatesMap, isLoading, formatTime12Hour, wrapInCard = true }: Props) {
	const [yStr, mStr] = selectedMonth ? selectedMonth.split("-") : ["", ""];
	const y = Number(yStr);
	const m = Number(mStr);
	const daysInMonth = y && m ? new Date(y, m, 0).getDate() : 0;
	const MAX_ROWS = 31; // keep table height consistent across 28/30/31-day months

	// Entrance/skeleton behavior consistent with AttendanceCards
	const [mounted, setMounted] = React.useState(false);
	React.useEffect(() => { setMounted(true); }, []);
	const shouldSkeleton = Boolean(isLoading || !mounted);

	// Motion variants copied to match AttendanceCards feel
	const containerVariants = {
		hidden: { opacity: 0, y: 6 },
		show: {
			opacity: 1,
			y: 0,
			transition: { duration: 0.28, ease: "easeOut", delay: 0.05 },
		},
	} as const;

	const headerVariants = {
		hidden: { opacity: 0, y: 4 },
		show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
	} as const;

		const tableHeader = (
		<TableHeader>
			<TableRow>
				<TableHead className="w-[140px]">Date</TableHead>
					<TableHead className="w-[120px]">Day</TableHead>
				<TableHead className="min-w-[160px]"><span className="sr-only">Label</span></TableHead>
				<TableHead className="w-[140px]">Time In</TableHead>
				<TableHead className="w-[140px]">Time Out</TableHead>
			</TableRow>
		</TableHeader>
	);

		const realTable = (
		<div className="w-full">
			<Table>
				{tableHeader}
				<TableBody>
					{daysInMonth === 0 ? (
						<TableRow>
							<TableCell colSpan={5} className="text-muted-foreground py-2">No month selected.</TableCell>
						</TableRow>
					) : (
						Array.from({ length: MAX_ROWS }).map((_, idx) => {
							// Render real rows for existing days; invisible placeholders for the rest to keep height stable
							if (idx >= daysInMonth) {
								return (
									<TableRow key={`ph-${idx}`} className="invisible">
										<TableCell className="py-2">—</TableCell>
										<TableCell className="py-2">—</TableCell>
										<TableCell className="py-2">—</TableCell>
										<TableCell className="py-2">—</TableCell>
										<TableCell className="py-2">—</TableCell>
									</TableRow>
								);
							}
							const day = idx + 1;
							const dateStr = `${yStr}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
							const rec: TimeRecord | undefined = recordMap[dateStr] ?? records.find(r => (r?.date ?? '').slice(0, 10) === dateStr);
							const label = leaveDatesMap[dateStr] || observanceMap[dateStr]?.label || observanceMap[dateStr]?.type;
							const pretty = label ? toTitleCase(String(label)) : "";

							// Prefer DB-native clock_*; then UI time_*; then camelCase fallbacks if present
							const tin = (rec?.clock_in ?? rec?.time_in ?? rec?.clockIn ?? rec?.timeIn) as string | undefined | null;
							const tout = (rec?.clock_out ?? rec?.time_out ?? rec?.clockOut ?? rec?.timeOut) as string | undefined | null;

							return (
								<TableRow key={dateStr}>
									<TableCell className="py-2">{dateStr}</TableCell>
									<TableCell className="py-2"><DayOfWeek dateStr={dateStr} /></TableCell>
									<TableCell className="py-2">
									{pretty ? (
										<Badge variant="outline" className="capitalize">{pretty}</Badge>
									) : null}
									</TableCell>
									<TableCell className="py-2">{formatTime12Hour(tin ?? undefined)}</TableCell>
									<TableCell className="py-2">{formatTime12Hour(tout ?? undefined)}</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</div>
	);

		const skeletonTable = (
		<div className="w-full">
			<Table>
				{tableHeader}
				<TableBody>
						{Array.from({ length: daysInMonth > 0 ? MAX_ROWS : 8 }).map((_, i) => (
						<TableRow key={`sk-${i}`}>
							<TableCell className="py-2"><Skeleton className="h-4 w-[100px]" /></TableCell>
								<TableCell className="py-2"><Skeleton className="h-4 w-[100px]" /></TableCell>
								<TableCell className="py-2">
									<div className="inline-flex items-center gap-1.5 px-2 rounded-md w-[136px] bg-secondary/60">
										<Skeleton className="h-3.5 w-3.5 rounded-sm" />
										<Skeleton className="h-3 w-[84px]" />
									</div>
								</TableCell>
							<TableCell className="py-2"><Skeleton className="h-4 w-[100px]" /></TableCell>
							<TableCell className="py-2"><Skeleton className="h-4 w-[100px]" /></TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);

		const animatedContent = (
			<div className="w-full">
				<AnimatePresence mode="wait" initial={false}>
					{shouldSkeleton ? (
						<motion.div
							key={`btr-skeleton-${selectedMonth}`}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0, transition: { duration: 0 } }}
							transition={{ duration: 0.16 }}
						>
							{skeletonTable}
						</motion.div>
					) : (
						<motion.div
							key={`btr-content-${selectedMonth}`}
							variants={containerVariants}
							initial="hidden"
							animate="show"
							exit={{ opacity: 0, transition: { duration: 0 } }}
						>
							{realTable}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		);

		if (!wrapInCard) return animatedContent;
	return (
		<Card>
				<CardHeader className="py-3">
					<AnimatePresence mode="wait" initial={false}>
						{shouldSkeleton ? (
							<motion.div key={`hdr-skel-${selectedMonth}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-5 w-28">
								<Skeleton className="h-5 w-full" />
							</motion.div>
						) : (
							<motion.div
								key={`hdr-title-${selectedMonth}`}
								variants={headerVariants}
								initial="hidden"
								animate="show"
								exit={{ opacity: 0, transition: { duration: 0 } }}
								className="h-5 w-28 overflow-hidden"
							>
								<CardTitle className="text-base">Daily Records</CardTitle>
							</motion.div>
						)}
					</AnimatePresence>
				</CardHeader>
			<CardContent className="pt-2">
					{animatedContent}
			</CardContent>
		</Card>
	);
}
