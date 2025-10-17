import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type SummaryTone = 'neutral' | 'brand' | 'info' | 'success' | 'warning'

export interface SummaryBadgeProps extends React.ComponentProps<typeof Badge> {
  children: React.ReactNode
  tone?: SummaryTone
  icon?: React.ReactNode
}

const toneClasses: Record<SummaryTone, string> = {
  neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  brand: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
}

/**
 * SummaryBadge
 * Wrapper over shadcn/ui Badge for compact summaries in headers, using
 * guideline tones and a generic summary icon by default.
 */
export function SummaryBadge({ children, className, variant = 'secondary', tone = 'brand', icon, ...props }: SummaryBadgeProps) {
  return (
    <Badge
      variant={variant}
      className={cn('gap-2 text-xs md:text-sm font-normal px-2.5 py-1', toneClasses[tone], className)}
      {...props}
    >
      {icon}
      {children}
    </Badge>
  )
}
