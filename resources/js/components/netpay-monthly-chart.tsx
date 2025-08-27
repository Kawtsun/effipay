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
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `₱${(amount ?? 0).toLocaleString()}`
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
  const chartData = (data || []).map(p => ({ month: p.label, netpay: p.total }))

  const chartConfig = {
    netpay: {
      label: "Net Pay",
      // Force default green (match primary / focus color)
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
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel valueFormatter={(v) => formatCurrency(Number(v))} />}
            />
            <Bar dataKey="netpay" fill="var(--color-netpay)" radius={6} />
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


