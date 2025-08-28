
import React from "react";
"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const fillColors = [
  "#16a34a",   // strong green
  "#22c55e",   // medium green
  "#4ade80",   // light green
  "#bbf7d0"    // very light green
];

const chartConfig = {
  count: {
    label: "Employees",
  },
  "Full Time": {
    label: "Full Time",
    color: "var(--chart-1)",
  },
  "Part Time": {
    label: "Part Time",
    color: "var(--chart-2)",
  },
  Provisionary: {
    label: "Provisionary",
    color: "var(--chart-3)",
  },
  Regular: {
    label: "Regular",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function EmployeeClassificationPie({ data }: { data: { classification: string; count: number }[] }) {
  // Assign fill color to each classification
  const chartData = data.map((entry, idx) => ({ ...entry, fill: fillColors[idx % fillColors.length] }));
  const [showLabels, setShowLabels] = React.useState(false);
  React.useEffect(() => {
  // Pie chart animation duration (ms) - increase for smoother effect
  const timeout = setTimeout(() => setShowLabels(true), 2000);
  return () => clearTimeout(timeout);
  }, [data]);
  // Custom label renderer for better visibility
  const renderLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    value
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    outerRadius: number;
    value: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 22; // move label a little outside the pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    // Only one line from arc edge to label, use a lighter green
    let textAnchor = "middle";
    if (midAngle < 45 || midAngle > 315) textAnchor = "start";
    else if (midAngle > 135 && midAngle < 225) textAnchor = "end";
    // Fade in both line and label together
    // Only show line and label after animation, with fade-in effect
    if (!showLabels) return null;
    return (
      <g>
        <line
          x1={cx + outerRadius * Math.cos(-midAngle * RADIAN)}
          y1={cy + outerRadius * Math.sin(-midAngle * RADIAN)}
          x2={x}
          y2={y}
          stroke="#4ade80"
          strokeWidth={2}
          style={{ opacity: 0, animation: "fadeInLine 0.7s forwards" }}
        />
        <text
          x={x}
          y={y}
          fill="#166534"
          fontSize={14}
          fontWeight="bold"
          textAnchor={textAnchor}
          dominantBaseline="central"
          style={{ textShadow: "0 1px 4px #fff, 0 1px 4px #fff", opacity: 0, animation: "fadeInLabel 0.7s forwards" }}
        >
          {value}
        </text>
      </g>
    );
  };
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Employee Classification</CardTitle>
        <CardDescription>Current Distribution</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="classification"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={renderLabel}
            >
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="classification" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
