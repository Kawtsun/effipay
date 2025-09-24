import { ScrollArea } from '@/components/ui/scroll-area';
import React from 'react';

interface AppContentScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AppContentScrollArea
 * A sticky, full-height scrollable area with custom shadcn/ui scrollbar.
 * Fills available viewport height minus header (assumed 94px).
 */
export default function AppContentScrollArea({ children, className = '', style }: AppContentScrollAreaProps) {
  return (
    <ScrollArea
      className={`h-[calc(100vh-94px)] max-h-[calc(100vh-94px)] w-full overflow-auto bg-transparent ${className}`}
      style={style}
      type="auto"
    >
      <div className="px-0 py-0 pr-4 h-full">{children}</div>
    </ScrollArea>
  );
}
