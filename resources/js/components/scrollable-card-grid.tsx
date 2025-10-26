import * as React from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ScrollableCardGridProps {
  className?: string
  height?: number | string // e.g., 420 or '420px' or '28rem'
  children: React.ReactNode
}

// Wraps a responsive 1/2/3-column grid inside a scrolling Card container.
// Default height ~420px to visually fit around ~3 rows of compact cards.
export function ScrollableCardGrid({ className, height = 420, children }: ScrollableCardGridProps) {
  const style = typeof height === 'number' ? { height: `${height}px` } : { height }
  return (
    <Card className={`p-2 ${className ?? ''}`} style={style}>
      <ScrollArea className="h-full pr-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {children}
        </div>
      </ScrollArea>
    </Card>
  )
}
