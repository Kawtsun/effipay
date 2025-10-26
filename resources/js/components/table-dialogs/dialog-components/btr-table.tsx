import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
	const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	return <span>{days[d.getDay()]}</span>;
}

export default function BTRTable({ selectedMonth, records, recordMap, observanceMap, leaveDatesMap, isLoading, formatTime12Hour, wrapInCard = true }: Props) {
	const [yStr, mStr] = selectedMonth ? selectedMonth.split("-") : ["", ""];
	const y = Number(yStr);
	const m = Number(mStr);
	const daysInMonth = y && m ? new Date(y, m, 0).getDate() : 0;

	const content = (
		<div className="w-full">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[140px]">Date</TableHead>
						<TableHead className="w-[80px]">Day</TableHead>
						<TableHead className="min-w-[160px]">Label</TableHead>
						<TableHead className="w-[140px]">Time In</TableHead>
						<TableHead className="w-[140px]">Time Out</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading && daysInMonth === 0 && (
						Array.from({ length: 8 }).map((_, i) => (
							<TableRow key={`sk-${i}`}>
								<TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
								<TableCell><Skeleton className="h-4 w-[48px]" /></TableCell>
								<TableCell><Skeleton className="h-4 w-[160px]" /></TableCell>
								<TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
								<TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
							</TableRow>
						))
					)}
					{!isLoading && daysInMonth === 0 && (
						<TableRow>
							<TableCell colSpan={5} className="text-muted-foreground">No month selected.</TableCell>
						</TableRow>
					)}
					{daysInMonth > 0 && (
						Array.from({ length: daysInMonth }).map((_, idx) => {
							const day = idx + 1;
							const dateStr = `${yStr}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
							const rec: TimeRecord | undefined = recordMap[dateStr] ?? records.find(r => (r?.date ?? '').slice(0, 10) === dateStr);
							const label = leaveDatesMap[dateStr] || observanceMap[dateStr]?.label || observanceMap[dateStr]?.type;
							const pretty = label ? toTitleCase(String(label)) : "";

														// Prefer DB-native clock_*; then UI time_*; then camelCase fallbacks if present
														const tin = (rec?.clock_in ?? rec?.time_in ?? rec?.clockIn ?? rec?.timeIn) as
															| string
															| undefined
															| null;
														const tout = (rec?.clock_out ?? rec?.time_out ?? rec?.clockOut ?? rec?.timeOut) as
															| string
															| undefined
															| null;

							return (
								<TableRow key={dateStr}>
									<TableCell>{dateStr}</TableCell>
									<TableCell><DayOfWeek dateStr={dateStr} /></TableCell>
									<TableCell>
										{pretty ? (
											<Badge variant="outline" className="capitalize">{pretty}</Badge>
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>
									  <TableCell>{formatTime12Hour(tin ?? undefined)}</TableCell>
									  <TableCell>{formatTime12Hour(tout ?? undefined)}</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</div>
	);

	if (!wrapInCard) return content;
	return (
		<Card>
			<CardHeader className="py-3">
				<CardTitle className="text-base">Daily Records</CardTitle>
			</CardHeader>
			<CardContent className="pt-2">
				{content}
			</CardContent>
		</Card>
	);
}
