"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type Point = { key: string; label: string; total: number }

export function formatCurrency(amount: number) {
  try {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `₱${Number(amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}

export default function NetpayMonthlyChart({
  title = "Overview",
  description = "Last 12 months",
  data = [],
}: {
  title?: string
  description?: string
  data: Point[]
}) {
  // Sort months so January is first, assuming label is month name (e.g., 'Jan', 'Feb', ...)
  const monthOrder = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const chartData = (data || [])
    .map(p => ({ month: p.label, netpay: p.total }))
    .sort((a, b) => monthOrder.indexOf(a.month.slice(0, 3)) - monthOrder.indexOf(b.month.slice(0, 3)));

  const chartConfig = {
    netpay: {
      label: "Employees' Net Pay (₱)",
      // Use default green (primary) color
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig



  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-[280px]">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value).slice(0, 3)}
              label={{
                value: "Month",
                position: "insideBottomRight",
                offset: -5,
                style: { fill: "#22c55e", fontWeight: 600, fontSize: 13 }, // green
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                hideLabel={false}
                labelFormatter={(_: unknown, payload: any[]) => {
                  if (!payload?.length) return null;
                  const { month, netpay } = payload[0]?.payload || {};
                  return (
                    <span>
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>Net Pay</span><br />
                      <span style={{ fontSize: 13 }}>{month}: <b>{formatCurrency(Number(netpay))}</b></span>
                    </span>
                  );
                }}
              />}
            />
            <Bar dataKey="netpay" fill="var(--color-primary)" radius={6} isAnimationActive={true} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up this year <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total net pay for the last 12 months
        </div>
      </CardFooter>
    </Card>
  )
}


